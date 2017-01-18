/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const chalk = require( 'chalk' );
const exec = require( '../utils/exec' );

module.exports = {
	/**
	 * @param {Object} data
	 * @param {Object} data.options Additional options provided by the user.
	 * @param {String} data.options.recursive Whether to install dependencies of packages.
	 * @param {String} data.options.repositoryResolver Module which will resolve repositories for packages.
	 * @param {String} data.name Name of current package that will be parsed.
	 * @param {Object} data.mgit MGit configuration.
	 * @param {Object} data.mgit.packages Destination directory where packages will be installed.
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();

		return new Promise( ( resolve, reject ) => {
			const repositoryResolver = require( data.options.repositoryResolver );
			const repository = repositoryResolver( data.name, data.options.cwd );

			// The repository was not found so the package is skipped.
			if ( !repository ) {
				log.info( `Repository URL for package "${ data.name }" could not be resolved. Skipping.` );

				return resolve( { logs: log.all() } );
			}

			const destinationPath = path.join( data.options.cwd, data.mgit.packages, repository.directory );

			// Package is already cloned.
			if ( fs.existsSync( destinationPath ) ) {
				log.info( `Package "${ data.name }" is already cloned. Skipping.` );

				return resolve( { logs: log.all() } );
			}

			const command = `git clone -b ${ repository.branch } ${ repository.url } ${ destinationPath } --progress`;

			exec( command )
				.then( ( output ) => {
					log.info( output );

					const response = {
						logs: log.all()
					};

					if ( data.options.recursive ) {
						const packageJson = require( path.join( destinationPath, 'package.json' ) );

						response.packages = packageJson.dependencies ? Object.keys( packageJson.dependencies ) : [];
					}

					resolve( response );
				} )
				.catch( ( err ) => {
					log.error( err );

					reject( { logs: log.all() } );
				} );
		} );
	},

	/**
	 * @param {Set} parsedPackages Collection of processed packages.
	 */
	afterExecute( parsedPackages ) {
		console.log( chalk.cyan( `${ parsedPackages.size } packages have been processed.` ) );
	}
};
