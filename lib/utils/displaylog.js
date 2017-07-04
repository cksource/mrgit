/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );

/**
 * Formats the logs and writes them to the console.
 *
 * @param {String} packageName
 * @param {Object} logs
 * @param {Array} logs.info
 * @param {Array} logs.errors
 * @param {Object} options
 * @param {Number} options.current Number of packages that have been processed.
 * @param {Number} options.all Number of all packages that will be processed.
 */
module.exports = function displayLog( packageName, logs, options ) {
	const infoLogs = logs.info.filter( l => l.length ).join( '\n' ).trim();
	const errorLogs = logs.error.filter( l => l.length ).join( '\n' ).trim();

	const progressPercentage = Math.round( ( options.current / options.all ) * 100 );
	const progressBar = `${ options.current }/${ options.all } (${ progressPercentage }%)`;

	const packageHeader =
		chalk.cyan( ' # ' ) +
		' ' +
		padEnd( packageName.trim(), 80 - progressBar.length ) +
		progressBar +
		' ';

	console.log( chalk.inverse( packageHeader ) );

	if ( infoLogs ) {
		console.log( chalk.gray( infoLogs ) );
	}

	if ( errorLogs ) {
		process.exitCode = 1;

		console.log( chalk.red( errorLogs ) );
	}

	console.log( '' );
};

function padEnd( str, targetLength, padChar = ' ' ) {
	while ( targetLength > str.length ) {
		str += padChar;
	}

	return str;
}
