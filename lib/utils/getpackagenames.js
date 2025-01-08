/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const minimatch = require( 'minimatch' );
const { doesCommandSupportRootPackage } = require( '../utils/rootrepositoryutils' );

/**
 * @param {Object} options
 * @param {Array.<String>} options.dependencies List of packages.
 * @param {String|null} [options.ignore=null] Ignores packages with names matching the given glob.
 * @param {String|null} [options.scope=null] Restricts the scope to package names matching the given glob.
 * @param {Command} command
 * @returns {Array.<String>}
 */
module.exports = function getPackageNames( options, command ) {
	const miniMatchOptions = { matchBase: true };

	let packageNames = Object.keys( options.dependencies );

	if ( !options.skipRoot && options.$rootRepository && doesCommandSupportRootPackage( command ) ) {
		packageNames.unshift( '$' + options.$rootRepository.match( /(?<=\/)[^#@]+/ )[ 0 ] );
	}

	if ( options.ignore ) {
		packageNames = packageNames.filter( packageName => {
			return !minimatch( packageName, options.ignore, miniMatchOptions );
		} );
	}

	if ( options.scope ) {
		packageNames = packageNames.filter( packageName => {
			return minimatch( packageName, options.scope, miniMatchOptions );
		} );
	}

	return packageNames;
};
