/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'upath' );
const chalk = require( 'chalk' );
const updateJsonFile = require( '../utils/updatejsonfile' );
const gitStatusParser = require( '../utils/gitstatusparser' );

module.exports = {
	get helpMessage() {
		const {
			gray: g,
			underline: u,
			yellow: y
		} = chalk;

		return `
    ${ u( 'Description:' ) }
        Saves hashes of commits or branches which repositories are checked out in "mrgit.json" file. 

    ${ u( 'Options:' ) }
        ${ y( '--hash' ) }                    Whether to save hashes (id of last commit) on current branch. 
                                  ${ g( 'Default: true' ) }
        ${ y( '--branch' ) } (-b)             Whether to save names of current branches instead of commit ids.
                                  ${ g( 'Default: false' ) }
                                  ${ g( '> mrgit save --branch' ) }
		`;
	},

	/**
	 * @param {Array.<String>} args Arguments and options that a user provided calling the command.
	 * @param {Options} toolOptions Options resolved by mrgit.
	 */
	beforeExecute( args, toolOptions ) {
		if ( !toolOptions.branch && !toolOptions.hash ) {
			toolOptions.hash = true;
			toolOptions.branch = false;
		}

		if ( toolOptions.hash && toolOptions.branch ) {
			throw new Error( 'Cannot use "hash" and "branch" options at the same time.' );
		}
	},

	/**
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();
		const execCommand = require( './exec' );

		let promise;

		/* istanbul ignore else */
		if ( data.toolOptions.branch ) {
			promise = execCommand.execute( getExecData( 'git status --branch --porcelain' ) )
				.then( execResponse => gitStatusParser( execResponse.logs.info[ 0 ] ).branch );
		} else if ( data.toolOptions.hash ) {
			promise = execCommand.execute( getExecData( 'git rev-parse HEAD' ) )
				.then( execResponse => execResponse.logs.info[ 0 ].slice( 0, 7 ) );
		}

		return promise
			.then( dataToSave => {
				const commandResponse = {
					packageName: data.packageName,
					data: dataToSave,
					branch: data.toolOptions.branch,
					hash: data.toolOptions.hash
				};

				/* istanbul ignore else */
				if ( data.toolOptions.branch ) {
					log.info( `Branch: "${ dataToSave }".` );
				} else if ( data.toolOptions.hash ) {
					log.info( `Commit: "${ dataToSave }".` );
				}

				return {
					response: commandResponse,
					logs: log.all()
				};
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
		const mrgitJsonPath = path.join( cwd, 'mrgit.json' );

		updateJsonFile( mrgitJsonPath, json => {
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
	}
};
