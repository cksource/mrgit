/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const url = require( 'url' );

/**
 * Parses repository URL taken from `mgit.json`'s dependencies and returns
 * it as an object containing repository URL and branch name.
 *
 * @param {String} repositoryUrl The repository URL in formats supported by `mgit.json`.
 * @param {Object} options
 * @param {String} [options.urlTemplate='git@github.com:${ path }.git'] The URL template
 * used if `repositoryUrl` defines only `'<organization>/<repositoryName>'`.
 */
module.exports = function parseRepositoryUrl( repositoryUrl, options = {} ) {
	const parsedUrl = url.parse( repositoryUrl );
	const branch = parsedUrl.hash ? parsedUrl.hash.slice( 1 ) : 'master';
	let repoUrl;

	if ( repositoryUrl.match( /^https?:\/\// ) || repositoryUrl.match( /^git@/ ) ) {
		parsedUrl.hash = null;

		repoUrl = url.format( parsedUrl );
	} else {
		const pattern = options.urlTemplate || 'git@github.com:${ path }.git';

		repoUrl = pattern.replace( /\${ path }/, parsedUrl.path );
	}

	return {
		url: repoUrl,
		branch: branch
	};
};
