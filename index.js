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
        bootstrap                   Installs packages (i.e. clone dependent repositories).
        exec                        Executes shell command in each package.
        update                      Updates packages to the latest versions (i.e. pull changes).
        save-hashes                 Saves hashes of packages in mgit.json. It allows to easily fix project to a specific state.
        status                      Prints a table which contains useful information about the status of repositories.
        diff                        Prints changes from packages where something has changed. 

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

        --ignore                    Ignores packages which names match the given glob pattern.

                                    For example:

                                        > mgit exec --ignore="foo*" "git st"

                                    Will ignore all packages which names start from "foo".

                                    Default: null

        --scope                     Restricts the command to packages which names match the given glob pattern.

                                    Default: null
                                    
        --packages-prefix           The common name of the packages. The prefix will be removed from packages' names in order to
                                    save space, e.g. 'mgit status' prints a table with the statuses of all packages.
                                    Full names of packages aren't needed so we can cat the names.

                                    Default: null
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
