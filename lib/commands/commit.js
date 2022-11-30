/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const buildOptions = require( 'minimist-options' );
const minimist = require( 'minimist' );
const gitStatusParser = require( '../utils/gitstatusparser' );

module.exports = {
	name: 'commit',

	get helpMessage() {
		const {
			italic: i,
			gray: g,
			magenta: m,
			underline: u,
			yellow: y
		} = chalk;

		return `
    ${ u( 'Description:' ) }
        Makes a commit in every repository that contains tracked files that have changed.
        This command is a shorthand for: "${ i( 'mrgit exec \'git commit -a\'' ) }".

    ${ u( 'Options:' ) }
        ${ y( '--message' ) } (-m)            Required. A message for the commit. It can be specified more then once, e.g.:
                                  ${ g( '> mrgit commit --message "Title of the commit." --message "Additional description."' ) }

    ${ u( 'Git Options:' ) }
        ${ m( '--no-verify' ) } (-n)          Whether to skip pre-commit and commit-msg hooks.
                                  ${ g( '> mrgit commit -m "Title of the commit." -- -n' ) }
		`;
	},

	/**
	 * @param {Array.<String>} args Arguments and options that a user provided calling the command.
	 * @param {Options} toolOptions Options resolved by mrgit.
	 */
	beforeExecute( args, toolOptions ) {
		const cliOptions = this._parseArguments( args );
		const commitMessage = this._getCommitMessage( toolOptions, cliOptions );

		if ( !commitMessage.length ) {
			throw new Error( 'Missing --message (-m) option. Call "mrgit commit -h" in order to read more.' );
		}
	},

	/**
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();
		const execCommand = require( './exec' );

		return execCommand.execute( getExecData( 'git status --branch --porcelain' ) )
			.then( execResponse => {
				const status = gitStatusParser( execResponse.logs.info[ 0 ] );

				if ( status.detachedHead ) {
					log.info( 'This repository is currently in detached head mode - skipping.' );

					return {
						logs: log.all()
					};
				}

				if ( !status.anythingToCommit ) {
					log.info( 'Nothing to commit.' );

					return {
						logs: log.all()
					};
				}

				const cliOptions = this._parseArguments( data.arguments );
				const commitCommand = this._buildCliCommand( data.toolOptions, cliOptions );

				return execCommand.execute( getExecData( commitCommand ) );
			} );

		function getExecData( command ) {
			return Object.assign( {}, data, {
				arguments: [ command ]
			} );
		}
	},

	/**
	 * @private
	 * @param {options} toolOptions Options resolved by mrgit.
	 * @param {Object} cliOptions Parsed arguments provided by the user via CLI.
	 * @returns {String}
	 */
	_buildCliCommand( toolOptions, cliOptions ) {
		const commitMessage = this._getCommitMessage( toolOptions, cliOptions );
		let command = 'git commit -a';

		command += ' ' + commitMessage.map( message => `-m "${ message }"` ).join( ' ' );

		if ( cliOptions[ 'no-verify' ] ) {
			command += ' -n';
		}

		return command;
	},

	/**
	 * @private
	 * @param {Options} toolOptions Options resolved by mrgit.
	 * @param {Object} cliOptions Parsed arguments provided by the user via CLI.
	 * @returns {Array.<String>}
	 */
	_getCommitMessage( toolOptions, cliOptions ) {
		let message;

		if ( toolOptions.message ) {
			message = toolOptions.message;
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
		const options = minimist( argv, buildOptions( {
			message: {
				type: 'string',
				alias: 'm'
			},
			'no-verify': {
				type: 'boolean',
				alias: 'n',
				default: false
			}
		} ) );

		/* istanbul ignore else */
		if ( !Array.isArray( options.message ) ) {
			options.message = [ options.message ].filter( Boolean );
		}

		return options;
	}
};
