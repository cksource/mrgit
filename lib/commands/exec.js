/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const exec = require( '../utils/exec' );
const getLogger = require( '../utils/getlogger' );

module.exports = {
	/**
	 * @param {Array.<String>} args Arguments that user provided calling the mgit.
	 */
	beforeExecute( args ) {
		if ( args.length === 1 ) {
			throw new Error( 'Missing command to execute. Use: mgit exec [command-to-execute].' );
		}
	},

	/**
	 * @param {Object} data
	 * @param {Object} data.arguments Arguments that user provided calling the mgit.
	 * @param {String} data.packageName Name of current package to process.
	 * @param {Options} data.options The options object.
	 * @param {Repository} data.repository
	 * @param {Logger} logger An instance of logger.
	 * @returns {Promise}
	 */
	execute( data, logger = getLogger() ) {
		return new Promise( ( resolve, reject ) => {
			const newCwd = path.join( data.options.packages, data.repository.directory );

			// Package does not exist.
			if ( !fs.existsSync( newCwd ) ) {
				logger.error( `Package "${ data.packageName }" is not available. Run "mgit bootstrap" in order to download the package.` );

				return reject( { logs: logger.getAll() } );
			}

			process.chdir( newCwd );

			exec( data.arguments[ 0 ] )
				.then( ( stdout ) => {
					process.chdir( data.options.cwd );

					logger.info( stdout );

					resolve( { logs: logger.getAll() } );
				} )
				.catch( ( error ) => {
					process.chdir( data.options.cwd );

					logger.error( error );

					reject( { logs: logger.getAll() } );
				} );
		} );
	}
};
