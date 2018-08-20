/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'upath' );
const chalk = require( 'chalk' );
const buildOptions = require( 'minimist-options' );
const minimist = require( 'minimist' );
const updateJsonFile = require( '../utils/updatejsonfile' );
const gitStatusParser = require( '../utils/gitstatusparser' );

module.exports = {
	get helpMessage() {
		const {
			gray: g,
			magenta: m,
			underline: u
		} = chalk;

		return `
    ${ u( 'Description:' ) }
        Saves hashes of commits or branches which repositories are checked out in "mgit.json" file. 

    ${ u( 'Options:' ) }
        ${ m( '--hash' ) }                    Whether to save hashes (id of last commit) on current branch. 
                                  ${ g( 'Default: true' ) }
        ${ m( '--branch' ) }                  Whether to save names of current branches instead of commit ids.
                                  ${ g( 'Default: false' ) }
                                  ${ g( '> mgit save -- --branch' ) }
		`;
	},

	/**
	 * @param {Array.<String>} args Arguments and options that a user provided calling the command.
	 */
	beforeExecute( args ) {
		const options = this._parseArguments( args );

		if ( !options.branch && !options.hash ) {
			throw new Error( 'Need to specify what kind of information you want to save. Call "mgit save -h" in order to read more.' );
		}
	},

	/**
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();
		const execCommand = require( './exec' );
		const options = this._parseArguments( data.arguments );

		let promise;

		/* istanbul ignore else */
		if ( options.branch ) {
			promise = execCommand.execute( getExecData( 'git status --branch --porcelain' ) )
				.then( execResponse => gitStatusParser( execResponse.logs.info[ 0 ] ).branch );
		} else if ( options.hash ) {
			promise = execCommand.execute( getExecData( 'git rev-parse HEAD' ) )
				.then( execResponse => execResponse.logs.info[ 0 ].slice( 0, 7 ) );
		}

		return promise.then( dataToSave => {
			const commandResponse = {
				packageName: data.packageName,
				data: dataToSave,
				branch: options.branch,
				hash: options.hash
			};

			/* istanbul ignore else */
			if ( options.branch ) {
				log.info( `Branch: "${ dataToSave }".` );
			} else if ( options.hash ) {
				log.info( `Commit: "${ dataToSave }".` );
			}

			return Promise.resolve( {
				response: commandResponse,
				logs: log.all()
			} );
		} );

		function getExecData( command ) {
			return Object.assign( {}, data, {
				arguments: [ command ]
			} );
		}
	},

	/**
	 * Saves collected hashes to configuration file.
	 *
	 * @param {Set} processedPackages Collection of processed packages.
	 * @param {Set} commandResponses Results of executed command for each package.
	 */
	afterExecute( processedPackages, commandResponses ) {
		const cwd = require( '../utils/getcwd' )();
		const mgitJsonPath = path.join( cwd, 'mgit.json' );

		updateJsonFile( mgitJsonPath, json => {
			for ( const response of commandResponses.values() ) {
				const repository = json.dependencies[ response.packageName ].split( '#' )[ 0 ];

				// If returned branch is equal to 'master', save only the repository path.
				if ( response.branch && response.data === 'master' ) {
					json.dependencies[ response.packageName ] = repository;
				} else {
					json.dependencies[ response.packageName ] = `${ repository }#${ response.data }`;
				}
			}

			return json;
		} );
	},

	/**
	 * @private
	 * @param {Array.<String>} argv List of arguments provided by the user via CLI.
	 * @returns {Object}
	 */
	_parseArguments( argv ) {
		const options = minimist( argv, buildOptions( {
			branch: {
				type: 'boolean',
			},
			hash: {
				type: 'boolean',
				default: true
			}
		} ) );

		if ( options.branch ) {
			options.hash = false;
		}

		return options;
	}
};
