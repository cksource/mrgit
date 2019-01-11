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

        Merge is executed only on repositories where specified branch exists.

        The merge commit will be made using following message: "${ i( 'Merge branch \'branch-name\'' ) }".

        After merging, specified branch will be removed from the remote and local registry.
        
    ${ u( 'Options:' ) }
        ${ m( '--message' ) } (-m)            An additional description for merge commit. It will be 
                                  appended to the default message. E.g.:
                                  ${ g( '> mgit merge develop -- -m "Some description about merged changes."' ) }
		`;
	},

	beforeExecute( args ) {
		if ( !args[ 1 ] ) {
			throw new Error( 'Missing branch to merge. Use: mgit close [branch].' );
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
					log.info( 'Branch does not exist.' );

					return {
						logs: log.all()
					};
				}

				const mergeMessage = this._getMergeMessage( data.mgitOptions, data.arguments );
				const commitTitle = `Merge branch '${ branch }'`;

				let mergeCommand = `git merge ${ branch } --no-ff -m "${ commitTitle }"`;

				if ( mergeMessage.length ) {
					mergeCommand += ' ' + mergeMessage.map( message => `-m "${ message }"` ).join( ' ' );
				}

				return execCommand.execute( getExecData( mergeCommand ) )
					.then( execResponse => {
						log.concat( execResponse.logs );
						log.info( `Removing "${ branch }" branch from the local registry.` );

						return execCommand.execute( getExecData( `git branch -d ${ branch }` ) );
					} )
					.then( execResponse => {
						log.concat( execResponse.logs );
						log.info( `Removing "${ branch }" branch from the remote.` );

						return execCommand.execute( getExecData( `git push origin :${ branch }` ) );
					} )
					.then( execResponse => {
						log.concat( execResponse.logs );

						return { logs: log.all() };
					} );
			} );

		function getExecData( command ) {
			return Object.assign( {}, data, {
				arguments: [ command ]
			} );
		}
	},

	/**
	 * @private
	 * @param {options} mgitOptions Options resolved by mgit.
	 * @param {Array.<String>>} argv List of arguments provided by the user via CLI.
	 * @returns {Array.<String>}
	 */
	_getMergeMessage( mgitOptions, argv ) {
		const cliOptions = this._parseArguments( argv );

		let message;

		if ( mgitOptions.message ) {
			message = mgitOptions.message;
		} else if ( cliOptions.message ) {
			message = cliOptions.message;
		} else {
			return [];
		}

		/* istanbul ignore else */
		if ( !Array.isArray( message ) ) {
			message = [ message ].filter( Boolean );
		}

		return message;
	},

	/**
	 * @private
	 * @param {Array.<String>} argv List of arguments provided by the user via CLI.
	 * @returns {Object}
	 */
	_parseArguments( argv ) {
		return minimist( argv, buildOptions( {
			message: {
				type: 'string',
				alias: 'm',
			}
		} ) );
	}
};
