#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const meow = require( 'meow' );
const mgit = require( './lib/index' );

const cli = meow( `
                     _ _
                    (_) |
     _ __ ___   __ _ _| |_
    | '_ \` _ \\ / _\` | | __|
    | | | | | | (_| | | |_
    |_| |_| |_|\\__, |_|\\__|
                __/ |
               |___/

    Usage:
        $ mgit [command]

    Commands:
        bootstrap                   Install packages (i.e. clone dependent repositories).
        exec                        Exec shell command in each package.
        update                      Update packages to the latest versions (i.e. pull changes).

    Options:
        --recursive                 Whether to install dependencies recursively.
                                    Needs to be used together with --repository-include. Only packages
                                    matching these patterns will be cloned recursively.

                                    Default: false.

        --packages                  Directory to which all repositories will be cloned.

                                    Default: '<cwd>/packages/'

        --resolver-path             Path to a custom repository resolver function.

                                    Default: '@mgit2/lib/default-resolver.js'.

        --resolver-url-template     Template used to generate repository URL out of a
                                    simplified 'organization/repository' format of the dependencies option.

                                    Default: 'git@github.com:\${ path }.git'.

        --resolver-directory-name   Defines how the target directory (where the repository will be cloned)
                                    is resolved. Supported options are: 'git' (default), 'npm'.

                                    * If 'git' was specified, then the directory name will be extracted from
                                    the git URL (e.g. for 'git@github.com:a/b.git' it will be 'b').
                                    * If 'npm' was specified, then the package name will be used as a directory name.

                                    This option can be useful when scoped npm packages are used and one wants to decide
                                    whether the repository will be cloned to packages/@scope/pkgname' or 'packages/pkgname'.

                                    Default: 'git'

        --resolver-default-branch   The branch name to use if not specified in mgit.json dependencies.

                                    Default: 'master'
`, {
	alias: {
		v: 'version'
	}
} );

if ( cli.input.length === 0 ) {
	cli.showHelp();
} else {
	mgit( cli.input, cli.flags );
}
