/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import syncCommand from '../../lib/commands/sync.js';
import execCommand from '../../lib/commands/exec.js';
import { shell } from '../../lib/utils/shell.js';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';

vi.mock( '../../lib/commands/exec.js' );
vi.mock( '../../lib/utils/shell.js' );
vi.mock( 'fs' );
vi.mock( 'url' );

describe( 'commands/sync', () => {
	let toolOptions, commandData;

	beforeEach( () => {
		vi.useFakeTimers();

		pathToFileURL.mockImplementation( path => ( { href: path } ) );

		toolOptions = {
			cwd: '/tmp',
			packages: '/tmp/packages',
			resolverPath: 'PATH_TO_RESOLVER'
		};

		commandData = {
			arguments: [],
			packageName: 'test-package',
			toolOptions,
			repository: {
				directory: 'test-package',
				url: 'git@github.com/organization/test-package.git',
				branch: 'master'
			}
		};
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( typeof syncCommand.helpMessage ).toEqual( 'string' );
		} );
	} );

	describe( 'execute()', () => {
		describe( 'first call on a package', () => {
			it( 'clones the repository if is not available', () => {
				fs.existsSync.mockReturnValue( false );
				shell.mockReturnValue( Promise.resolve( 'Git clone log.' ) );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( shell ).toHaveBeenCalledTimes( 2 );

						// Clone the repository.
						expect( shell ).toHaveBeenNthCalledWith( 1,
							'git clone --progress "git@github.com/organization/test-package.git" "/tmp/packages/test-package"'
						);
						// Change the directory to cloned package and check out to proper branch.
						expect( shell ).toHaveBeenNthCalledWith( 2,
							'cd "/tmp/packages/test-package" && git checkout --quiet "master"'
						);

						expect( response.logs.info ).toEqual( [
							'Package "test-package" was not found. Cloning...',
							'Git clone log.'
						] );
					} );
			} );

			it( 'clones the repository and checks out a specific tag', () => {
				commandData.repository.tag = 'v30.0.0';

				fs.existsSync.mockReturnValue( false );
				shell.mockReturnValue( Promise.resolve( 'Git clone log.' ) );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( shell ).toHaveBeenCalledTimes( 2 );

						// Clone the repository.
						expect( shell ).toHaveBeenNthCalledWith( 1,
							'git clone --progress "git@github.com/organization/test-package.git" "/tmp/packages/test-package"'
						);
						// Change the directory to cloned package and check out to proper branch.
						expect( shell ).toHaveBeenNthCalledWith( 2,
							'cd "/tmp/packages/test-package" && git checkout --quiet "tags/v30.0.0"'
						);

						expect( response.logs.info ).toEqual( [
							'Package "test-package" was not found. Cloning...',
							'Git clone log.'
						] );
					} );
			} );

			it( 'clones the repository and checks the latest tag', () => {
				commandData.repository.tag = 'latest';

				const command = 'cd "/tmp/packages/test-package" && git log --tags --simplify-by-decoration --pretty="%S"';

				fs.existsSync.mockReturnValue( false );
				shell.mockImplementation( shellArg => {
					if ( shellArg === command ) {
						return Promise.resolve( 'v35.3.2\nv35.3.1\nv35.3.0\nv35.2.1\nv35.2.0' );
					}

					return Promise.resolve( 'Git clone log.' );
				} );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( shell ).toHaveBeenCalledTimes( 3 );

						// Clone the repository.
						expect( shell ).toHaveBeenNthCalledWith( 1,
							'git clone --progress "git@github.com/organization/test-package.git" "/tmp/packages/test-package"'
						);
						// Look for the latest tag.
						expect( shell ).toHaveBeenNthCalledWith( 2, command );
						// Change the directory to cloned package and check out to proper branch.
						expect( shell ).toHaveBeenNthCalledWith( 3,
							'cd "/tmp/packages/test-package" && git checkout --quiet "tags/v35.3.2"'
						);

						expect( response.logs.info ).toEqual( [
							'Package "test-package" was not found. Cloning...',
							'Git clone log.'
						] );
					} );
			} );

			it( 'clones dependencies of installed package', () => {
				toolOptions.recursive = true;
				commandData.toolOptions.packages = __dirname + '/../fixtures';
				commandData.repository.directory = 'project-a';

				fs.existsSync.mockReturnValue( false );
				shell.mockReturnValue( Promise.resolve( 'Git clone log.' ) );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( response.packages ).is.an( 'array' );
						expect( response.packages ).toEqual( [ 'test-foo' ] );
					} );
			} );

			it( 'clones dev-dependencies of installed package', () => {
				toolOptions.recursive = true;
				commandData.toolOptions.packages = __dirname + '/../fixtures';
				commandData.repository.directory = 'project-with-options-in-mrgitjson';

				fs.existsSync.mockReturnValue( false );
				shell.mockReturnValue( Promise.resolve( 'Git clone log.' ) );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( response.packages ).is.an( 'array' );
						expect( response.packages ).toEqual( [ 'test-bar' ] );
					} );
			} );

			describe( 'repeats installation process', () => {
				it( 'for errors with capital letters', async () => {
					fs.existsSync.mockReturnValue( false );

					shell
						.mockRejectedValueOnce( [
							'exec: Cloning into \'/some/path\'...',
							'remote: Enumerating objects: 6, done.',
							'remote: Counting objects: 100% (6/6), done.',
							'remote: Compressing objects: 100% (6/6), done.',
							'packet_write_wait: Connection to 000.00.000.000 port 22: Broken pipe',
							'fatal: The remote end hung up unexpectedly',
							'fatal: early EOF',
							'fatal: index-pack failed'
						].join( '\n' ) )
						.mockResolvedValueOnce( 'Git clone log.' );

					const promise = syncCommand.execute( commandData );

					await vi.runAllTimersAsync();

					return promise
						.then( response => {
							expect( shell ).toHaveBeenCalledTimes( 3 );

							// First attempt.
							// Clone the repository.
							expect( shell ).toHaveBeenNthCalledWith( 1,
								'git clone --progress "git@github.com/organization/test-package.git" "/tmp/packages/test-package"'
							);

							// Second attempt.
							// Clone the repository.
							expect( shell ).toHaveBeenNthCalledWith( 2,
								'git clone --progress "git@github.com/organization/test-package.git" "/tmp/packages/test-package"'
							);
							// Change the directory to cloned package and check out to proper branch.
							expect( shell ).toHaveBeenNthCalledWith( 3,
								'cd "/tmp/packages/test-package" && git checkout --quiet "master"'
							);

							expect( response.logs.info ).toEqual( [
								'Package "test-package" was not found. Cloning...',
								'Git clone log.'
							] );
						} );
				} );

				it( 'for errors with small letters', async () => {
					fs.existsSync.mockReturnValue( false );

					shell
						.mockRejectedValueOnce( [
							'exec: Cloning into \'/some/path\'...',
							'remote: Enumerating objects: 6, done.',
							'remote: Counting objects: 100% (6/6), done.',
							'remote: Compressing objects: 100% (6/6), done.',
							'packet_write_wait: Connection to 000.00.000.000 port 22: Broken pipe',
							'fatal: the remote end hung up unexpectedly',
							'fatal: early EOF',
							'fatal: index-pack failed'
						].join( '\n' ) )
						.mockResolvedValueOnce( 'Git clone log.' );

					const promise = syncCommand.execute( commandData );

					await vi.runAllTimersAsync();

					return promise
						.then( response => {
							expect( shell ).toHaveBeenCalledTimes( 3 );

							// First attempt.
							// Clone the repository.
							expect( shell ).toHaveBeenNthCalledWith( 1,
								'git clone --progress "git@github.com/organization/test-package.git" "/tmp/packages/test-package"'
							);

							// Second attempt.
							// Clone the repository.
							expect( shell ).toHaveBeenNthCalledWith( 2,
								'git clone --progress "git@github.com/organization/test-package.git" "/tmp/packages/test-package"'
							);
							// Change the directory to cloned package and check out to proper branch.
							expect( shell ).toHaveBeenNthCalledWith( 3,
								'cd "/tmp/packages/test-package" && git checkout --quiet "master"'
							);

							expect( response.logs.info ).toEqual( [
								'Package "test-package" was not found. Cloning...',
								'Git clone log.'
							] );
						} );
				} );

				it( 'returns an error if command failed twice', async () => {
					fs.existsSync.mockReturnValue( false );

					const errorMessage = [
						'exec: Cloning into \'/some/path\'...',
						'remote: Enumerating objects: 6, done.',
						'remote: Counting objects: 100% (6/6), done.',
						'remote: Compressing objects: 100% (6/6), done.',
						'packet_write_wait: Connection to 000.00.000.000 port 22: Broken pipe',
						'fatal: the remote end hung up unexpectedly',
						'fatal: early EOF',
						'fatal: index-pack failed'
					].join( '\n' );

					shell
						.mockRejectedValueOnce( new Error( errorMessage ) )
						.mockRejectedValueOnce( new Error( errorMessage ) );

					const promise = syncCommand.execute( commandData );

					// Attach assertion before running timers to avoid error leak.
					const assertion = expect( promise ).rejects.toMatchObject( {
						logs: {
							info: [ 'Package "test-package" was not found. Cloning...' ],
							error: [ errorMessage ]
						}
					} );

					await vi.runAllTimersAsync();

					await assertion;

					return promise
						.then(
							() => {
								throw new Error( 'Expected that the Promise fails.' );
							},
							response => {
								expect( shell ).toHaveBeenCalledTimes( 2 );

								expect( response.logs.info ).toEqual( [
									'Package "test-package" was not found. Cloning...'
								] );

								expect( response.logs.error ).toEqual( [
									errorMessage
								] );
							}
						);
				} );
			} );
		} );

		describe( 'the repository is already installed', () => {
			it( 'resolves promise after pulling the changes', () => {
				fs.existsSync.mockReturnValue( true );

				execCommand.execute
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( 'Already on \'master\'.' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '* master\n  remotes/origin/master' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( 'Already up-to-date.' )
					} );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, expect.objectContaining(
							{ arguments: [ 'git status -s' ] }
						) );
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 2, expect.objectContaining(
							{ arguments: [ 'git fetch' ] }
						) );
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 3, expect.objectContaining(
							{ arguments: [ 'git checkout "master"' ] }
						) );
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 4, expect.objectContaining(
							{ arguments: [ 'git branch' ] }
						) );
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 5, expect.objectContaining(
							{ arguments: [ 'git pull origin "master"' ] }
						) );

						expect( response.logs.info ).toEqual( [
							'Already on \'master\'.',
							'Already up-to-date.'
						] );

						expect( execCommand.execute ).toHaveBeenCalledTimes( 5 );
					} );
			} );

			it( 'checks out specific tag', () => {
				commandData.repository.tag = 'v35.3.0';

				fs.existsSync.mockReturnValue( true );

				execCommand.execute
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( 'Note: checking out \'tags/v35.3.0\'.' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( [
							'* (HEAD detached at 1a0ff0a)',
							'  master',
							'  remotes/origin/master'
						].join( '\n' ) ) } )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( 'Already up-to-date.' )
					} );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, expect.objectContaining(
							{ arguments: [ 'git status -s' ] }
						) );
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 2, expect.objectContaining(
							{ arguments: [ 'git fetch' ] }
						) );
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 3, expect.objectContaining(
							{ arguments: [ 'git checkout "tags/v35.3.0"' ] }
						) );
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 4, expect.objectContaining(
							{ arguments: [ 'git branch' ] }
						) );

						expect( response.logs.info ).toEqual( [
							'Note: checking out \'tags/v35.3.0\'.',
							'Package "test-package" is on a detached commit.'
						] );

						expect( execCommand.execute ).toHaveBeenCalledTimes( 4 );
					} );
			} );

			it( 'checks out the latest tag', () => {
				commandData.repository.tag = 'latest';

				fs.existsSync.mockReturnValue( true );

				execCommand.execute
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( 'v35.3.2\nv35.3.1\nv35.3.0\nv35.2.1\nv35.3.0' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( 'Note: checking out \'tags/v35.3.2\'.' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( [
							'* (HEAD detached at 1a0ff0a)',
							'  master',
							'  remotes/origin/master'
						].join( '\n' ) ) } )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( 'Already up-to-date.' )
					} );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, expect.objectContaining(
							{ arguments: [ 'git status -s' ] }
						) );
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 2, expect.objectContaining(
							{ arguments: [ 'git fetch' ] }
						) );
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 3, expect.objectContaining(
							{ arguments: [ 'git log --tags --simplify-by-decoration --pretty="%S"' ] }
						) );
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 4, expect.objectContaining(
							{ arguments: [ 'git checkout "tags/v35.3.2"' ] }
						) );
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 5, expect.objectContaining(
							{ arguments: [ 'git branch' ] }
						) );

						expect( response.logs.info ).toEqual( [
							'Note: checking out \'tags/v35.3.2\'.',
							'Package "test-package" is on a detached commit.'
						] );

						expect( execCommand.execute ).toHaveBeenCalledTimes( 5 );
					} );
			} );

			it( 'throws an error when trying to check out the latest tag in repository without tags', () => {
				commandData.repository.tag = 'latest';

				fs.existsSync.mockReturnValue( true );

				execCommand.execute
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs()
					} );

				return syncCommand.execute( commandData )
					.then( () => {
						throw new Error( 'Expected to throw' );
					} )
					.catch( response => {
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, expect.objectContaining(
							{ arguments: [ 'git status -s' ] }
						) );
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 2, expect.objectContaining(
							{ arguments: [ 'git fetch' ] }
						) );
						expect( execCommand.execute ).toHaveBeenNthCalledWith( 3, expect.objectContaining(
							{ arguments: [ 'git log --tags --simplify-by-decoration --pretty="%S"' ] }
						) );

						expect( execCommand.execute ).toHaveBeenCalledTimes( 3 );

						expect( response.logs.error[ 0 ] ).toEqual(
							'Can\'t check out the latest tag as package "test-package" has no tags. Aborted.'
						);
					} );
			} );

			it( 'aborts if package has uncommitted changes', () => {
				fs.existsSync.mockReturnValue( true );

				execCommand.execute.mockReturnValue( Promise.resolve( {
					logs: getCommandLogs( ' M first-file.js\n ?? second-file.js' )
				} ) );

				return syncCommand.execute( commandData )
					.then(
						() => {
							throw new Error( 'Supposed to be rejected.' );
						},
						response => {
							const errMsg = 'Package "test-package" has uncommitted changes. Aborted.';

							expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).toEqual( errMsg );
							expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, expect.objectContaining(
								{ arguments: [ 'git status -s' ] }
							) );
						}
					);
			} );

			it( 'does not pull the changes if detached on a commit or a tag', () => {
				fs.existsSync.mockReturnValue( true );

				commandData.repository.branch = '1a0ff0a';

				execCommand.execute
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( 'Note: checking out \'1a0ff0a\'.' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( [
							'* (HEAD detached at 1a0ff0a)',
							'  master',
							'  remotes/origin/master'
						].join( '\n' ) ) } );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( response.logs.info ).toEqual( [
							'Note: checking out \'1a0ff0a\'.',
							'Package "test-package" is on a detached commit.'
						] );

						expect( execCommand.execute ).toHaveBeenCalledTimes( 4 );
					} );
			} );

			it( 'aborts if user wants to pull changes from non-existing branch', () => {
				fs.existsSync.mockReturnValue( true );

				commandData.repository.branch = 'develop';

				execCommand.execute
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( 'Already on \'develop\'.' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '* develop' )
					} )
					.mockRejectedValueOnce( {
						logs: getCommandLogs( 'fatal: Couldn\'t find remote ref develop', true )
					} );

				return syncCommand.execute( commandData )
					.then(
						() => {
							throw new Error( 'Supposed to be rejected.' );
						},
						response => {
							expect( response.logs.info ).toEqual( [
								'Already on \'develop\'.'
							] );

							const errMsg = 'fatal: Couldn\'t find remote ref develop';
							expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).toEqual( errMsg );

							expect( execCommand.execute ).toHaveBeenCalledTimes( 5 );
						}
					);
			} );

			it( 'aborts if user wants to check out to non-existing branch', () => {
				fs.existsSync.mockReturnValue( true );

				commandData.repository.branch = 'non-existing-branch';

				execCommand.execute
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '' )
					} )
					.mockResolvedValueOnce( {
						logs: getCommandLogs( '' )
					} )
					.mockRejectedValueOnce( {
						logs: getCommandLogs( 'error: pathspec \'ggdfgd\' did not match any file(s) known to git.', true )
					} );

				return syncCommand.execute( commandData )
					.then(
						() => {
							throw new Error( 'Supposed to be rejected.' );
						},
						response => {
							const errMsg = 'error: pathspec \'ggdfgd\' did not match any file(s) known to git.';
							expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).toEqual( errMsg );

							expect( execCommand.execute ).toHaveBeenCalledTimes( 3 );
						}
					);
			} );
		} );
	} );

	describe( 'afterExecute()', () => {
		// eslint-disable-next-line @stylistic/max-len
		it( 'informs about number of processed packages and differences between packages in directory and defined in mrgit.json', async () => {
			const consoleLog = vi.spyOn( console, 'log' ).mockImplementation( () => {} );

			const processedPackages = new Set();
			processedPackages.add( 'package-1' );
			processedPackages.add( 'package-2' );

			toolOptions.dependencies = {
				'package-1': 'foo/package-1',
				'package-2': 'foo/package-2'
			};

			vi.doMock( toolOptions.resolverPath, () => ( { default: vi.fn()
				.mockReturnValueOnce( { directory: 'package-1' } )
				.mockReturnValueOnce( { directory: 'package-2' } )
			} ) );

			fs.readdirSync.mockReturnValue( [
				'package-1',
				'package-2',
				'package-3',
				'.DS_Store'
			] );

			fs.lstatSync.mockImplementation( path => {
				if ( path === '/tmp/packages/.DS_Store' ) {
					return {
						isDirectory() {
							return false;
						}
					};
				}

				return {
					isDirectory() {
						return true;
					}
				};
			} );

			await syncCommand.afterExecute( processedPackages, null, toolOptions );

			expect( consoleLog ).toHaveBeenCalledTimes( 3 );
			expect( consoleLog ).toHaveBeenNthCalledWith( 1,
				'2 packages have been processed.'
			);
			expect( consoleLog ).toHaveBeenNthCalledWith( 2,
				'Paths to directories listed below are skipped by mrgit because they are not defined in configuration file:'
			);
			expect( consoleLog ).toHaveBeenNthCalledWith( 3,
				'  - /tmp/packages/package-3'
			);
		} );

		it( 'informs about differences between packages in directory and defined in mrgit.json for scopes packages', async () => {
			const consoleLog = vi.spyOn( console, 'log' ).mockImplementation( () => {} );

			const processedPackages = new Set();
			processedPackages.add( 'package-1' );
			processedPackages.add( 'package-2' );

			toolOptions.dependencies = {
				'package-1': 'foo/package-1',
				'package-2': 'foo/package-2'
			};

			vi.doMock( toolOptions.resolverPath, () => ( { default: vi.fn()
				.mockReturnValueOnce( { directory: 'package-1' } )
				.mockReturnValueOnce( { directory: 'package-2' } )
			} ) );

			fs.readdirSync
				.mockReturnValueOnce( [
					'package-1',
					'package-2',
					'@foo',
					'.DS_Store'
				] )
				.mockReturnValueOnce( [
					'.DS_Store',
					'package-3'
				] );

			fs.lstatSync.mockImplementation( path => {
				if ( path === '/tmp/packages/@foo/.DS_Store' ) {
					return {
						isDirectory() {
							return false;
						}
					};
				}

				if ( path === '/tmp/packages/.DS_Store' ) {
					return {
						isDirectory() {
							return false;
						}
					};
				}

				return {
					isDirectory() {
						return true;
					}
				};
			} );

			await syncCommand.afterExecute( processedPackages, null, toolOptions );

			expect( consoleLog ).toHaveBeenCalledTimes( 3 );
			expect( consoleLog ).toHaveBeenNthCalledWith( 1,
				'2 packages have been processed.'
			);
			expect( consoleLog ).toHaveBeenNthCalledWith( 2,
				'Paths to directories listed below are skipped by mrgit because they are not defined in configuration file:'
			);
			expect( consoleLog ).toHaveBeenNthCalledWith( 3,
				'  - /tmp/packages/@foo/package-3'
			);
		} );

		it( 'does not inform about differences between packages in directory and defined in mrgit.json if everything is ok', async () => {
			const consoleLog = vi.spyOn( console, 'log' ).mockImplementation( () => {} );

			const processedPackages = new Set();
			processedPackages.add( 'package-1' );
			processedPackages.add( 'package-2' );

			toolOptions.dependencies = {
				'package-1': 'foo/package-1',
				'package-2': 'foo/package-2'
			};

			vi.doMock( toolOptions.resolverPath, () => ( { default: vi.fn()
				.mockReturnValueOnce( { directory: 'package-1' } )
				.mockReturnValueOnce( { directory: 'package-2' } )
			} ) );

			fs.readdirSync.mockReturnValue( [
				'package-1',
				'package-2'
			] );

			fs.lstatSync.mockReturnValue( {
				isDirectory() {
					return true;
				}
			} );

			await syncCommand.afterExecute( processedPackages, null, toolOptions );

			expect( consoleLog ).toHaveBeenCalledTimes( 1 );
			expect( consoleLog ).toHaveBeenNthCalledWith( 1,
				'2 packages have been processed.'
			);
		} );
	} );

	function getCommandLogs( msg, isError = false ) {
		const logs = {
			error: [],
			info: []
		};

		if ( isError ) {
			logs.error.push( msg );
		} else if ( msg ) {
			logs.info.push( msg );
		}

		return logs;
	}
} );
