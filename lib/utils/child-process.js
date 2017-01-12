/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

process.on( 'message', onMessage );

/**
 * @param {Object} data
 * @param {Object} data.command An absolute path to the command that will be called.
 */
function onMessage( data ) {
	const command = require( data.command );

	command.execute( data )
		.then( ( returnedData ) => {
			process.send( returnedData );
		} )
		.catch( ( err ) => {
			if ( !( err instanceof Error ) ) {
				return process.send( err );
			}

			const log = require( './log' )();

			log.error( err.stack );

			process.send( { logs: log.all() } );
		} );
}
