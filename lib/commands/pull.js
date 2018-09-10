/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );
const chalk = require( 'chalk' );

module.exports = {
	get helpMessage() {
		const {
			italic: i,
			gray: g,
			magenta: m,
			underline: u
		} = chalk;

		return `
    ${ u( 'Description:' ) }
        Pull changes in all packages. If some package is missed, the command will not be executed.
        For cloned repositories this command is a shorthand for: "${ i( 'mgit exec \'git pull\'' ) }".

    ${ u( 'Options:' ) }
        ${ m( '--recursive' ) }                 Whether to install dependencies recursively. Only packages matching these 
                                    patterns will be cloned recursively.
                                    ${ g( 'Default: false' ) }
		`;
	},

	/**
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();
		const execCommand = require( './exec' );

		const destinationPath = path.join( data.mgitOptions.packages, data.repository.directory );

		// Package is not cloned.
		if ( !fs.existsSync( destinationPath ) ) {
			log.info( `Package "${ data.packageName }" was not found. Skipping...` );

			return Promise.resolve( {
				logs: log.all()
			} );
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
