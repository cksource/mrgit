/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { parseRepositoryUrl } from './utils/parserepositoryurl.js';

/**
 * @type {RepositoryResolver}
 */
export default function resolver( packageName, options, isRootRepository ) {
	const repositoryUrl = isRootRepository ?
		options.$rootRepository :
		options.dependencies[ packageName ];

	if ( !repositoryUrl ) {
		return null;
	}

	const repository = parseRepositoryUrl( repositoryUrl, {
		urlTemplate: options.resolverUrlTemplate,
		defaultBranch: options.resolverDefaultBranch,
		baseBranches: options.baseBranches,
		cwdPackageBranch: options.cwdPackageBranch
	} );

	if ( options.overrideDirectoryNames[ packageName ] ) {
		repository.directory = options.overrideDirectoryNames[ packageName ];
	}

	if ( options.resolverTargetDirectory === 'npm' ) {
		repository.directory = packageName;
	}

	return repository;
};

/**
 * A function that resolves a repository URL for a given package name.
 *
 * @callback RepositoryResolver
 * @param {string} packageName Name of the package to resolve.
 * @param {Options} options Options object providing context for resolution.
 * @param {boolean} isRootRepository Whether the repository being resolved is the root one.
 * @returns {Repository|null} The resolved repository object, or `null` if it cannot be resolved.
 */
