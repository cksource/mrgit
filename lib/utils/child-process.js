/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

process.on( 'message', onMessage );

/**
 * @param {CommandData} data
 */
async function onMessage( data ) {
	const log = await import( './log.js' ).then( ( { log } ) => log() );

	if ( !data.repository ) {
		log.info( `Repository URL for package "${ data.packageName }" could not be resolved. Skipping.` );

		return process.send( { logs: log.all() } );
	}

	const { default: command } = await import( data.commandPath );

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
