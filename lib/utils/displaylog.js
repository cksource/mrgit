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
 * @param {String} options.command Name of executed command.
 */
module.exports = function displayLog( packageName, logs, options ) {
	let infoLogs = logs.info.filter( l => l.length ).join( '\n' ).trim();
	const errorLogs = logs.error.filter( l => l.length ).join( '\n' ).trim();

	const progressPercentage = Math.round( ( options.current / options.all ) * 100 );
	const progressBar = `${ options.current }/${ options.all } (${ progressPercentage }%)`;

	console.log( chalk.inverse( getPackageHeader() ) );

	if ( infoLogs ) {
		// For the `diff` command we do not want to modify the output (do not change the colors).
		if ( options.command !== 'diff' ) {
			infoLogs = chalk.gray( infoLogs );
		}

		console.log( infoLogs );
	}

	if ( errorLogs ) {
		process.exitCode = 1;

		console.log( chalk.red( errorLogs ) );
	}

	console.log( '' );

	function getPackageHeader() {
		const headerParts = [
			chalk.cyan( ' # ' ),
			' ',
			padEnd( packageName.trim(), 80 - progressBar.length ),
			' '
		];

		// For the `diff` command we do not want to show the progress (counter)
		// because we will show the output only if the command returned the changes.
		if ( options.command === 'diff' ) {
			headerParts.push( ' '.repeat( progressBar.length ) );
		} else {
			headerParts.push( progressBar );
		}

		headerParts.push( ' ' );

		return headerParts.join( '' );
	}
};

function padEnd( str, targetLength, padChar = ' ' ) {
	while ( targetLength > str.length ) {
		str += padChar;
	}

	return str;
}
