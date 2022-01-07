/**
 * @license Copyright (c) 2003-2022, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );
const chalk = require( 'chalk' );

module.exports = {
	skipCounter: true,

	get helpMessage() {
		const {
			italic: i,
			underline: u
		} = chalk;

		return `
    ${ u( 'Description:' ) }
        Pull changes in all packages. If some package is missed, the command will not be executed.
        For cloned repositories this command is a shorthand for: "${ i( 'mrgit exec \'git pull\'' ) }".
		`;
	},

	/**
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	execute( data ) {
		const execCommand = require( './exec' );

		const destinationPath = path.join( data.toolOptions.packages, data.repository.directory );

		// Package is not cloned.
		if ( !fs.existsSync( destinationPath ) ) {
			return Promise.resolve( {} );
		}

		return execCommand.execute( getExecData( 'git pull' ) );

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
