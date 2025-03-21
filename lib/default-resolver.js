/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const parseRepositoryUrl = require( './utils/parserepositoryurl' );

/**
 * Resolves repository URL for a given package name.
 *
 * @param {String} packageName Package name.
 * @param {Options} options The options object.
 * @param {Boolean} isRootRepository
 * @returns {Repository|null}
 */
module.exports = function resolver( packageName, options, isRootRepository ) {
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

	if ( options.resolverTargetDirectory == 'npm' ) {
		repository.directory = packageName;
	}

	return repository;
};
