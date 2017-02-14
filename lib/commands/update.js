/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const chalk = require( 'chalk' );
const getLogger = require( '../utils/getlogger' );

module.exports = {
	/**
	 * @param {Object} data
	 * @param {String} data.packageName Name of current package to process.
	 * @param {Options} data.options The options object.
	 * @param {Repository} data.repository
	 * @param {Logger} logger An instance of logger.
	 * @returns {Promise}
	 */
	execute( data, logger = getLogger() ) {
		const bootstrapCommand = require( './bootstrap' );
		const execCommand = require( './exec' );

		return new Promise( ( resolve, reject ) => {
			const destinationPath = path.join( data.options.packages, data.repository.directory );

			// Package is not cloned.
			if ( !fs.existsSync( destinationPath ) ) {
				logger.info( `Package "${ data.packageName }" was not found. Cloning...` );

				const bootstrapOptions = {
					options: data.options,
					packageName: data.packageName,
					repository: data.repository
				};

				return bootstrapCommand.execute( bootstrapOptions, logger )
					.then( ( response ) => {
						response.logs = logger.all();

						resolve( response );
					} )
					.catch( reject );
			}

			execCommand.execute( getExecData( 'git status -s' ) )
				.then( ( response ) => {
					const stdout = response.logs.info.join( '\n' ).trim();

					if ( stdout ) {
						logger.error( `Package "${ data.packageName }" has uncommitted changes. Aborted.` );

						return Promise.reject();
					}
				} )
				.then( () => {
					return execCommand.execute( getExecData( 'git fetch' ), logger );
				} )
				.then( () => {
					return execCommand.execute( getExecData( `git checkout ${ data.repository.branch }` ), logger );
				} )
				.then( () => {
					return execCommand.execute( getExecData( 'git branch' ) );
				} )
				.then( ( response ) => {
					const stdout = response.logs.info.join( '\n' ).trim();
					const isOnBranchRegexp = /HEAD detached at/;

					// If on a detached commit/tag, mgit must not pull the changes.
					if ( isOnBranchRegexp.test( stdout ) ) {
						logger.info( `Package "${ data.packageName }" is on a detached commit or tag.` );

						return resolve( { logs: logger.all() } );
					}
				} )
				.then( () => {
					return execCommand.execute( getExecData( `git pull origin ${ data.repository.branch }` ), logger );
				} )
				.then( () => {
					resolve( { logs: logger.all() } );
				} )
				.catch( () => {
					reject( { logs: logger.all() } );
				} );
		} );

		function getExecData( command ) {
			return Object.assign( {}, data, {
				arguments: [ command ]
			} );
		}
	},

	/**
	 * @param {Set} parsedPackages Collection of processed packages.
	 */
	afterExecute( parsedPackages ) {
		console.log( chalk.cyan( `${ parsedPackages.size } packages have been processed.` ) );
	}
};
