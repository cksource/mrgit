/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );
const chalk = require( 'chalk' );
const exec = require( '../utils/exec' );

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

		const destinationPath = path.join( data.options.packages, data.repository.directory );

		let promise;

		// Package is already cloned.
		if ( fs.existsSync( destinationPath ) ) {
			log.info( `Package "${ data.packageName }" is already cloned.` );

			promise = Promise.resolve();
		} else {
			const command = [
				`git clone --progress "${ data.repository.url }" "${ destinationPath }"`,
				`cd "${ destinationPath }"`,
				`git checkout --quiet ${ data.repository.branch }`
			].join( ' && ' );

			promise = exec( command );
		}

		return promise
			.then( output => {
				log.info( output );

				const commandOutput = {
					logs: log.all()
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

				return Promise.resolve( commandOutput );
			} )
			.catch( error => {
				log.error( error );

				return Promise.reject( { logs: log.all() } );
			} );
	},

	/**
	 * @param {Set} processedPackages Collection of processed packages.
	 */
	afterExecute( processedPackages ) {
		console.log( chalk.cyan( `${ processedPackages.size } packages have been processed.` ) );
	}
};
