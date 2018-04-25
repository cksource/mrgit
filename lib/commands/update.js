/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );
const chalk = require( 'chalk' );

module.exports = {
	/**
	 * @param {Object} data
	 * @param {String} data.packageName Name of current package to process.
	 * @param {Options} data.options The options object.
	 * @param {Repository} data.repository
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();
		const bootstrapCommand = require( './bootstrap' );
		const execCommand = require( './exec' );

		const destinationPath = path.join( data.options.packages, data.repository.directory );

		// Package is not cloned.
		if ( !fs.existsSync( destinationPath ) ) {
			log.info( `Package "${ data.packageName }" was not found. Cloning...` );

			const bootstrapOptions = {
				options: data.options,
				packageName: data.packageName,
				repository: data.repository
			};

			return bootstrapCommand.execute( bootstrapOptions )
				.then( response => {
					log.concat( response.logs );

					response.logs = log.all();

					return Promise.resolve( response );
				} );
		}

		return execCommand.execute( getExecData( 'git status -s' ) )
			.then( response => {
				const stdout = response.logs.info.join( '\n' ).trim();

				if ( stdout ) {
					throw new Error( `Package "${ data.packageName }" has uncommitted changes. Aborted.` );
				}

				return execCommand.execute( getExecData( 'git fetch' ) );
			} )
			.then( response => {
				log.concat( response.logs );
			} )
			.then( () => {
				return execCommand.execute( getExecData( `git checkout ${ data.repository.branch }` ) );
			} )
			.then( response => {
				log.concat( response.logs );
			} )
			.then( () => {
				return execCommand.execute( getExecData( 'git branch' ) );
			} )
			.then( response => {
				const stdout = response.logs.info.join( '\n' ).trim();
				const isOnBranchRegexp = /HEAD detached at+/;

				// If on a detached commit, mgit must not pull the changes.
				if ( isOnBranchRegexp.test( stdout ) ) {
					log.info( `Package "${ data.packageName }" is on a detached commit.` );

					return Promise.resolve( { logs: log.all() } );
				}

				return execCommand.execute( getExecData( `git pull origin ${ data.repository.branch }` ) )
					.then( response => {
						log.concat( response.logs );

						return Promise.resolve( { logs: log.all() } );
					} );
			} )
			.catch( commandResponseOrError => {
				if ( commandResponseOrError instanceof Error ) {
					log.error( commandResponseOrError.message );
				} else {
					log.concat( commandResponseOrError.logs );
				}

				return Promise.reject( { logs: log.all() } );
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
