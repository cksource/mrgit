/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );

module.exports = {
	/**
	 * @param {Object} data
	 * @param {Options} data.options Mgit options.
	 * @param {Array.<String>} data.arguments The rest of arguments provided by the user. These options will modify the `git diff` command.
	 * @param {String} data.packageName Name of current package to process.
	 * @param {Object} data.repository
	 * @param {String} data.repository.directory Parsed directory with Git repository.
	 * @param {String} data.repository.branch Name of branch (or commit hash) saved in `mgit.json` file.
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
