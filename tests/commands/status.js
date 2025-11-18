/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, describe, beforeEach, it, expect } from 'vitest';
import { gitStatusParser } from '../../lib/utils/gitstatusparser.js';
import statusCommand from '../../lib/commands/status.js';
import execCommand from '../../lib/commands/exec.js';
import Table from 'cli-table';
import chalk from 'chalk';

vi.mock( '../../lib/utils/gitstatusparser.js' );
vi.mock( '../../lib/commands/exec.js' );
vi.mock( 'cli-table' );

describe( 'commands/status', () => {
	let commandData, tableMock, consoleLog;

	beforeEach( () => {
		commandData = {
			toolOptions: {
				packagesPrefix: '@ckeditor/ckeditor5-'
			},
			repository: {
				branch: 'master'
			},
			isRootRepository: false,
			packageName: '@ckeditor/ckeditor5-test-package',
			arguments: []
		};

		tableMock = {
			push: vi.fn(),
			toString: vi.fn()
		};

		Table.mockImplementation( class {
			constructor() {
				return tableMock;
			}
		} );

		consoleLog = vi.spyOn( console, 'log' ).mockImplementation( () => {} );
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( typeof statusCommand.helpMessage ).toEqual( 'string' );
		} );
	} );

	describe( '#name', () => {
		it( 'returns a full name of executed command', () => {
			expect( typeof statusCommand.name ).toEqual( 'string' );
		} );
	} );

	describe( 'beforeExecute()', () => {
		it( 'should describe why logs are not display in "real-time"', () => {
			statusCommand.beforeExecute();

			expect( consoleLog ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'execute()', () => {
		it( 'rejects promise if any called command returned an error', () => {
			const error = new Error( 'Unexpected error.' );

			execCommand.execute
				.mockResolvedValueOnce( {} )
				.mockRejectedValueOnce( {
					logs: { error: [ error.stack ] }
				} );

			return statusCommand.execute( commandData )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).toEqual( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'returns a response with status of the repository', () => {
			execCommand.execute
				.mockResolvedValueOnce( {
					logs: { info: [ '6bfd379a56a32c9f8b6e58bf08e39c124cdbae10' ] }
				} )
				.mockResolvedValueOnce( {
					logs: { info: [ 'Response returned by "git status" command.' ] }
				} )
				.mockResolvedValueOnce( {
					logs: { info: [ '\nv35.3.2\nv35.3.1\nv35.3.0\nv35.2.1\nv35.2.0' ] }
				} )
				.mockResolvedValueOnce( {
					logs: { info: [ 'Response returned by "git describe" command.' ] }
				} );

			gitStatusParser.mockReturnValue( { response: 'Parsed response.' } );

			return statusCommand.execute( commandData )
				.then( statusResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 4 );
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1,
						getCommandArguments( 'git rev-parse HEAD' )
					);
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 2,
						getCommandArguments( 'git status --branch --porcelain' )
					);
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 3,
						getCommandArguments( 'git log --tags --simplify-by-decoration --pretty="%S"' )
					);
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 4,
						getCommandArguments( 'git describe --abbrev=0 --tags --always' )
					);

					expect( gitStatusParser ).toHaveBeenCalledTimes( 1 );
					expect( gitStatusParser ).toHaveBeenNthCalledWith( 1,
						'Response returned by "git status" command.',
						'Response returned by "git describe" command.'
					);

					expect( statusResponse.response ).toEqual( {
						packageName: 'test-package',
						status: { response: 'Parsed response.' },
						isRootRepository: false,
						commit: '6bfd379',
						mrgitBranch: 'master',
						mrgitTag: undefined,
						latestTag: 'v35.3.2'
					} );
				} );
		} );

		it( 'works properly for repositories without tags', () => {
			execCommand.execute
				.mockResolvedValueOnce( {
					logs: { info: [ '6bfd379a56a32c9f8b6e58bf08e39c124cdbae10' ] }
				} )
				.mockResolvedValueOnce( {
					logs: { info: [ 'Response returned by "git status" command.' ] }
				} )
				.mockResolvedValueOnce( {
					logs: { info: [] }
				} );

			gitStatusParser.mockReturnValue( { response: 'Parsed response.' } );

			return statusCommand.execute( commandData )
				.then( statusResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 3 );
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1,
						getCommandArguments( 'git rev-parse HEAD' )
					);
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 2,
						getCommandArguments( 'git status --branch --porcelain' )
					);
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 3,
						getCommandArguments( 'git log --tags --simplify-by-decoration --pretty="%S"' )
					);

					expect( gitStatusParser ).toHaveBeenCalledTimes( 1 );
					expect( gitStatusParser ).toHaveBeenNthCalledWith( 1,
						'Response returned by "git status" command.',
						null
					);

					expect( statusResponse.response ).toEqual( {
						packageName: 'test-package',
						status: { response: 'Parsed response.' },
						isRootRepository: false,
						commit: '6bfd379',
						mrgitBranch: 'master',
						mrgitTag: undefined,
						latestTag: null
					} );
				} );
		} );

		it( 'modifies the package name if "packagesPrefix" is an array', () => {
			commandData.toolOptions.packagesPrefix = [
				'@ckeditor/ckeditor-',
				'@ckeditor/ckeditor5-'
			];

			execCommand.execute
				.mockResolvedValueOnce( {
					logs: { info: [ '6bfd379a56a32c9f8b6e58bf08e39c124cdbae10' ] }
				} )
				.mockResolvedValueOnce( {
					logs: { info: [ 'Response returned by "git status" command.' ] }
				} )
				.mockResolvedValueOnce( {
					logs: { info: [ 'v35.3.2\nv35.3.1\nv35.3.0\nv35.2.1\nv35.2.0\n' ] }
				} )
				.mockResolvedValueOnce( {
					logs: { info: [ 'Response returned by "git describe" command.' ] }
				} );

			gitStatusParser.mockReturnValue( { response: 'Parsed response.' } );

			return statusCommand.execute( commandData )
				.then( statusResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 4 );
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1,
						getCommandArguments( 'git rev-parse HEAD' )
					);
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 2,
						getCommandArguments( 'git status --branch --porcelain' )
					);
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 3,
						getCommandArguments( 'git log --tags --simplify-by-decoration --pretty="%S"' )
					);
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 4,
						getCommandArguments( 'git describe --abbrev=0 --tags --always' )
					);

					expect( gitStatusParser ).toHaveBeenCalledTimes( 1 );
					expect( gitStatusParser ).toHaveBeenNthCalledWith( 1,
						'Response returned by "git status" command.',
						'Response returned by "git describe" command.'
					);

					expect( statusResponse.response ).toEqual( {
						packageName: 'test-package',
						status: { response: 'Parsed response.' },
						isRootRepository: false,
						commit: '6bfd379',
						mrgitBranch: 'master',
						mrgitTag: undefined,
						latestTag: 'v35.3.2'
					} );
				} );
		} );

		it( 'does not modify the package name if "packagesPrefix" option is not specified', () => {
			// mrgit resolves this option to be an empty array if it isn't specified.
			commandData.toolOptions.packagesPrefix = [];

			execCommand.execute
				.mockResolvedValueOnce( {
					logs: { info: [ '6bfd379a56a32c9f8b6e58bf08e39c124cdbae10' ] }
				} )
				.mockResolvedValueOnce( {
					logs: { info: [ 'Response returned by "git status" command.' ] }
				} )
				.mockResolvedValueOnce( {
					logs: { info: [ '\nv35.3.2\nv35.3.1\nv35.3.0\nv35.2.1\nv35.2.0' ] }
				} )
				.mockResolvedValueOnce( {
					logs: { info: [ 'Response returned by "git describe" command.' ] }
				} );

			gitStatusParser.mockReturnValue( { response: 'Parsed response.' } );

			return statusCommand.execute( commandData )
				.then( statusResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 4 );
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1,
						getCommandArguments( 'git rev-parse HEAD' )
					);
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 2,
						getCommandArguments( 'git status --branch --porcelain' )
					);
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 3,
						getCommandArguments( 'git log --tags --simplify-by-decoration --pretty="%S"' )
					);
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 4,
						getCommandArguments( 'git describe --abbrev=0 --tags --always' )
					);

					expect( gitStatusParser ).toHaveBeenCalledTimes( 1 );
					expect( gitStatusParser ).toHaveBeenNthCalledWith( 1,
						'Response returned by "git status" command.',
						'Response returned by "git describe" command.'
					);

					expect( statusResponse.response ).toEqual( {
						packageName: '@ckeditor/ckeditor5-test-package',
						status: { response: 'Parsed response.' },
						isRootRepository: false,
						commit: '6bfd379',
						mrgitBranch: 'master',
						mrgitTag: undefined,
						latestTag: 'v35.3.2'
					} );
				} );
		} );

		it( 'attaches suffix to root repository name', () => {
			commandData.isRootRepository = true;

			execCommand.execute
				.mockResolvedValueOnce( {
					logs: { info: [ '6bfd379a56a32c9f8b6e58bf08e39c124cdbae10' ] }
				} )
				.mockResolvedValueOnce( {
					logs: { info: [ 'Response returned by "git status" command.' ] }
				} )
				.mockResolvedValueOnce( {
					logs: { info: [ '\nv35.3.2\nv35.3.1\nv35.3.0\nv35.2.1\nv35.2.0' ] }
				} )
				.mockResolvedValueOnce( {
					logs: { info: [ 'Response returned by "git describe" command.' ] }
				} );

			gitStatusParser.mockReturnValue( { response: 'Parsed response.' } );

			return statusCommand.execute( commandData )
				.then( statusResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 4 );
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1,
						getCommandArguments( 'git rev-parse HEAD' )
					);
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 2,
						getCommandArguments( 'git status --branch --porcelain' )
					);
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 3,
						getCommandArguments( 'git log --tags --simplify-by-decoration --pretty="%S"' )
					);
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 4,
						getCommandArguments( 'git describe --abbrev=0 --tags --always' )
					);

					expect( gitStatusParser ).toHaveBeenCalledTimes( 1 );
					expect( gitStatusParser ).toHaveBeenNthCalledWith( 1,
						'Response returned by "git status" command.',
						'Response returned by "git describe" command.'
					);

					expect( statusResponse.response ).toEqual( {
						packageName: 'test-package [ROOT REPOSITORY]',
						status: { response: 'Parsed response.' },
						isRootRepository: true,
						commit: '6bfd379',
						mrgitBranch: 'master',
						mrgitTag: undefined,
						latestTag: 'v35.3.2'
					} );
				} );
		} );

		function getCommandArguments( command ) {
			return Object.assign( {}, commandData, {
				arguments: [ command ]
			} );
		}
	} );

	describe( 'afterExecute()', () => {
		it( 'do not display anything if processed packages list is empty', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			commandResponses.add( { response: true } );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( consoleLog ).toHaveBeenCalledTimes( 0 );
		} );

		it( 'do not display anything if command responses list is empty', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'foo-package' );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( consoleLog ).toHaveBeenCalledTimes( 0 );
		} );

		it( 'draws the table with statuses of the repositories', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-foo' );
			processedPackages.add( '@ckeditor/ckeditor5-bar' );

			commandResponses.add( {
				packageName: 'foo',
				status: {
					branch: 'master',
					tag: undefined,
					detachedHead: false,
					ahead: 0,
					behind: 2,
					staged: [],
					modified: [ 'README.md' ],
					untracked: [],
					unmerged: []
				},
				commit: 'abcd123',
				mrgitBranch: 'master',
				mrgitTag: undefined,
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			commandResponses.add( {
				packageName: 'bar',
				status: {
					branch: 't/1',
					tag: undefined,
					detachedHead: false,
					ahead: 3,
					behind: 0,
					staged: [ 'gulpfile.js' ],
					modified: [],
					untracked: [ 'CHANGELOG.md' ],
					unmerged: []
				},
				commit: 'ef45678',
				mrgitBranch: 't/1',
				mrgitTag: undefined,
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			tableMock.toString.mockReturnValue( '┻━┻' );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( Table ).toHaveBeenCalledExactlyOnceWith( {
				head: [ 'Package', 'Branch/Tag', 'Commit', 'Status' ],
				style: {
					compact: true
				}
			} );

			expect( tableMock.push ).toHaveBeenNthCalledWith( 1,
				[ 'bar', 't/1 ↑3', 'ef45678', '+1 ?1' ]
			);
			expect( tableMock.push ).toHaveBeenNthCalledWith( 2,
				[ 'foo', 'master ↓2', 'abcd123', 'M1' ]
			);

			expect( tableMock.toString ).toHaveBeenCalledTimes( 1 );

			expect( consoleLog ).toHaveBeenCalledTimes( 2 );
			expect( consoleLog ).toHaveBeenNthCalledWith( 1, '┻━┻' );
			expect( consoleLog ).toHaveBeenNthCalledWith( 2, expect.stringMatching( /^Legend:/ ) );
			expect( chalk.cyan ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'adds green "L" before the tag name to indicate latest tag being up to date', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-bar' );

			commandResponses.add( {
				packageName: 'bar',
				status: {
					branch: 'HEAD (no branch)',
					tag: 'v35.3.2',
					detachedHead: true,
					ahead: 0,
					behind: 0,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: []
				},
				commit: 'ef45678',
				mrgitBranch: 'master',
				mrgitTag: 'latest',
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( tableMock.push ).toHaveBeenNthCalledWith( 1,
				[ 'bar', 'L v35.3.2', 'ef45678', '' ]
			);

			expect( chalk.green ).toHaveBeenCalledTimes( 4 );

			// Table
			expect( chalk.green ).toHaveBeenNthCalledWith( 1, 'L' );
			// Legend
			expect( chalk.green ).toHaveBeenNthCalledWith( 2, '+' );
			expect( chalk.green ).toHaveBeenNthCalledWith( 3, 'L' );
			// Hints
			expect( chalk.green ).toHaveBeenNthCalledWith( 4, 'L' );
		} );

		it( 'adds "!" before the branch name if current branch is other than defined in "mrgit.json"', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-bar' );

			commandResponses.add( {
				packageName: 'bar',
				status: {
					branch: 't/1',
					tag: undefined,
					detachedHead: false,
					ahead: 0,
					behind: 0,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: []
				},
				commit: 'ef45678',
				mrgitBranch: 'master',
				mrgitTag: undefined,
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( tableMock.push ).toHaveBeenNthCalledWith( 1,
				[ 'bar', '! t/1', 'ef45678', '' ]
			);

			expect( chalk.cyan ).toHaveBeenCalledTimes( 3 );

			// Table
			expect( chalk.cyan ).toHaveBeenNthCalledWith( 1, '!' );
			// Legend
			expect( chalk.cyan ).toHaveBeenNthCalledWith( 2, '!' );
			// Hints
			expect( chalk.cyan ).toHaveBeenNthCalledWith( 3, '!' );
		} );

		it( 'adds "!" before the tag name to indicate latest tag not being up to date', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-bar' );

			commandResponses.add( {
				packageName: 'bar',
				status: {
					branch: 'HEAD (no branch)',
					tag: 'v30.0.0',
					detachedHead: true,
					ahead: 0,
					behind: 0,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: []
				},
				commit: 'ef45678',
				mrgitBranch: 'master',
				mrgitTag: 'latest',
				currentTag: 'v30.0.0',
				latestTag: 'v35.3.2'
			} );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( tableMock.push ).toHaveBeenNthCalledWith( 1,
				[ 'bar', '! v30.0.0', 'ef45678', '' ]
			);

			expect( chalk.cyan ).toHaveBeenCalledTimes( 3 );

			// Table
			expect( chalk.cyan ).toHaveBeenNthCalledWith( 1, '!' );
			// Legend
			expect( chalk.cyan ).toHaveBeenNthCalledWith( 2, '!' );
			// Hints
			expect( chalk.cyan ).toHaveBeenNthCalledWith( 3, '!' );
		} );

		it( 'adds "!" before the branch name if the latest tag should be checked out instead', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-bar' );

			commandResponses.add( {
				packageName: 'bar',
				status: {
					branch: 'master',
					tag: undefined,
					detachedHead: false,
					ahead: 0,
					behind: 0,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: []
				},
				commit: 'ef45678',
				mrgitBranch: 'master',
				mrgitTag: 'latest',
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( tableMock.push ).toHaveBeenNthCalledWith( 1,
				[ 'bar', '! master', 'ef45678', '' ]
			);

			expect( chalk.cyan ).toHaveBeenCalledTimes( 3 );

			// Table
			expect( chalk.cyan ).toHaveBeenNthCalledWith( 1, '!' );
			// Legend
			expect( chalk.cyan ).toHaveBeenNthCalledWith( 2, '!' );
			// Hints
			expect( chalk.cyan ).toHaveBeenNthCalledWith( 3, '!' );
		} );

		it( 'adds "!" before the branch name if specific tag should be checked out instead', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-bar' );

			commandResponses.add( {
				packageName: 'bar',
				status: {
					branch: 'master',
					tag: undefined,
					detachedHead: false,
					ahead: 0,
					behind: 0,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: []
				},
				commit: 'ef45678',
				mrgitBranch: 'master',
				mrgitTag: 'v30.0.0',
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( tableMock.push ).toHaveBeenNthCalledWith( 1,
				[ 'bar', '! master', 'ef45678', '' ]
			);

			expect( chalk.cyan ).toHaveBeenCalledTimes( 3 );

			// Table
			expect( chalk.cyan ).toHaveBeenNthCalledWith( 1, '!' );
			// Legend
			expect( chalk.cyan ).toHaveBeenNthCalledWith( 2, '!' );
			// Hints
			expect( chalk.cyan ).toHaveBeenNthCalledWith( 3, '!' );
		} );

		it( 'displays appropriate message when being checked out on a specific commit', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-bar' );

			commandResponses.add( {
				packageName: 'bar',
				status: {
					branch: 'HEAD (no branch)',
					tag: 'v35.3.2',
					detachedHead: true,
					ahead: null,
					behind: null,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: []
				},
				commit: 'ef45678',
				mrgitBranch: 'ef45678',
				mrgitTag: undefined,
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( tableMock.push ).toHaveBeenNthCalledWith( 1,
				[ 'bar', 'Using saved commit →', 'ef45678', '' ]
			);

			expect( chalk.cyan ).toHaveBeenCalledTimes( 1 );

			// Table
			expect( chalk.cyan ).toHaveBeenNthCalledWith( 1, '!' );
		} );

		it( 'sorts packages alphabetically', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-foo' );
			processedPackages.add( '@ckeditor/ckeditor5-bar' );
			processedPackages.add( '@ckeditor/ckeditor5-bom' );
			processedPackages.add( '@ckeditor/ckeditor5-aaa' );

			commandResponses.add( getCommandResponse( 'foo', '1111111' ) );
			commandResponses.add( getCommandResponse( 'bar', '2222222' ) );
			commandResponses.add( getCommandResponse( 'bom', '3333333' ) );
			commandResponses.add( getCommandResponse( 'aaa', '4444444' ) );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( tableMock.push ).toHaveBeenNthCalledWith( 1, [ 'aaa', 'master', '4444444', '' ] );
			expect( tableMock.push ).toHaveBeenNthCalledWith( 2, [ 'bar', 'master', '2222222', '' ] );
			expect( tableMock.push ).toHaveBeenNthCalledWith( 3, [ 'bom', 'master', '3333333', '' ] );
			expect( tableMock.push ).toHaveBeenNthCalledWith( 4, [ 'foo', 'master', '1111111', '' ] );

			function getCommandResponse( packageName, commit ) {
				return {
					packageName,
					status: {
						branch: 'master',
						tag: undefined,
						detachedHead: false,
						ahead: 0,
						behind: 0,
						staged: [],
						modified: [],
						untracked: [],
						unmerged: []
					},
					commit,
					mrgitBranch: 'master',
					mrgitTag: undefined,
					currentTag: 'v35.3.2',
					latestTag: 'v35.3.2'
				};
			}
		} );

		it( 'counts unmerged files as modified', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-foo' );

			commandResponses.add( {
				packageName: 'foo',
				status: {
					branch: 'master',
					tag: undefined,
					detachedHead: false,
					ahead: 0,
					behind: 2,
					staged: [],
					modified: [ 'README.md' ],
					untracked: [],
					unmerged: [ '.travis.yml' ]
				},
				commit: 'abcd123',
				mrgitBranch: 'master',
				mrgitTag: undefined,
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			tableMock.toString.mockReturnValue( '┻━┻' );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( Table ).toHaveBeenCalledExactlyOnceWith( {
				head: [ 'Package', 'Branch/Tag', 'Commit', 'Status' ],
				style: {
					compact: true
				}
			} );

			expect( tableMock.push ).toHaveBeenNthCalledWith( 1,
				[ 'foo', 'master ↓2', 'abcd123', 'M2' ]
			);

			expect( tableMock.toString ).toHaveBeenCalledTimes( 1 );

			expect( consoleLog ).toHaveBeenCalledTimes( 2 );
			expect( consoleLog ).toHaveBeenNthCalledWith( 1, '┻━┻' );
			expect( consoleLog ).toHaveBeenNthCalledWith( 2, expect.stringMatching( /^Legend:/ ) );
			expect( chalk.cyan ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'counts unmerged files as modified even if number of modified files is equal 0', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-foo' );

			commandResponses.add( {
				packageName: 'foo',
				status: {
					branch: 'master',
					tag: undefined,
					detachedHead: false,
					ahead: 0,
					behind: 2,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: [ '.travis.yml' ]
				},
				commit: 'abcd123',
				mrgitBranch: 'master',
				mrgitTag: undefined,
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			tableMock.toString.mockReturnValue( '┻━┻' );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( Table ).toHaveBeenCalledExactlyOnceWith( {
				head: [ 'Package', 'Branch/Tag', 'Commit', 'Status' ],
				style: {
					compact: true
				}
			} );

			expect( tableMock.push ).toHaveBeenNthCalledWith( 1,
				[ 'foo', 'master ↓2', 'abcd123', 'M1' ]
			);

			expect( tableMock.toString ).toHaveBeenCalledTimes( 1 );

			expect( consoleLog ).toHaveBeenCalledTimes( 2 );
			expect( consoleLog ).toHaveBeenNthCalledWith( 1, '┻━┻' );
			expect( consoleLog ).toHaveBeenNthCalledWith( 2, expect.stringMatching( /^Legend:/ ) );
			expect( chalk.cyan ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
