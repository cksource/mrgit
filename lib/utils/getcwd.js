/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );

/**
 * Returns an absolute path to the directory that contains a configuration file.
 *
 * It scans directory tree up for `mrgit.json` file. If the file won't be found,
 * an exception should be thrown.
 *
 * @returns {String}
 */
module.exports = function cwdResolver() {
	let cwd = process.cwd();

	while ( !fs.existsSync( path.join( cwd, 'mrgit.json' ) ) ) {
		const parentCwd = path.resolve( cwd, '..' );

		if ( cwd === parentCwd ) {
			throw new Error( 'Cannot find the "mrgit.json" file.' );
		}

		cwd = parentCwd;
	}

	return cwd;
};
