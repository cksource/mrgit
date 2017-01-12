/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Returns an absolute path to the directory with configuration file.
 *
 * @returns {String}
 */
module.exports = function cwdResolver() {
	// ToDo: Try to find path to the configuration file based on cwd.

	return process.cwd();
};
