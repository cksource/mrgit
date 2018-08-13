/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const buildOptions = require( 'minimist-options' );
const minimist = require( 'minimist' );

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
        Merges specified branch with the current which on the repository is checked out.

        Merge is executed only on repositories where specified branch exist.

        The merge commit will be made using following message: "${ i( 'Merge branch \'branch-name\'' ) }".
        
    ${ u( 'Options:' ) }
        ${ m( '--message' ) } (-m)            An additional description for merge commit. It will be 
                                  appended to the default message. E.g.:
                                  ${ g( '> mgit merge develop -- -m "Some description about merged changes."' ) }
		`;
	},

	beforeExecute( args ) {
		if ( !args[ 0 ] ) {
			throw new Error( 'Missing branch to merge. Use: mgit merge [branch].' );
		}
	},

	/**
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();
		const execCommand = require( './exec' );
		const branch = data.arguments[ 0 ];

		return execCommand.execute( getExecData( `git branch --list ${ branch }` ) )
			.then( execResponse => {
				const branchExists = Boolean( execResponse.logs.info[ 0 ] );

				if ( !branchExists ) {
					return {
						logs: log.all()
					};
				}

				const options = this._parseArguments( data.arguments );
				const commitTitle = `Merge branch '${ branch }'`;

				let mergeCommand = `git merge ${ branch } --no-ff -m "${ commitTitle }"`;

				if ( options.message.length ) {
					mergeCommand += ' ' + options.message.map( message => `-m "${ message }"` ).join( ' ' );
				}

				return execCommand.execute( getExecData( mergeCommand ) );
			} );

		function getExecData( command ) {
			return Object.assign( {}, data, {
				arguments: [ command ]
			} );
		}
	},

	/**
	 * @private
	 * @param {Array.<String>} argv List of arguments provided by the user via CLI.
	 * @returns {Object}
	 */
	_parseArguments( argv ) {
		const options = minimist( argv, buildOptions( {
			message: {
				type: 'string',
				alias: 'm',
			}
		} ) );

		if ( !Array.isArray( options.message ) ) {
			options.message = [ options.message ].filter( Boolean );
		}

		return options;
	}
};
