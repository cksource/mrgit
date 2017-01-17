#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const meow = require( 'meow' );
const mgit = require( './lib/index' );
const cwdResolver = require( './lib/utils/cwd-resolver' );

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
        bootstrap                 Install packages (i.e. clone dependent repositories).
        exec                      Exec shell command in each package.
        update                    Update packages to the latest versions (i.e. pull changes).

    Options:
        --fetch                   Whether to fetch changes from remote repositories.
                                  Default: true.

        --recursive               Whether to install dependencies recursively.
                                  Needs to be used together with --repository-resolver.
                                  Default: false.

        --repository-resolver     JS module used to resolve repository URL and branch name
                                  for a package.
                                  Default: 'lib/default-repository-resolver.js'.
`, {
	default: {
		fetch: true,
		recursive: false,
		cwd: cwdResolver(),
		repositoryResolver: path.join( __dirname, 'lib', 'default-repository-resolver.js' )
	}
} );

if ( cli.input.length === 0 ) {
	cli.showHelp();
} else {
	mgit( cli.input, cli.flags );
}
