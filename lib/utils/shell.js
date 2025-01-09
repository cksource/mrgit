/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const shell = require( 'shelljs' );

module.exports = function exec( command ) {
	return new Promise( ( resolve, reject ) => {
		const response = shell.exec( command, { silent: true } );

		// Git commands can write output to "stderr" even the task was executed properly.
		if ( response.code === 0 ) {
			return resolve( response.stderr + response.stdout );
		}

		// Gulp writes to "stdout" even the task wasn't executed properly.
		return reject( response.stdout + response.stderr );
	} );
};
