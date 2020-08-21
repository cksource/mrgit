#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const meow = require( 'meow' );
const mrgit = require( './lib/index' );
const getCommandInstance = require( './lib/utils/getcommandinstance' );

handleCli();

function handleCli() {
	const meowOptions = {
		autoHelp: false,
		flags: {
			version: {
				alias: 'v'
			},
			help: {
				alias: 'h'
			},
			branch: {
				alias: 'b'
			},
			message: {
				alias: 'm'
			}
		}
	};

	const logo = `
                            _ _   
                           (_) |  
     _ __ ___  _ __    __ _ _| |_ 
    | '_ \` _ \\| '__|  / _\` | | __|
    | | | | | | | _  | (_| | | |_ 
    |_| |_| |_|_|(_)  \\__, |_|\\__|
                       __/ |      
                      |___/       
`;

	const {
		cyan: c,
		gray: g,
		magenta: m,
		underline: u,
		yellow: y
	} = chalk;

	const cli = meow( `${ logo }
    ${ u( 'Usage:' ) }
        $ mrgit ${ c( 'command' ) } ${ y( '[--options]' ) } -- ${ m( '[--git-options]' ) }

    ${ u( 'Commands:' ) }
        ${ c( 'checkout' ) }                    Changes branches in repositories according to the configuration file.
        ${ c( 'close' ) }                       Merges specified branch with the current one and remove merged branch from the remote.
        ${ c( 'commit' ) }                      Commits all changes. A shorthand for "mrgit exec 'git commit -a'".
        ${ c( 'diff' ) }                        Prints changes from packages where something has changed. 
        ${ c( 'exec' ) }                        Executes shell command in each package.
        ${ c( 'fetch' ) }                       Fetches existing repositories.
        ${ c( 'pull' ) }                        Pulls changes in existing repositories.
        ${ c( 'push' ) }                        Pushes changes in existing repositories to remotes.
        ${ c( 'save' ) }                        Saves hashes of packages in mrgit.json. It allows to easily fix project to a specific state.
        ${ c( 'status' ) }                      Prints a table which contains useful information about the status of repositories.
        ${ c( 'sync' ) }                        Updates packages to the latest versions or install missing ones.
                                                

    ${ u( 'Options:' ) }
        ${ y( '--branch' ) }                    For "${ u( 'save' ) }" command: whether to save branch names.
                                    For "${ u( 'checkout' ) }" command: name of branch that would be created.

        ${ y( '--hash' ) }                      Whether to save current commit hashes. Used only by "${ u( 'save' ) }" command.

        ${ y( '--ignore' ) }                    Ignores packages which names match the given glob pattern. E.g.:
                                    ${ g( '> mrgit exec --ignore="foo*" "git status"' ) }

                                    Will ignore all packages which names start from "foo".
                                    ${ g( 'Default: null' ) }
                                    
        ${ y( '--message' ) }                   Message that will be used as an option for git command. Required for "${ u( 'commit' ) }"
                                    command but it is also used by "${ u( 'close' ) }" command (append the message to the default).

        ${ y( '--packages' ) }                  Directory to which all repositories will be cloned or are already installed.
                                    ${ g( 'Default: \'<cwd>/packages/\'' ) }

        ${ y( '--recursive' ) }                 Whether to install dependencies recursively. Used only by "${ u( 'sync' ) }" command.

        ${ y( '--resolver-path' ) }             Path to a custom repository resolver function.
                                    ${ g( 'Default: \'@mrgit/lib/default-resolver.js\'' ) }

        ${ y( '--resolver-url-template' ) }     Template used to generate repository URL out of a
                                    simplified 'organization/repository' format of the dependencies option.
                                    ${ g( 'Default: \'git@github.com:${ path }.git\'.' ) }

        ${ y( '--resolver-directory-name' ) }   Defines how the target directory (where the repository will be cloned)
                                    is resolved. Supported options are: 'git' (default), 'npm'.

                                    * If 'git' was specified, then the directory name will be extracted from
                                    the git URL (e.g. for 'git@github.com:a/b.git' it will be 'b').
                                    * If 'npm' was specified, then the package name will be used as a directory name.

                                    This option can be useful when scoped npm packages are used and one wants to decide
                                    whether the repository will be cloned to packages/@scope/pkgname' or 'packages/pkgname'.
                                    ${ g( 'Default: \'git\'' ) }

        ${ y( '--resolver-default-branch' ) }   The branch name to use if not specified in mrgit.json dependencies.
                                    ${ g( 'Default: master' ) }

        ${ y( '--scope' ) }                     Restricts the command to packages which names match the given glob pattern.
                                    ${ g( 'Default: null' ) }

    ${ u( 'Git Options:' ) }
        Git options are supported by the following commands: commit, diff, fetch, push.
        Type "mrgit [command] -h" in order to see which options are supported.
`, meowOptions );

	const commandName = cli.input[ 0 ];

	// If user specified a command and `--help` flag wasn't active.
	if ( commandName && !cli.flags.help ) {
		return mrgit( cli.input, cli.flags );
	}

	// A user wants to see "help" screen.
	// Missing command. Displays help screen for the entire Mr. Git.
	if ( !commandName ) {
		return cli.showHelp( 0 );
	}

	const commandInstance = getCommandInstance( commandName );

	if ( !commandInstance ) {
		process.errorCode = 1;

		return;
	}

	// Specified command is is available, displays the command's help.
	console.log( logo );
	console.log( `    ${ u( 'Command:' ) } ${ c( commandInstance.name || commandName ) } ` );
	console.log( commandInstance.helpMessage );
}
