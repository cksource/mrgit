/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const chalk = require( 'chalk' );
const exec = require( '../utils/exec' );
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
		return new Promise( ( resolve, reject ) => {
			const destinationPath = path.join( data.options.packages, data.repository.directory );

			let promise;

			// Package is already cloned.
			if ( fs.existsSync( destinationPath ) ) {
				logger.info( `Package "${ data.packageName }" is already cloned.` );

				promise = Promise.resolve();
			} else {
				const command = [
					`git clone --progress ${ data.repository.url } ${ destinationPath }`,
					`cd ${ destinationPath }`,
					`git checkout --quiet ${ data.repository.branch }`
				].join( ' && ' );

				promise = exec( command );
			}

			promise
				.then( ( output ) => {
					logger.info( output );

					const commandOutput = {
						logs: logger.all()
					};

					if ( data.options.recursive ) {
						const packageJson = require( path.join( destinationPath, 'package.json' ) );
						const packages = [];

						if ( packageJson.dependencies ) {
							packages.push( ...Object.keys( packageJson.dependencies ) );
						}

						if ( packageJson.devDependencies ) {
							packages.push( ...Object.keys( packageJson.devDependencies ) );
						}

						commandOutput.packages = packages;
					}

					resolve( commandOutput );
				} )
				.catch( ( error ) => {
					logger.error( error );

					reject( { logs: logger.all() } );
				} );
		} );
	},

	/**
	 * @param {Set} processedPackages Collection of processed packages.
	 */
	afterExecute( processedPackages ) {
		console.log( chalk.cyan( `${ processedPackages.size } packages have been processed.` ) );
	}
};
