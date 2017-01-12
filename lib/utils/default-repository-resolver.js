/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );

/**
 * Resolves repository for given package.
 *
 * @param {String} name Package name.
 * @param {String} cwd Current work directory.
 * @returns {String|undefined}
 */
module.exports = function defaultRepositoryResolver( name, cwd ) {
	const mgitConf = require( path.join( cwd, 'mgit.json' ) );

	return mgitConf.dependencies[ name ];
};
