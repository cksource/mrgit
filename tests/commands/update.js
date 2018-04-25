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

describe( 'commands/update', () => {
	let updateCommand, sandbox, stubs, data;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			exec: sandbox.stub(),
			fs: {
				existsSync: sandbox.stub( fs, 'existsSync' )
			},
			path: {
				join: sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) )
			},
			bootstrapCommand: {
				execute: sandbox.stub()
			},
			execCommand: {
				execute: sandbox.stub()
			}
		};

		data = {
			packageName: 'test-package',
			options: {
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
		mockery.registerMock( './bootstrap', stubs.bootstrapCommand );

		updateCommand = require( '../../lib/commands/update' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	describe( 'execute()', () => {
		it( 'clones a package if is not available', () => {
			stubs.fs.existsSync.returns( false );
			stubs.bootstrapCommand.execute.returns( Promise.resolve( {
				logs: getCommandLogs( 'Cloned.' )
			} ) );

			return updateCommand.execute( data )
				.then( response => {
					expect( response.logs.info ).to.deep.equal( [
						'Package "test-package" was not found. Cloning...',
						'Cloned.'
					] );

					expect( stubs.bootstrapCommand.execute.calledOnce ).to.equal( true );
				} );
		} );

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

			return updateCommand.execute( data )
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

			return updateCommand.execute( data )
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

			data.repository.branch = '1a0ff0a2ee60549656177cd2a18b057764ec2146';

			const exec = stubs.execCommand.execute;

			exec.onCall( 0 ).returns( Promise.resolve( {
				logs: getCommandLogs( '' )
			} ) );

			exec.onCall( 1 ).returns( Promise.resolve( {
				logs: getCommandLogs( '' )
			} ) );

			exec.onCall( 2 ).returns( Promise.resolve( {
				logs: getCommandLogs( 'Note: checking out \'1a0ff0a2ee60549656177cd2a18b057764ec2146\'.' )
			} ) );

			exec.onCall( 3 ).returns( Promise.resolve( {
				logs: getCommandLogs( [
					'* (HEAD detached at 1a0ff0a2ee60549656177cd2a18b057764ec2146)',
					'  master',
					'  remotes/origin/master'
				].join( '\n' ) )
			} ) );

			return updateCommand.execute( data )
				.then( response => {
					expect( response.logs.info ).to.deep.equal( [
						'Note: checking out \'1a0ff0a2ee60549656177cd2a18b057764ec2146\'.',
						'Package "test-package" is on a detached commit.'
					] );

					expect( exec.callCount ).to.equal( 4 );
				} );
		} );

		it( 'aborts if user wants to pull changes from non-existing branch', () => {
			stubs.fs.existsSync.returns( true );

			data.repository.branch = 'develop';

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

			return updateCommand.execute( data )
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

			data.repository.branch = 'non-existing-branch';

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

			return updateCommand.execute( data )
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

	describe( 'afterExecute()', () => {
		it( 'informs about number of processed packages', () => {
			const consoleLog = sandbox.stub( console, 'log' );

			const processedPackages = new Set();
			processedPackages.add( 'package-1' );
			processedPackages.add( 'package-2' );

			updateCommand.afterExecute( processedPackages );

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
