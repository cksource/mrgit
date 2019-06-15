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
 * @param {String} [options.urlTemplate] The URL template.
 * Used if `repositoryUrl` defines only `'<organization>/<repositoryName>'`.
 * @param {String} [options.defaultBranch='master'] The default branch name to be used if the
 * repository URL doesn't specify it.
 * @param {Array.<String>>} [options.standardBranches=[]] Name of branches that are allowed to check out
 * based on the value specified as `options.cwdPackageBranch`.
 * @param {String} [options.cwdPackageBranch] A name of a branch that the main repository is checked out.
 * @returns {Repository}
 */
module.exports = function parseRepositoryUrl( repositoryUrl, options = {} ) {
	const parsedUrl = url.parse( repositoryUrl );
	const branch = getBranch( parsedUrl, {
		defaultBranch: options.defaultBranch,
		standardBranches: options.standardBranches || [],
		cwdPackageBranch: options.cwdPackageBranch,
	} );

	let repoUrl;

	if ( repositoryUrl.match( /^(file|https?):\/\// ) || repositoryUrl.match( /^git@/ ) ) {
		parsedUrl.hash = null;

		repoUrl = url.format( parsedUrl );
	} else {
		const pattern = options.urlTemplate;

		repoUrl = pattern.replace( /\${ path }/, parsedUrl.path );
	}

	return {
		url: repoUrl,
		branch,
		directory: repoUrl.replace( /\.git$/, '' ).match( /[:/]([^/]+)\/?$/ )[ 1 ]
	};
};

function getBranch( parsedUrl, options ) {
	const defaultBranch = options.defaultBranch || 'master';

	// Check if branch is defined in mgit.json. Use it.
	if ( parsedUrl.hash ) {
		return parsedUrl.hash.slice( 1 );
	}

	// Check if the main repo is on one of standard branches. If yes, use that branch.
	if ( options.cwdPackageBranch && options.standardBranches.includes( options.cwdPackageBranch ) ) {
		return options.cwdPackageBranch;
	}

	// Nothing matches. Use default branch.
	return defaultBranch;
}

/**
 * Repository info.
 *
 * @typedef {Object} Repository
 * @property {String} url Repository URL. E.g. `'git@github.com:ckeditor/ckeditor5.git'`.
 * @property {String} branch Branch name. E.g. `'master'`.
 * @property {String} directory Directory to which the repository would be cloned.
 */
