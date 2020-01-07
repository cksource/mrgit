/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

process.on( 'message', onMessage );

/**
 * @param {CommandData} data
 */
function onMessage( data ) {
	const log = require( './log' )();

	if ( !data.repository ) {
		log.info( `Repository URL for package "${ data.packageName }" could not be resolved. Skipping.` );

		return process.send( { logs: log.all() } );
	}

	const command = require( data.commandPath );

	command.execute( data )
		.then( returnedData => {
			process.send( returnedData );
		} )
		.catch( err => {
			if ( !( err instanceof Error ) ) {
				return process.send( err );
			}

			log.error( err.stack );

			process.send( { logs: log.all() } );
		} );
}
