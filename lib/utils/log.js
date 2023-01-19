/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
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
			if ( !msg ) {
				return;
			}

			msg = msg.trim();

			/* istanbul ignore if */
			if ( !msg ) {
				return;
			}

			logs.get( type ).push( msg );
		},

		concat( responseLogs ) {
			responseLogs.info.forEach( msg => logger.info( msg ) );

			responseLogs.error.forEach( err => logger.error( err ) );
		},

		/**
		 * @returns {Logs}
		 */
		all() {
			return {
				error: logs.get( 'error' ),
				info: logs.get( 'info' )
			};
		}
	};

	return logger;
};

/**
 * @typedef {Object} Logger
 *
 * @property {Function} info A function that informs about process.
 *
 * @property {Function} error A function that informs about errors.
 */

/**
 * @typedef {Object} Logs
 *
 * @property {Array.<String>} error An error messages.
 *
 * @property {Array.<String>} info An information messages.
 */
