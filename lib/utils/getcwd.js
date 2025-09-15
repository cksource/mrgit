/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );

/**
 * Returns an absolute path to the directory that contains a configuration file.
 *
 * It scans directory tree up for a configuration file. If the file won't be found,
 * an exception should be thrown.
 *
 * @param {String} config Configuration file.
 * @param {String} [cwd=process.cwd()] An absolute path to the directory where searching for the configuration file is started.
 * @returns {String}
 */
module.exports = function cwdResolver( config, cwd = process.cwd() ) {
	while ( !fs.existsSync( path.resolve( cwd, config ) ) ) {
		const parentCwd = path.resolve( cwd, '..' );

		if ( cwd === parentCwd ) {
			throw new Error( 'Cannot find the configuration file.' );
		}

		cwd = parentCwd;
	}

	return cwd;
};
