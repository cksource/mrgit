/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );

/**
 * @param {Object} callOptions Call options.
 * @param {String} cwd An absolute path to the directory where `mgit.json` is available.
 * @returns {Options} The options object.
 */
module.exports = function cwdResolver( callOptions, cwd ) {
	const mgitJsonPath = path.resolve( cwd, 'mgit.json' );

	// Default options.
	let options = {
		cwd,
		packages: 'packages',
		resolverPath: path.resolve( __dirname, '..', 'default-resolver.js' ),
		resolverUrlTemplate: 'git@github.com:${ path }.git',
		resolverTargetDirectory: 'git',
		resolverDefaultBranch: 'master',
		ignore: null,
		scope: null,
		packagesPrefix: [],
		overrideDirectoryNames: {}
	};

	if ( fs.existsSync( mgitJsonPath ) ) {
		options = Object.assign( options, require( mgitJsonPath ), options );
	}

	options = Object.assign( options, callOptions );

	options.packages = path.resolve( cwd, options.packages );

	if ( !Array.isArray( options.packagesPrefix ) ) {
		options.packagesPrefix = [ options.packagesPrefix ];
	}

	return options;
};

/**
 * @typedef {Object} Options
 *
 * @property {String} cwd An absolute path to the directory which contains `mgit.json` file.
 *
 * @property {String} [packages='<cwd>/packages/'] Directory to which all repositories will be cloned.
 *
 * @property {String} [resolverPath='mgit2/lib/default-resolver.js'] Path to a custom repository resolver function.
 *
 * @property {String} [resolverUrlTemplate='git@github.com:${ path }.git'] Template used to generate repository URL out of a
 * simplified 'organization/repository' format of the dependencies option.
 *
 * @property {String} [resolverTargetDirectory='git'] Defines how the target directory (where the repository will be cloned)
 * is resolved. Supported options are: 'git' (default), 'npm'.
 *
 * * If 'git' was specified, then the directory name will be extracted from
 * the git URL (e.g. for 'git@github.com:a/b.git' it will be 'b').
 * * If 'npm' was specified, then the package name will be used as a directory name.
 *
 * This option can be useful when scoped npm packages are used and one wants to decide
 * whether the repository will be cloned to packages/@scope/pkgname' or 'packages/pkgname'.
 *
 * @property {String} [resolverDefaultBranch='master'] The branch name to use if not specified in mgit.json dependencies.
 *
 * @property {String|null} [ignore=null] Ignores packages with names matching the given glob.
 *
 * @property {String|null} [scope=null] Restricts the scope to package names matching the given glob.
 *
 * @property {Boolean|undefined} [recursive=undefined] Whether to install dependencies recursively.
 *
 * @property {Boolean|String|undefined} [branch=undefined] If a bool: whether to use branch names as an input data.
 * If a string: name of branch that should be created.
 *
 * @property {Boolean|undefined} [hash=undefined] Whether to use current commit hashes as an input data.
 *
 * @property {Object} [overrideDirectoryNames={}] A map that allows renaming directories where packages will be cloned.
 *
 * @property {String|Array.<String>} [packagesPrefix=[]] Prefix or prefixes which will be removed from packages' names during
 * printing the summary of the "status" command.
 */
