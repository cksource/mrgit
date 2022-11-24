/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const url = require( 'url' );
const tagPattern = /@(latest|.*?\d+\.\d+\.\d+.*?)$/;

/**
 * Parses repository URL taken from `mrgit.json`'s dependencies and returns
 * it as an object containing repository URL and branch name.
 *
 * @param {String} repositoryUrl The repository URL in formats supported by `mrgit.json`.
 * @param {Object} options
 * @param {String} [options.urlTemplate] The URL template.
 * Used if `repositoryUrl` defines only `'<organization>/<repositoryName>'`.
 * @param {String} [options.defaultBranch='master'] The default branch name to be used if the
 * repository URL doesn't specify it.
 * @param {Array.<String>>} [options.baseBranches=[]] Name of branches that are allowed to check out
 * based on the value specified as `options.cwdPackageBranch`.
 * @param {String} [options.cwdPackageBranch] A name of a branch that the main repository is checked out.
 * @returns {Repository}
 */
module.exports = function parseRepositoryUrl( repositoryUrl, options = {} ) {
	let tag = undefined;

	if ( tagPattern.test( repositoryUrl ) ) {
		tag = repositoryUrl.match( tagPattern )[ 1 ];

		repositoryUrl = repositoryUrl.replace( tagPattern, '' );
	}

	const parsedUrl = url.parse( repositoryUrl );

	const branch = getBranch( parsedUrl, {
		defaultBranch: options.defaultBranch,
		baseBranches: options.baseBranches || [],
		cwdPackageBranch: options.cwdPackageBranch
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
		directory: repoUrl.replace( /\.git$/, '' ).match( /[:/]([^/]+)\/?$/ )[ 1 ],
		tag
	};
};

function getBranch( parsedUrl, options ) {
	const defaultBranch = options.defaultBranch || 'master';

	// Check if branch is defined in mrgit.json. Use it.
	if ( parsedUrl.hash ) {
		return parsedUrl.hash.slice( 1 );
	}

	// Check if the main repo is on one of base branches. If yes, use that branch.
	if ( options.cwdPackageBranch && options.baseBranches.includes( options.cwdPackageBranch ) ) {
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
