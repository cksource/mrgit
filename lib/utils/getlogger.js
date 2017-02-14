/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * @returns {Logger}
 */
module.exports = function getLogger() {
	const logsCollection = new Map( [
		[ 'info', [] ],
		[ 'error', [] ]
	] );

	let lastInserted;

	const logger = {
		/**
		 * @param {String} msg
		 */
		info( msg ) {
			return logger._log( 'info', msg );
		},

		/**
		 * @param {String|Error} msg
		 */
		error( msg ) {
			if ( msg instanceof Error ) {
				msg = msg.stack;
			}

			return logger._log( 'error', msg );
		},

		/**
		 * @param {Logs} responseLogs
		 */
		concat( responseLogs ) {
			responseLogs.info.forEach( ( msg ) => logger.info( msg ) );

			responseLogs.error.forEach( ( err ) => logger.error( err ) );
		},

		/**
		 * @returns {Logs}
		 */
		all() {
			return {
				error: logsCollection.get( 'error' ),
				info: logsCollection.get( 'info' ),
			};
		},

		/**
		 * @returns {String|undefined}
		 */
		getLastInserted() {
			return lastInserted;
		},

		/**
		 * @private
		 * @param {String} type
		 * @param {String} msg
		 */
		_log( type, msg ) {
			if ( !msg ) {
				return;
			}

			msg = msg && msg.trim();

			if ( !msg ) {
				return;
			}

			lastInserted = msg;
			logsCollection.get( type ).push( msg );
		}
	};

	return logger;
};

/**
 * @typedef {Object} Logger
 *
 * @property {Function} info Logs an information.
 *
 * @property {Function} error Logs an error.
 *
 * @property {Function} concat Merges logs with another instance of logger.
 *
 * @property {Function} all Returns an object with collected logs.
 *
 * @property {Function} getLastInserted Returns last inserted log.
 */

/**
 * @typedef {Object} Logs
 *
 * @property {Array.<String>} logs.error
 *
 * @property {Array.<String>} logs.info
 */
