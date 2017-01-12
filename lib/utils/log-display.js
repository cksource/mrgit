/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );

/**
 * Formats the logs and writes their on the output.
 *
 * @param {String} packageName
 * @param {Object} logs
 * @param {Array} logs.info
 * @param {Array} logs.errors
 */
module.exports = function logDisplay( packageName, logs ) {
	const infoLogs = logs.info.filter( ( l ) => l.length ).join( '\n' ).trim();
	const errorLogs = logs.error.filter( ( l ) => l.length ).join( '\n' ).trim();

	if ( infoLogs || errorLogs ) {
		console.log( chalk.bgBlue.white( ' ' + padEnd( packageName.trim(), 79, ' ' ) ) );
	}

	if ( infoLogs ) {
		console.log( chalk.gray( infoLogs ) );
	}

	if ( errorLogs ) {
		process.exitCode = 1;

		if ( infoLogs ) {
			console.log( '\n' );
		}

		console.log( chalk.red( errorLogs ) );
	}

	if ( infoLogs || errorLogs ) {
		console.log( '\n' );
	}
};

function padEnd( str, targetLength, padChar ) {
	while ( targetLength > str.length ) {
		str += padChar;
	}

	return str;
}
