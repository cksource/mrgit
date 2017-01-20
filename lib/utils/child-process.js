/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

process.on( 'message', onMessage );

/**
 * @param {Object} data
 * @param {String} data.name Name of current package that will be parsed.
 * @param {Repository|null} data.repository
 * @param {Object} data.command An absolute path to the command that will be called.
 */
function onMessage( data ) {
	const log = require( './log' )();

	if ( !data.repository ) {
		log.info( `Repository URL for package "${ data.name }" could not be resolved. Skipping.` );

		return process.send( { logs: log.all() } );
	}

	const command = require( data.command );

	command.execute( data )
		.then( ( returnedData ) => {
			process.send( returnedData );
		} )
		.catch( ( err ) => {
			if ( !( err instanceof Error ) ) {
				return process.send( err );
			}

			log.error( err.stack );

			process.send( { logs: log.all() } );
		} );
}
