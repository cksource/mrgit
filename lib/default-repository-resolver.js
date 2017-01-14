/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const parseRepositoryUrl = require( './utils/parserepositoryurl' );

/**
 * Resolves repository URL for a given package name.
 *
 * @param {String} name Package name.
 * @param {String} cwd Current working directory.
 * @returns {Object|null}
 * @returns {String} return.url Repository URL. E.g. `'git@github.com:ckeditor/ckeditor5.git'`
 * @returns {String} return.branch Branch name. E.g. `'master'`
 */
module.exports = function repositoryResolver( name, cwd ) {
	const mgitConf = require( path.join( cwd, 'mgit.json' ) );
	const repositoryUrl = mgitConf.dependencies[ name ];

	if ( !repositoryUrl ) {
		return null;
	}

	return parseRepositoryUrl( repositoryUrl );
};
