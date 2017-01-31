/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = function log() {
	const logs = new Map( [
		[ 'info', [] ],
		[ 'error', [] ]
	] );

	const logger = {
		info( msg ) {
			return logger.log( 'info', msg );
		},

		error( msg ) {
			if ( msg instanceof Error ) {
				msg = msg.stack;
			}

			return logger.log( 'error', msg );
		},

		log( type, msg ) {
			msg = msg.trim();

			if ( !msg ) {
				return;
			}

			logs.get( type ).push( msg );
		},

		concat( responseLogs ) {
			responseLogs.info.forEach( ( msg ) => logger.info( msg ) );

			responseLogs.error.forEach( ( err ) => logger.error( err ) );
		},

		all() {
			return {
				error: logs.get( 'error' ),
				info: logs.get( 'info' ),
			};
		}
	};

	return logger;
};
