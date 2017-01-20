/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const chalk = require( 'chalk' );

module.exports = {
	/**
	 * @param {Object} data
	 * @param {String} data.command Absolute path to command that will be executed.
	 * @param {Object} data.parameters Additional arguments provided by user.
	 * @param {Object} data.options Additional options provided by user.
	 * @param {String} data.options.recursive Whether to install dependencies of packages.
	 * @param {String} data.options.repositoryResolver Module which will resolve repositories for packages.
	 * @param {String} data.options.fetch Whether to fetch the repository before update.
	 * @param {String} data.name Name of current package that will be parsed.
	 * @param {Repository|null} data.repository
	 * @param {String} data.repository.url Repository URL. E.g. `'git@github.com:ckeditor/ckeditor5.git'`.
	 * @param {String} data.repository.branch Branch name. E.g. `'master'`.
	 * @param {String} data.repository.directory Directory to which the repository would be cloned.
	 * @param {Object} data.mgit MGit configuration.
	 * @param {Object} data.mgit.packages Destination directory where packages will be installed.
	 * @param {Object} data.mgit.dependencies MGit dependencies.
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();
		const bootstrapCommand = require( './bootstrap' );
		const execCommand = require( './exec' );

		return new Promise( ( resolve, reject ) => {
			// The repository was not found so the package is skipped.
			if ( !data.repository ) {
				log.info( `Repository URL for package "${ data.name }" could not be resolved. Skipping.` );

				return resolve( { logs: log.all() } );
			}

			const destinationPath = path.join( data.options.cwd, data.mgit.packages, data.repository.directory );

			// Package is not cloned.
			if ( !fs.existsSync( destinationPath ) ) {
				log.info( `Package "${ data.name }" was not found. Cloning...` );

				const bootstrapOptions = {
					options: data.options,
					name: data.name,
					mgit: data.mgit
				};

				return bootstrapCommand.execute( bootstrapOptions )
					.then( ( response ) => {
						log.concat( response.logs );

						response.logs = log.all();

						resolve( response );
					} )
					.catch( reject );
			}

			let execPromise = execCommand.execute( execOptions( 'git status -s' ) )
				.then( ( response ) => {
					const stdout = response.logs.info.join( '\n' ).trim();

					if ( stdout ) {
						throw new Error( `Package "${ data.name }" has uncommitted changes. Aborted.` );
					}
				} );

			if ( data.options.fetch ) {
				execPromise = execPromise
					.then( () => {
						return execCommand.execute( execOptions( `git fetch` ) );
					} )
					.then( ( response ) => {
						log.concat( response.logs );
					} );
			}

			execPromise
				.then( () => {
					return execCommand.execute( execOptions( `git checkout ${ data.repository.branch }` ) );
				} )
				.then( ( response ) => {
					log.concat( response.logs );

					return execCommand.execute( execOptions( `git pull origin ${ data.repository.branch }` ) );
				} )
				.then( ( response ) => {
					log.concat( response.logs );

					resolve( { logs: log.all() } );
				} )
				.catch( ( error ) => {
					log.error( error.message );

					reject( { logs: log.all() } );
				} );
		} );

		function execOptions( command ) {
			return {
				parameters: [ command ],
				name: data.name,
				options: data.options,
				repository: data.repository,
				mgit: data.mgit
			};
		}
	},

	/**
	 * @param {Set} parsedPackages Collection of processed packages.
	 */
	afterExecute( parsedPackages ) {
		console.log( chalk.cyan( `${ parsedPackages.size } packages have been processed.` ) );
	}
};
