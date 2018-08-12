/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );
const buildOptions = require( 'minimist-options' );
const minimist = require( 'minimist' );
const chalk = require( 'chalk' );
const exec = require( '../utils/exec' );

module.exports = {
	/**
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();
		const options = this._parseArguments( data.arguments );
		const destinationPath = path.join( data.mgitOptions.packages, data.repository.directory );

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

				if ( options.recursive ) {
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
	},

	/**
	 * @private
	 * @param {Array.<String>} argv List of arguments provided by the user via CLI.
	 * @returns {Object}
	 */
	_parseArguments( argv ) {
		return minimist( argv, buildOptions( {
			recursive: {
				type: 'boolean',
				alias: 'r',
			}
		} ) );
	}
};
