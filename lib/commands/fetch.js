/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );
const chalk = require( 'chalk' );
const buildOptions = require( 'minimist-options' );
const minimist = require( 'minimist' );

module.exports = {
	skipCounter: true,

	get helpMessage() {
		const {
			italic: i,
			gray: g,
			magenta: m,
			underline: u
		} = chalk;

		return `
    ${ u( 'Description:' ) }
        Download objects and refs from the remote repository. If some package is missed, the command will not be executed.
        For cloned repositories this command is a shorthand for: "${ i( 'mrgit exec \'git fetch\'' ) }".

    ${ u( 'Git Options:' ) }
        ${ m( '--prune' ) } (-p)                Before fetching, remove any remote-tracking references that 
                                    no longer exist on the remote.
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

		const destinationPath = path.join( data.toolOptions.packages, data.repository.directory );

		// Package is not cloned.
		if ( !fs.existsSync( destinationPath ) ) {
			return Promise.resolve( {} );
		}

		const options = this._parseArguments( data.arguments );
		let command = 'git fetch';

		if ( options.prune ) {
			command += ' -p';
		}

		return execCommand.execute( getExecData( command ) )
			.then( execResponse => {
				if ( execResponse.logs.info.length ) {
					return execResponse;
				}

				log.info( 'Repository is up to date.' );

				return { logs: log.all() };
			} );

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
	},

	/**
	 * @private
	 * @param {Array.<String>} argv List of arguments provided by the user via CLI.
	 * @returns {Object}
	 */
	_parseArguments( argv ) {
		return minimist( argv, buildOptions( {
			prune: {
				type: 'boolean',
				alias: 'p'
			}
		} ) );
	}
};
