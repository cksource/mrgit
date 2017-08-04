/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );

module.exports = {
	/**
	 * @param {Object} data
	 * @param {Array.<String>} data.arguments The rest of arguments provided by the user. These options will modify the `git diff` command.
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();
		const execCommand = require( './exec' );
		const diffCommand = 'git diff --color ' + data.arguments.join( ' ' );

		return execCommand.execute( getExecData( diffCommand ) )
			.then( execResponse => {
				if ( !execResponse.logs.info.length ) {
					return Promise.resolve( {} );
				}

				return Promise.resolve( {
					logs: execResponse.logs
				} );
			} )
			.catch( error => {
				log.error( error );

				return Promise.reject( { logs: log.all() } );
			} );

		function getExecData( command ) {
			return Object.assign( {}, data, {
				arguments: [ command ]
			} );
		}
	},

	afterExecute() {
		console.log( chalk.blue.italic( 'Logs are displayed from repositories which contain any change.' ) );
	}
};
