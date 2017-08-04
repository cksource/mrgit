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
		const execCommand = require( './exec' );
		const diffCommand = ( 'git diff --color ' + data.arguments.join( ' ' ) ).trim();

		return execCommand.execute( getExecData( diffCommand ) )
			.then( execResponse => {
				if ( !execResponse.logs.info.length ) {
					return Promise.resolve( {} );
				}

				return Promise.resolve( {
					logs: execResponse.logs
				} );
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
