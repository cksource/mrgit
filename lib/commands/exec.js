/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );
const chalk = require( 'chalk' );
const shell = require( '../utils/shell' );

module.exports = {
	get helpMessage() {
		const {
			italic: i,
			gray: g,
			underline: u
		} = chalk;

		return `
    ${ u( 'Description:' ) }
        Requires a command that will be executed on all repositories. E.g. "${ g( 'mrgit exec pwd' ) }" will execute "${ i( 'pwd' ) }"
        command in every repository. Commands that contain spaces must be wrapped in quotation marks,
        e.g.: "${ g( 'mrgit exec "git remote"' ) }".
		`;
	},

	/**
	 * @param {Array.<String>} args Arguments that user provided calling the mrgit.
	 */
	beforeExecute( args ) {
		if ( args.length === 1 ) {
			throw new Error( 'Missing command to execute. Use: mrgit exec [command-to-execute].' );
		}
	},

	/**
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();

		return new Promise( ( resolve, reject ) => {
			const newCwd = path.join( data.toolOptions.packages, data.repository.directory );

			// Package does not exist.
			if ( !fs.existsSync( newCwd ) ) {
				log.error( `Package "${ data.packageName }" is not available. Run "mrgit sync" in order to download the package.` );

				return reject( { logs: log.all() } );
			}

			process.chdir( newCwd );

			shell( data.arguments[ 0 ] )
				.then( stdout => {
					process.chdir( data.toolOptions.cwd );

					log.info( stdout );

					resolve( { logs: log.all() } );
				} )
				.catch( error => {
					process.chdir( data.toolOptions.cwd );

					log.error( error );

					reject( { logs: log.all() } );
				} );
		} );
	}
};
