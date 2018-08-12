/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'upath' );
const chalk = require( 'chalk' );
const updateJsonFile = require( '../utils/updatejsonfile' );

module.exports = {
	get helpMessage() {
		const {
			underline: u
		} = chalk;

		return `
    ${ u( 'Description:' ) }
        Saves hashes of commits in "mgit.json" file. It allows easily to restore the project to some point.
		`;
	},

	/**
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();
		const execCommand = require( './exec' );

		return execCommand.execute( getExecData( 'git rev-parse HEAD' ) )
			.then( execResponse => {
				const commitHash = execResponse.logs.info[ 0 ];

				const commandResponse = {
					packageName: data.packageName,
					commit: commitHash.slice( 0, 7 ) // Short version of the commit hash.
				};

				log.info( `Commit: "${ commitHash }".` );

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

				json.dependencies[ response.packageName ] = `${ repository }#${ response.commit }`;
			}

			return json;
		} );
	}
};
