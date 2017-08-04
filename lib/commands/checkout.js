/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

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
		const execCommand = require( './exec' );
		const checkoutCommand = `git checkout ${ data.repository.branch }`;

		return execCommand.execute( getExecData( checkoutCommand ) );

		function getExecData( command ) {
			return Object.assign( {}, data, {
				arguments: [ command ]
			} );
		}
	}
};
