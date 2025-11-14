/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';

/**
 * Formats the logs and writes them to the console.
 *
 * @param {String} packageName
 * @param {Logs} logs
 * @param {Object} options
 * @param {Number} options.current Number of packages that have been processed.
 * @param {Number} options.all Number of all packages that will be processed.
 * @param {Boolean} [options.skipCounter=false] A flag that allows hiding the progress bar.
 */
export function displayLog( packageName, logs, options ) {
	const infoLogs = logs.info.filter( l => l.length ).join( '\n' ).trim();
	const errorLogs = logs.error.filter( l => l.length ).join( '\n' ).trim();

	const progressPercentage = Math.round( ( options.current / options.all ) * 100 );
	const progressBar = `${ options.current }/${ options.all } (${ progressPercentage }%)`;

	console.log( chalk.inverse( getPackageHeader() ) );

	if ( infoLogs ) {
		console.log( chalk.gray( infoLogs ) );
	}

	if ( errorLogs ) {
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

		if ( options.skipCounter ) {
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
