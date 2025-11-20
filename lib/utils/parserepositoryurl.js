/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// Limitations on git tag names:
// https://git-scm.com/docs/git-check-ref-format#_description
const tagPattern = /@([^ ~^:?*\\]*?)$/;

/**
 * Parses repository URL taken from dependencies provided in configuration file and returns
 * it as an object containing repository URL and branch name.
 *
 * @param {String} repositoryUrl The repository URL in formats supported by configuration file.
 * @param {Object} options
 * @param {String} [options.urlTemplate] The URL template.
 * Used if `repositoryUrl` defines only `'<organization>/<repositoryName>'`.
 * @param {String} [options.defaultBranch='master'] The default branch name to be used if the
 * repository URL doesn't specify it.
 * @param {Array.<String>} [options.baseBranches=[]] Name of branches that are allowed to check out
 * based on the value specified as `options.cwdPackageBranch`.
 * @param {String} [options.cwdPackageBranch] A name of a branch that the main repository is checked out.
 * @returns {Repository}
 */
export function parseRepositoryUrl( repositoryUrl, options = {} ) {
	let tag = undefined;

	if ( tagPattern.test( repositoryUrl ) ) {
		tag = repositoryUrl.match( tagPattern )[ 1 ];

		repositoryUrl = repositoryUrl.replace( tagPattern, '' );
	}

	const { url, hash } = splitUrlAndHash( repositoryUrl );

	const branch = getBranch( {
		hash,
		defaultBranch: options.defaultBranch,
		baseBranches: options.baseBranches || [],
		cwdPackageBranch: options.cwdPackageBranch
	} );

	const repoUrl = getRepoUrl( url, options );

	return {
		url: repoUrl,
		branch,
		directory: repoUrl.replace( /\.git$/, '' ).match( /[:/]([^/]+)\/?$/ )[ 1 ],
		tag
	};
}

function splitUrlAndHash( repositoryUrl ) {
	const hashIndex = repositoryUrl.indexOf( '#' );

	if ( hashIndex === -1 ) {
		return {
			url: repositoryUrl,
			hash: null
		};
	}

	return {
		url: repositoryUrl.slice( 0, hashIndex ),
		hash: repositoryUrl.slice( hashIndex )
	};
}

function getRepoUrl( url, options ) {
	const windowsPathMatch = url.match( /^file:\/\/([A-Za-z]):\/(.*)$/ );

	if ( windowsPathMatch ) {
		const driveLetter = windowsPathMatch[ 1 ].toLowerCase();
		const rest = windowsPathMatch[ 2 ];

		return `file://${ driveLetter }/${ rest }`;
	}

	if ( !url.match( /^(file|https?):\/\// ) && !url.match( /^git@/ ) ) {
		return options.urlTemplate.replace( /\${ path }/, url );
	}

	return url;
}

function getBranch( options ) {
	const defaultBranch = options.defaultBranch || 'master';

	// Check if branch is defined in configuration file. Use it.
	if ( options.hash ) {
		return options.hash.slice( 1 );
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
