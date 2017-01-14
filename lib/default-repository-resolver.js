/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const url = require( 'url' );

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
	const dependencyUrl = mgitConf.dependencies[ name ];

	if ( !dependencyUrl ) {
		return null;
	}

	const parsedUrl = url.parse( dependencyUrl );
	const branch = parsedUrl.hash ? parsedUrl.hash.slice( 1 ) : 'master';
	let repoUrl;

	if ( dependencyUrl.match( /^https?:\/\// ) || dependencyUrl.match( /^git@/ ) ) {
		parsedUrl.hash = null;

		repoUrl = url.format( parsedUrl );
	} else {
		repoUrl = `git@github.com:${ parsedUrl.path }.git`;
	}

	return {
		url: repoUrl,
		branch: branch
	};
};
