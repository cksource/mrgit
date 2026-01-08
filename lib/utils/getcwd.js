/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import upath from 'upath';

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
export function getCwd( config, cwd = process.cwd() ) {
	while ( !fs.existsSync( upath.resolve( cwd, config ) ) ) {
		const parentCwd = upath.resolve( cwd, '..' );

		if ( cwd === parentCwd ) {
			throw new Error( 'Cannot find the configuration file.' );
		}

		cwd = parentCwd;
	}

	return cwd;
};
