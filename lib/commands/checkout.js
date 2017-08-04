/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	/**
	 * @param {Object} data
	 * @param {Object} data.repository
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
