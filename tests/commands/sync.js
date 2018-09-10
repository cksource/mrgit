/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
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
	let syncCommand, stubs, commandData;

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
				existsSync: sinon.stub( fs, 'existsSync' )
			},
			path: {
				join: sinon.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) )
			},
			bootstrapCommand: {
				execute: sinon.stub()
			},
			execCommand: {
				execute: sinon.stub()
			}
		};

		commandData = {
			arguments: [],
			packageName: 'test-package',
			mgitOptions: {
				cwd: __dirname,
				packages: 'packages'
			},
			repository: {
				directory: 'test-package',
				url: 'git@github.com/organization/test-package.git',
				branch: 'master'
			}
		};

		mockery.registerMock( './exec', stubs.execCommand );
		mockery.registerMock( '../utils/shell', stubs.shell );

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
			it( 'clones the package if is not available', () => {
				stubs.fs.existsSync.returns( false );
				stubs.shell.returns( Promise.resolve( 'Git clone log.' ) );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( stubs.shell.calledOnce ).to.equal( true );

						const cloneCommand = stubs.shell.firstCall.args[ 0 ].split( ' && ' );

						// Clone the repository.
						expect( cloneCommand[ 0 ] )
							.to.equal( 'git clone --progress "git@github.com/organization/test-package.git" "packages/test-package"' );
						// Change the directory to cloned package.
						expect( cloneCommand[ 1 ] ).to.equal( 'cd "packages/test-package"' );
						// And check out to proper branch.
						expect( cloneCommand[ 2 ] ).to.equal( 'git checkout --quiet master' );

						expect( response.logs.info ).to.deep.equal( [
							'Package "test-package" was not found. Cloning...',
							'Git clone log.'
						] );
					} );
			} );

			it( 'clones dependencies of installed package', () => {
				commandData.arguments.push( '--recursive' );
				commandData.mgitOptions.packages = __dirname + '/../fixtures';
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
				commandData.arguments.push( '--recursive' );
				commandData.mgitOptions.packages = __dirname + '/../fixtures';
				commandData.repository.directory = 'project-with-options-in-mgitjson';

				stubs.fs.existsSync.returns( false );
				stubs.shell.returns( Promise.resolve( 'Git clone log.' ) );

				return syncCommand.execute( commandData )
					.then( response => {
						expect( response.packages ).is.an( 'array' );
						expect( response.packages ).to.deep.equal( [ 'test-bar' ] );
					} );
			} );
		} );

		describe( 'the package is already installed', () => {
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
						expect( exec.getCall( 2 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git checkout master' );
						expect( exec.getCall( 3 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git branch' );
						expect( exec.getCall( 4 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git pull origin master' );

						expect( response.logs.info ).to.deep.equal( [
							'Already on \'master\'.',
							'Already up-to-date.'
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
					logs: getCommandLogs( 'error: pathspec \'ggdfgd\' did not match any file(s) known to git.', true ),
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
		it( 'informs about number of processed packages', () => {
			const consoleLog = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			processedPackages.add( 'package-1' );
			processedPackages.add( 'package-2' );

			syncCommand.afterExecute( processedPackages );

			expect( consoleLog.calledOnce ).to.equal( true );
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
