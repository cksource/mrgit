/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { spawn } from 'child_process';
import chalk from 'chalk';
import { logFactory } from '../utils/log.js';

export default {
	name: 'exec',

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
		const log = logFactory();

		return new Promise( ( resolve, reject ) => {
			try {
				const commandString = data.arguments?.[ 0 ];
				if ( !commandString ) {
					log.error( 'No command passed to execute().' );
					return reject( { logs: log.all() } );
				}

				const child = spawn( commandString, {
					shell: true,
					cwd: data.repositoryPath,
					stdio: [ 'ignore', 'pipe', 'pipe' ]
				} );

				child.stdout.on( 'data', chunk => {
					log.info( chunk.toString().trim() );
				} );

				child.stderr.on( 'data', chunk => {
					log.error( chunk.toString().trim() );
				} );

				child.on( 'error', err => {
					log.error( `Failed to start process: ${ err.message }` );
				} );

				child.on( 'close', code => {
					if ( code === 0 ) {
						resolve( { logs: log.all() } );
					} else {
						log.error( `Process exited with code ${ code }` );
						reject( { logs: log.all() } );
					}
				} );
			} catch ( err ) {
				log.error( err.message || String( err ) );
				reject( { logs: log.all() } );
			}
		} );
	}
};
