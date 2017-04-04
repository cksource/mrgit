/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const minimatch = require( 'minimatch' );

/**
 * @param {Options} options
 * @returns {Array.<String>}
 */
module.exports = function getPackageNames( options ) {
	const miniMatchOptions = { matchBase: true };

	let packageNames = Object.keys( options.dependencies );

	if ( options.ignore ) {
		packageNames = packageNames.filter( ( packageName ) => {
			return !minimatch( packageName, options.ignore, miniMatchOptions );
		} );
	}

	if ( options.scope ) {
		packageNames = packageNames.filter( ( packageName ) => {
			return minimatch( packageName, options.scope, miniMatchOptions );
		} );
	}

	return packageNames;
};
