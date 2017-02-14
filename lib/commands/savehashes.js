/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const updateJsonFile = require( '../utils/updatejsonfile' );
const getLogger = require( '../utils/getlogger' );

module.exports = {
	/**
	 * @param {Object} data
	 * @param {String} data.packageName Name of current package to process.
	 * @param {Logger} logger An instance of logger.
	 * @returns {Promise}
	 */
	execute( data, logger = getLogger() ) {
		const execCommand = require( './exec' );

		return new Promise( ( resolve, reject ) => {
			execCommand.execute( getExecData( 'git rev-parse HEAD' ), logger )
				.then( () => {
					const commitHash = logger.getLastInserted();

					const commandResponse = {
						packageName: data.packageName,
						commit: commitHash
					};

					resolve( {
						response: commandResponse,
						logs: logger.all()
					} );
				} )
				.catch( ( error ) => {
					logger.error( error );

					reject( { logs: logger.all() } );
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

		updateJsonFile( mgitJsonPath, ( json ) => {
			for ( const response of commandResponses.values() ) {
				const repository = json.dependencies[ response.packageName ].split( '#' )[ 0 ];

				json.dependencies[ response.packageName ] = `${ repository }#${ response.commit }`;
			}

			return json;
		} );
	}
};
