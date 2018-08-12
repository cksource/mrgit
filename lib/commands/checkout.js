/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );

module.exports = {
	name: 'checkout',

	get helpMessage() {
		const {
			underline: u
		} = chalk;

		return `
    ${ u( 'Description:' ) }
        Checks out the repository to specified branch or commit saved in "mgit.json" file.
		`;
	},

	/**
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	execute( data ) {
		const execCommand = require( './exec' );
		const checkoutCommand = `git checkout ${ data.repository.branch }`;

		return execCommand.execute( getExecData( checkoutCommand ) )
			.then( execResponse => {
				execResponse.logs.info = execResponse.logs.info[ 0 ].split( '\n' ).slice( -1 );

				return Promise.resolve( execResponse );
			} );

		function getExecData( command ) {
			return Object.assign( {}, data, {
				arguments: [ command ]
			} );
		}
	}
};
