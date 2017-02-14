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
		 * @returns {Object} logs
		 * @returns {Array.<String>} logs.error
		 * @returns {Array.<String>} logs.info
		 */
		getAll() {
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
 * @property {Function} info Logs an info message.
 *
 * @property {Function} error Logs an error message.
 *
 * @property {Function} getAll Returns an object with collected logs.
 *
 * @property {Function} getLastInserted Returns last inserted log.
 */
