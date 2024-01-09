/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );
const chalk = require( 'chalk' );

module.exports = {
	name: 'push',

	skipCounter: true,

	get helpMessage() {
		const {
			italic: i,
			gray: g,
			underline: u
		} = chalk;

		return `
    ${ u( 'Description:' ) }
        Push changes in all packages. If some package is missed, the command will not be executed.
        For cloned repositories this command is a shorthand for: "${ i( 'mrgit exec \'git push\'' ) }".

    ${ u( 'Git Options:' ) }
        All options accepted by "${ i( 'git push' ) }" are supported by mrgit. Everything specified after "--" is passed directly to the
        "${ i( 'git push' ) }" command.

        E.g.: "${ g( 'mrgit push -- --verbose --all' ) }" will execute "${ i( 'git push --verbose --all' ) }"
		`;
	},

	/**
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	async execute( data ) {
		const execCommand = require( './exec' );

		if ( !data.isRootRepository ) {
			const destinationPath = path.join( data.toolOptions.packages, data.repository.directory );

			// Package is not cloned.
			if ( !fs.existsSync( destinationPath ) ) {
				return Promise.resolve( {} );
			}
		}

		const commandResponse = await execCommand.execute( getExecData( 'git branch --show-current' ) );
		const currentlyOnBranch = Boolean( commandResponse.logs.info[ 0 ] );

		if ( !currentlyOnBranch ) {
			return Promise.resolve( {
				logs: {
					error: [],
					info: [ 'This repository is currently in detached head mode - skipping.' ]
				}
			} );
		}

		const pushCommand = ( 'git push ' + data.arguments.join( ' ' ) ).trim();

		return execCommand.execute( getExecData( pushCommand ) );

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
