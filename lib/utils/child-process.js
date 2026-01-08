/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { pathToFileURL } from 'node:url';
import { logFactory } from './log.js';

process.on( 'message', onMessage );

/**
 * @param {CommandData} data
 */
async function onMessage( data ) {
	const log = logFactory();

	if ( !data.repository ) {
		log.info( `Repository URL for package "${ data.packageName }" could not be resolved. Skipping.` );

		return process.send( { logs: log.all() } );
	}

	const { default: command } = await import( pathToFileURL( data.commandPath ).href );

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
