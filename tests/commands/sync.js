/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = require( 'chai' ).expect;

describe( 'commands/sync', () => {
	let syncCommand, stubs, toolOptions, commandData;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			shell: sinon.stub(),
			exec: sinon.stub(),
			fs: {
				existsSync: sinon.stub( fs, 'existsSync' ),
				readdirSync: sinon.stub( fs, 'readdirSync' )
			},
			path: {
				join: sinon.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) )
			},
			bootstrapCommand: {
				execute: sinon.stub()
			},
			execCommand: {
				execute: sinon.stub()
			},
			repositoryResolver: sinon.stub()
		};

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

		mockery.registerMock( './exec', stubs.execCommand );
		mockery.registerMock( '../utils/shell', stubs.shell );
		mockery.registerMock( 'PATH_TO_RESOLVER', stubs.repositoryResolver );

		syncCommand = require( '../../lib/commands/sync' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.deregisterAll();
		mockery.disable();
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( syncCommand.helpMessage ).is.a( 'string' );
		} );
	} );

	describe( 'execute()', () => {
		describe( 'first call on a package', () => {
			it( 'clones the repository if is not available', () => {
				stubs.fs.existsSync.returns( false );
				stubs.shell.returns( Promise.resolve( 'Git clone log.' ) );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( stubs.shell.callCount ).to.equal( 2 );

						// Clone the repository.
						expect( stubs.shell.getCall( 0 ).args[ 0 ] ).to.equal(
							'git clone --progress "git@github.com/organization/test-package.git" "/tmp/packages/test-package"'
						);
						// Change the directory to cloned package and check out to proper branch.
						expect( stubs.shell.getCall( 1 ).args[ 0 ] ).to.equal(
							'cd "/tmp/packages/test-package" && git checkout --quiet "master"'
						);

						expect( response.logs.info ).to.deep.equal( [
							'Package "test-package" was not found. Cloning...',
							'Git clone log.'
						] );
					} );
			} );

			it( 'clones the repository and checks out a specific tag', () => {
				commandData.repository.tag = 'v30.0.0';

				stubs.fs.existsSync.returns( false );
				stubs.shell.returns( Promise.resolve( 'Git clone log.' ) );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( stubs.shell.callCount ).to.equal( 2 );

						// Clone the repository.
						expect( stubs.shell.getCall( 0 ).args[ 0 ] ).to.equal(
							'git clone --progress "git@github.com/organization/test-package.git" "/tmp/packages/test-package"'
						);
						// Change the directory to cloned package and check out to proper branch.
						expect( stubs.shell.getCall( 1 ).args[ 0 ] ).to.equal(
							'cd "/tmp/packages/test-package" && git checkout --quiet "tags/v30.0.0"'
						);

						expect( response.logs.info ).to.deep.equal( [
							'Package "test-package" was not found. Cloning...',
							'Git clone log.'
						] );
					} );
			} );

			it( 'clones the repository and checks the latest tag', () => {
				commandData.repository.tag = 'latest';

				const command = 'cd "/tmp/packages/test-package" && git log --tags --simplify-by-decoration --pretty="%S"';

				stubs.fs.existsSync.returns( false );
				stubs.shell.returns( Promise.resolve( 'Git clone log.' ) );
				stubs.shell.withArgs( command ).returns( Promise.resolve( 'v35.3.2\nv35.3.1\nv35.3.0\nv35.2.1\nv35.2.0' ) );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( stubs.shell.callCount ).to.equal( 3 );

						// Clone the repository.
						expect( stubs.shell.getCall( 0 ).args[ 0 ] ).to.equal(
							'git clone --progress "git@github.com/organization/test-package.git" "/tmp/packages/test-package"'
						);
						// Look for the latest tag.
						expect( stubs.shell.getCall( 1 ).args[ 0 ] ).to.equal( command );
						// Change the directory to cloned package and check out to proper branch.
						expect( stubs.shell.getCall( 2 ).args[ 0 ] ).to.equal(
							'cd "/tmp/packages/test-package" && git checkout --quiet "tags/v35.3.2"'
						);

						expect( response.logs.info ).to.deep.equal( [
							'Package "test-package" was not found. Cloning...',
							'Git clone log.'
						] );
					} );
			} );

			it( 'clones dependencies of installed package', () => {
				toolOptions.recursive = true;
				commandData.toolOptions.packages = __dirname + '/../fixtures';
				commandData.repository.directory = 'project-a';

				stubs.fs.existsSync.returns( false );
				stubs.shell.returns( Promise.resolve( 'Git clone log.' ) );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( response.packages ).is.an( 'array' );
						expect( response.packages ).to.deep.equal( [ 'test-foo' ] );
					} );
			} );

			it( 'clones dev-dependencies of installed package', () => {
				toolOptions.recursive = true;
				commandData.toolOptions.packages = __dirname + '/../fixtures';
				commandData.repository.directory = 'project-with-options-in-mrgitjson';

				stubs.fs.existsSync.returns( false );
				stubs.shell.returns( Promise.resolve( 'Git clone log.' ) );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( response.packages ).is.an( 'array' );
						expect( response.packages ).to.deep.equal( [ 'test-bar' ] );
					} );
			} );

			describe( 'repeats installation process', function() {
				this.timeout( 5500 );

				it( 'for errors with capital letters', () => {
					stubs.fs.existsSync.returns( false );

					stubs.shell.onFirstCall().returns( Promise.reject( [
						'exec: Cloning into \'/some/path\'...',
						'remote: Enumerating objects: 6, done.',
						'remote: Counting objects: 100% (6/6), done.',
						'remote: Compressing objects: 100% (6/6), done.',
						'packet_write_wait: Connection to 000.00.000.000 port 22: Broken pipe',
						'fatal: The remote end hung up unexpectedly',
						'fatal: early EOF',
						'fatal: index-pack failed'
					].join( '\n' ) ) );

					stubs.shell.onSecondCall().returns( Promise.resolve( 'Git clone log.' ) );

					return syncCommand.execute( commandData )
						.then( response => {
							expect( stubs.shell.callCount ).to.equal( 3 );

							// First attempt.
							// Clone the repository.
							expect( stubs.shell.getCall( 0 ).args[ 0 ] ).to.equal(
								'git clone --progress "git@github.com/organization/test-package.git" "/tmp/packages/test-package"'
							);

							// Second attempt.
							// Clone the repository.
							expect( stubs.shell.getCall( 1 ).args[ 0 ] ).to.equal(
								'git clone --progress "git@github.com/organization/test-package.git" "/tmp/packages/test-package"'
							);
							// Change the directory to cloned package and check out to proper branch.
							expect( stubs.shell.getCall( 2 ).args[ 0 ] ).to.equal(
								'cd "/tmp/packages/test-package" && git checkout --quiet "master"'
							);

							expect( response.logs.info ).to.deep.equal( [
								'Package "test-package" was not found. Cloning...',
								'Git clone log.'
							] );
						} );
				} );

				it( 'for errors with small letters', () => {
					stubs.fs.existsSync.returns( false );

					stubs.shell.onFirstCall().returns( Promise.reject( [
						'exec: Cloning into \'/some/path\'...',
						'remote: Enumerating objects: 6, done.',
						'remote: Counting objects: 100% (6/6), done.',
						'remote: Compressing objects: 100% (6/6), done.',
						'packet_write_wait: Connection to 000.00.000.000 port 22: Broken pipe',
						'fatal: the remote end hung up unexpectedly',
						'fatal: early EOF',
						'fatal: index-pack failed'
					].join( '\n' ) ) );

					stubs.shell.onSecondCall().returns( Promise.resolve( 'Git clone log.' ) );

					return syncCommand.execute( commandData )
						.then( response => {
							expect( stubs.shell.callCount ).to.equal( 3 );

							// First attempt.
							// Clone the repository.
							expect( stubs.shell.getCall( 0 ).args[ 0 ] ).to.equal(
								'git clone --progress "git@github.com/organization/test-package.git" "/tmp/packages/test-package"'
							);

							// Second attempt.
							// Clone the repository.
							expect( stubs.shell.getCall( 1 ).args[ 0 ] ).to.equal(
								'git clone --progress "git@github.com/organization/test-package.git" "/tmp/packages/test-package"'
							);
							// Change the directory to cloned package and check out to proper branch.
							expect( stubs.shell.getCall( 2 ).args[ 0 ] ).to.equal(
								'cd "/tmp/packages/test-package" && git checkout --quiet "master"'
							);

							expect( response.logs.info ).to.deep.equal( [
								'Package "test-package" was not found. Cloning...',
								'Git clone log.'
							] );
						} );
				} );

				it( 'returns an error if command failed twice', () => {
					stubs.fs.existsSync.returns( false );

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

					stubs.shell.onFirstCall().returns( Promise.reject( new Error( errorMessage ) ) );

					// Can't use `.returns()` because it generates `UnhandledPromiseRejectionWarning` in the console.
					stubs.shell.onSecondCall().callsFake( () => {
						return Promise.reject( errorMessage );
					} );

					return syncCommand.execute( commandData )
						.then(
							() => {
								throw new Error( 'Expected that the Promise fails.' );
							},
							response => {
								expect( stubs.shell.calledTwice ).to.equal( true );

								expect( response.logs.info ).to.deep.equal( [
									'Package "test-package" was not found. Cloning...'
								] );

								expect( response.logs.error ).to.deep.equal( [
									errorMessage
								] );
							}
						);
				} );
			} );
		} );

		describe( 'the repository is already installed', () => {
			it( 'resolves promise after pulling the changes', () => {
				stubs.fs.existsSync.returns( true );

				const exec = stubs.execCommand.execute;

				exec.onCall( 0 ).returns( Promise.resolve( {
					logs: getCommandLogs( '' )
				} ) );

				exec.onCall( 1 ).returns( Promise.resolve( {
					logs: getCommandLogs( '' )
				} ) );

				exec.onCall( 2 ).returns( Promise.resolve( {
					logs: getCommandLogs( 'Already on \'master\'.' )
				} ) );

				exec.onCall( 3 ).returns( Promise.resolve( {
					logs: getCommandLogs( '* master\n  remotes/origin/master' )
				} ) );

				exec.onCall( 4 ).returns( Promise.resolve( {
					logs: getCommandLogs( 'Already up-to-date.' )
				} ) );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( exec.getCall( 0 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git status -s' );
						expect( exec.getCall( 1 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git fetch' );
						expect( exec.getCall( 2 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git checkout "master"' );
						expect( exec.getCall( 3 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git branch' );
						expect( exec.getCall( 4 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git pull origin "master"' );

						expect( response.logs.info ).to.deep.equal( [
							'Already on \'master\'.',
							'Already up-to-date.'
						] );

						expect( exec.callCount ).to.equal( 5 );
					} );
			} );

			it( 'checks out specific tag', () => {
				commandData.repository.tag = 'v35.3.0';

				stubs.fs.existsSync.returns( true );

				const exec = stubs.execCommand.execute;

				exec.onCall( 0 ).returns( Promise.resolve( {
					logs: getCommandLogs( '' )
				} ) );

				exec.onCall( 1 ).returns( Promise.resolve( {
					logs: getCommandLogs( '' )
				} ) );

				exec.onCall( 2 ).returns( Promise.resolve( {
					logs: getCommandLogs( 'Note: checking out \'tags/v35.3.0\'.' )
				} ) );

				exec.onCall( 3 ).returns( Promise.resolve( {
					logs: getCommandLogs( [
						'* (HEAD detached at 1a0ff0a)',
						'  master',
						'  remotes/origin/master'
					].join( '\n' ) )
				} ) );

				exec.onCall( 5 ).returns( Promise.resolve( {
					logs: getCommandLogs( 'Already up-to-date.' )
				} ) );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( exec.getCall( 0 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git status -s' );
						expect( exec.getCall( 1 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git fetch' );
						expect( exec.getCall( 2 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git checkout "tags/v35.3.0"' );
						expect( exec.getCall( 3 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git branch' );

						expect( response.logs.info ).to.deep.equal( [
							'Note: checking out \'tags/v35.3.0\'.',
							'Package "test-package" is on a detached commit.'
						] );

						expect( exec.callCount ).to.equal( 4 );
					} );
			} );

			it( 'checks out the latest tag', () => {
				commandData.repository.tag = 'latest';

				stubs.fs.existsSync.returns( true );

				const exec = stubs.execCommand.execute;

				exec.onCall( 0 ).returns( Promise.resolve( {
					logs: getCommandLogs( '' )
				} ) );

				exec.onCall( 1 ).returns( Promise.resolve( {
					logs: getCommandLogs( '' )
				} ) );

				exec.onCall( 2 ).returns( Promise.resolve( {
					logs: getCommandLogs( 'v35.3.2\nv35.3.1\nv35.3.0\nv35.2.1\nv35.3.0' )
				} ) );

				exec.onCall( 3 ).returns( Promise.resolve( {
					logs: getCommandLogs( 'Note: checking out \'tags/v35.3.2\'.' )
				} ) );

				exec.onCall( 4 ).returns( Promise.resolve( {
					logs: getCommandLogs( [
						'* (HEAD detached at 1a0ff0a)',
						'  master',
						'  remotes/origin/master'
					].join( '\n' ) )
				} ) );

				exec.onCall( 5 ).returns( Promise.resolve( {
					logs: getCommandLogs( 'Already up-to-date.' )
				} ) );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( exec.getCall( 0 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git status -s' );
						expect( exec.getCall( 1 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git fetch' );
						expect( exec.getCall( 2 ).args[ 0 ].arguments[ 0 ] ).to.equal(
							'git log --tags --simplify-by-decoration --pretty="%S"'
						);
						expect( exec.getCall( 3 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git checkout "tags/v35.3.2"' );
						expect( exec.getCall( 4 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git branch' );

						expect( response.logs.info ).to.deep.equal( [
							'Note: checking out \'tags/v35.3.2\'.',
							'Package "test-package" is on a detached commit.'
						] );

						expect( exec.callCount ).to.equal( 5 );
					} );
			} );

			it( 'aborts if package has uncommitted changes', () => {
				stubs.fs.existsSync.returns( true );

				const exec = stubs.execCommand.execute;

				exec.returns( Promise.resolve( {
					logs: getCommandLogs( ' M first-file.js\n ?? second-file.js' )
				} ) );

				return syncCommand.execute( commandData )
					.then(
						() => {
							throw new Error( 'Supposed to be rejected.' );
						},
						response => {
							const errMsg = 'Package "test-package" has uncommitted changes. Aborted.';

							expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( errMsg );
							expect( exec.firstCall.args[ 0 ].arguments[ 0 ] ).to.equal( 'git status -s' );
						}
					);
			} );

			it( 'does not pull the changes if detached on a commit or a tag', () => {
				stubs.fs.existsSync.returns( true );

				commandData.repository.branch = '1a0ff0a';

				const exec = stubs.execCommand.execute;

				exec.onCall( 0 ).returns( Promise.resolve( {
					logs: getCommandLogs( '' )
				} ) );

				exec.onCall( 1 ).returns( Promise.resolve( {
					logs: getCommandLogs( '' )
				} ) );

				exec.onCall( 2 ).returns( Promise.resolve( {
					logs: getCommandLogs( 'Note: checking out \'1a0ff0a\'.' )
				} ) );

				exec.onCall( 3 ).returns( Promise.resolve( {
					logs: getCommandLogs( [
						'* (HEAD detached at 1a0ff0a)',
						'  master',
						'  remotes/origin/master'
					].join( '\n' ) )
				} ) );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( response.logs.info ).to.deep.equal( [
							'Note: checking out \'1a0ff0a\'.',
							'Package "test-package" is on a detached commit.'
						] );

						expect( exec.callCount ).to.equal( 4 );
					} );
			} );

			it( 'aborts if user wants to pull changes from non-existing branch', () => {
				stubs.fs.existsSync.returns( true );

				commandData.repository.branch = 'develop';

				const exec = stubs.execCommand.execute;

				exec.onCall( 0 ).returns( Promise.resolve( {
					logs: getCommandLogs( '' )
				} ) );

				exec.onCall( 1 ).returns( Promise.resolve( {
					logs: getCommandLogs( '' )
				} ) );

				exec.onCall( 2 ).returns( Promise.resolve( {
					logs: getCommandLogs( 'Already on \'develop\'.' )
				} ) );

				exec.onCall( 3 ).returns( Promise.resolve( {
					logs: getCommandLogs( '* develop' )
				} ) );

				exec.onCall( 4 ).returns( Promise.reject( {
					logs: getCommandLogs( 'fatal: Couldn\'t find remote ref develop', true )
				} ) );

				return syncCommand.execute( commandData )
					.then(
						() => {
							throw new Error( 'Supposed to be rejected.' );
						},
						response => {
							expect( response.logs.info ).to.deep.equal( [
								'Already on \'develop\'.'
							] );

							const errMsg = 'fatal: Couldn\'t find remote ref develop';
							expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( errMsg );

							expect( exec.callCount ).to.equal( 5 );
						}
					);
			} );

			it( 'aborts if user wants to check out to non-existing branch', () => {
				stubs.fs.existsSync.returns( true );

				commandData.repository.branch = 'non-existing-branch';

				const exec = stubs.execCommand.execute;

				exec.onCall( 0 ).returns( Promise.resolve( {
					logs: getCommandLogs( '' )
				} ) );

				exec.onCall( 1 ).returns( Promise.resolve( {
					logs: getCommandLogs( '' )
				} ) );

				exec.onCall( 2 ).returns( Promise.reject( {
					logs: getCommandLogs( 'error: pathspec \'ggdfgd\' did not match any file(s) known to git.', true )
				} ) );

				return syncCommand.execute( commandData )
					.then(
						() => {
							throw new Error( 'Supposed to be rejected.' );
						},
						response => {
							const errMsg = 'error: pathspec \'ggdfgd\' did not match any file(s) known to git.';
							expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( errMsg );

							expect( exec.callCount ).to.equal( 3 );
						}
					);
			} );
		} );
	} );

	describe( 'afterExecute()', () => {
		it( 'informs about number of processed packages and differences between packages in directory and defined in mrgit.json', () => {
			stubs.fs.lstatSync = sinon.stub( fs, 'lstatSync' );

			const consoleLog = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			processedPackages.add( 'package-1' );
			processedPackages.add( 'package-2' );

			toolOptions.dependencies = {
				'package-1': 'foo/package-1',
				'package-2': 'foo/package-2'
			};

			stubs.repositoryResolver.onFirstCall().returns( { directory: 'package-1' } );
			stubs.repositoryResolver.onSecondCall().returns( { directory: 'package-2' } );

			stubs.fs.readdirSync.returns( [
				'package-1',
				'package-2',
				'package-3',
				'.DS_Store'
			] );

			stubs.fs.lstatSync.returns( {
				isDirectory() {
					return true;
				}
			} );

			stubs.fs.lstatSync.withArgs( '/tmp/packages/.DS_Store' ).returns( {
				isDirectory() {
					return false;
				}
			} );

			syncCommand.afterExecute( processedPackages, null, toolOptions );
			consoleLog.restore();

			expect( consoleLog.callCount ).to.equal( 3 );
			expect( consoleLog.firstCall.args[ 0 ] ).to.match( /2 packages have been processed\./ );
			expect( consoleLog.secondCall.args[ 0 ] ).to.match(
				/Paths to directories listed below are skipped by mrgit because they are not defined in "mrgit\.json":/
			);
			expect( consoleLog.thirdCall.args[ 0 ] ).to.match( / {2}- .*\/packages\/package-3/ );
		} );

		it( 'informs about differences between packages in directory and defined in mrgit.json for scopes packages', () => {
			stubs.fs.lstatSync = sinon.stub( fs, 'lstatSync' );

			const consoleLog = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			processedPackages.add( 'package-1' );
			processedPackages.add( 'package-2' );

			toolOptions.dependencies = {
				'package-1': 'foo/package-1',
				'package-2': 'foo/package-2'
			};

			stubs.repositoryResolver.onFirstCall().returns( { directory: 'package-1' } );
			stubs.repositoryResolver.onSecondCall().returns( { directory: 'package-2' } );

			stubs.fs.readdirSync.onFirstCall().returns( [
				'package-1',
				'package-2',
				'@foo',
				'.DS_Store'
			] );

			stubs.fs.readdirSync.onSecondCall().returns( [
				'.DS_Store',
				'package-3'
			] );

			stubs.fs.lstatSync.returns( {
				isDirectory() {
					return true;
				}
			} );

			stubs.fs.lstatSync.withArgs( '/tmp/packages/@foo/.DS_Store' ).returns( {
				isDirectory() {
					return false;
				}
			} );

			stubs.fs.lstatSync.withArgs( '/tmp/packages/.DS_Store' ).returns( {
				isDirectory() {
					return false;
				}
			} );

			syncCommand.afterExecute( processedPackages, null, toolOptions );
			consoleLog.restore();

			expect( consoleLog.callCount ).to.equal( 3 );
			expect( consoleLog.firstCall.args[ 0 ] ).to.match( /2 packages have been processed\./ );
			expect( consoleLog.secondCall.args[ 0 ] ).to.match(
				/Paths to directories listed below are skipped by mrgit because they are not defined in "mrgit\.json":/
			);
			expect( consoleLog.thirdCall.args[ 0 ] ).to.match( / {2}- .*\/packages\/@foo\/package-3/ );
		} );

		it( 'does not inform about differences between packages in directory and defined in mrgit.json if everything is ok', () => {
			stubs.fs.lstatSync = sinon.stub( fs, 'lstatSync' );

			const consoleLog = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			processedPackages.add( 'package-1' );
			processedPackages.add( 'package-2' );

			toolOptions.dependencies = {
				'package-1': 'foo/package-1',
				'package-2': 'foo/package-2'
			};

			stubs.repositoryResolver.onFirstCall().returns( { directory: 'package-1' } );
			stubs.repositoryResolver.onSecondCall().returns( { directory: 'package-2' } );

			stubs.fs.readdirSync.returns( [
				'package-1',
				'package-2'
			] );

			stubs.fs.lstatSync.returns( {
				isDirectory() {
					return true;
				}
			} );

			syncCommand.afterExecute( processedPackages, null, toolOptions );

			expect( consoleLog.callCount ).to.equal( 1 );
			expect( consoleLog.firstCall.args[ 0 ] ).to.match( /2 packages have been processed\./ );

			consoleLog.restore();
		} );
	} );

	function getCommandLogs( msg, isError = false ) {
		const logs = {
			error: [],
			info: []
		};

		if ( isError ) {
			logs.error.push( msg );
		} else {
			logs.info.push( msg );
		}

		return logs;
	}
} );
