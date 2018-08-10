/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const buildOptions = require( 'minimist-options' );
const minimist = require( 'minimist' );
const gitStatusParser = require( '../utils/gitstatusparser' );

module.exports = {
	get helpMessage() {
		const u = chalk.underline;
		const g = chalk.gray;
		const m = chalk.magenta;
		const i = chalk.italic;

		return `
    ${ u( 'Description:' ) }
        Makes a commit in every repository that contains tracked files that have changed. 
        This command is a shorthand for: ${ i( 'mgit exec \'git commit -a\'' ) }.
        
    ${ u( 'Options:' ) }
        ${ m( '--message' ) } (-m)            Required. A message for the commit. It can be specified more then once, e.g.:
                                  ${ g( '> mgit commit -- --message "Title of the commit." --message "Additional description."' ) }
        ${ m( '--no-verify' ) } (-n)          Whether to skip pre-commit and commit-msg hooks.
                                  ${ g( '> mgit commit -- -m "Title of the commit." -n' ) }
		`;
	},

	/**
	 * @param {Array.<String>} args Arguments and options that a user provided calling the command.
	 */
	beforeExecute( args ) {
		const options = this._parseArguments( args );

		if ( !options.message.length ) {
			throw new Error( 'Missing --message (-m) option. Call "mgit commit -h" in order to read more.' );
		}
	},

	/**
	 * @param {Object} data
	 * @param {Array.<String>} data.arguments The rest of arguments provided by the user. These options will modify the `git diff` command.
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();
		const execCommand = require( './exec' );

		return execCommand.execute( getExecData( 'git status --branch --porcelain' ) )
			.then( execResponse => {
				const status = gitStatusParser( execResponse.logs.info[ 0 ] );

				if ( !status.anythingToCommit ) {
					log.info( 'Nothing to commit.' );

					return {
						logs: log.all()
					};
				}

				const options = this._parseArguments( data.arguments );
				const cliCommand = buildCliCommand( options );

				return execCommand.execute( getExecData( cliCommand ) );
			} );

		function getExecData( command ) {
			return Object.assign( {}, data, {
				arguments: [ command ]
			} );
		}

		function buildCliCommand( options ) {
			let command = 'git commit';

			if ( options.message ) {
				command += ' ' + options.message.map( message => `-m "${ message }"` ).join( ' ' );
			}

			if ( options[ 'no-verify' ] ) {
				command += ' -n';
			}

			return command;
		}
	},

	_parseArguments( argv ) {
		const options = minimist( argv, buildOptions( {
			message: {
				type: 'string',
				alias: 'm',
			},
			'no-verify': {
				type: 'boolean',
				alias: 'n',
				default: false
			}
		} ) );

		if ( !Array.isArray( options.message ) ) {
			options.message = [ options.message ].filter( Boolean );
		}

		return options;
	}
};
