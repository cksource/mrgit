/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

process.on( 'message', onMessage );

/**
 * @param {Object} data
 * @param {Object} data.parameters Additional arguments provided by the user.
 * @param {String} data.packageName Name of current package to process.
 * @param {Options} data.options The options object.
 */
function onMessage( data ) {
	const log = require( './log' )();

	if ( !data.repository ) {
		log.info( `Repository URL for package "${ data.packageName }" could not be resolved. Skipping.` );

		return process.send( { logs: log.all() } );
	}

	const command = require( data.command );

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
