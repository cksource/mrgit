/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const exec = require( '../utils/exec' );

module.exports = {
	/**
	 * @param {Array} parameters Arguments that user provided calling the mgit.
	 */
	beforeExecute( parameters ) {
		if ( parameters.length === 1 ) {
			throw new Error( 'Missing command to execute. Use: mgit exec [command-to-execute].' );
		}
	},

	/**
	 * @param {Object} data
	 * @param {Object} data.parameters Additional arguments provided by user.
	 * @param {String} data.name Name of current package that will be parsed.
	 * @param {String} data.options.cwd Current work directory.
	 * @param {Object} data.mgit MGit configuration.
	 * @param {Object} data.mgit.dependencies MGit dependencies.
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();

		return new Promise( ( resolve, reject ) => {
			const newCwd = path.join( data.options.cwd, data.mgit.packages, data.name );

			// Package does not exist.
			if ( !fs.existsSync( newCwd ) ) {
				log.error( `Package "${ data.name }" is not available. Run "mgit bootstrap" in order to download the package.` );

				return reject( { logs: log.all() } );
			}

			process.chdir( newCwd );

			exec( data.parameters[ 0 ] )
				.then( ( stdout ) => {
					process.chdir( data.options.cwd );

					log.info( stdout );

					resolve( { logs: log.all() } );
				} )
				.catch( ( err ) => {
					process.chdir( data.options.cwd );

					log.error( err );

					reject( { logs: log.all() } );
				} );
		} );
	}
};
