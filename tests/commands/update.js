/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
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
				join: sandbox.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) )
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
			data.options.recursive = true;
			stubs.fs.existsSync.returns( false );

			stubs.bootstrapCommand.execute = sinon.spy( ( commandData, logger ) => {
				logger.info( 'Cloned.' );

				return Promise.resolve( { packages: [] } );
			} );

			return updateCommand.execute( data )
				.then( ( response ) => {
					expect( response.logs.info ).to.deep.equal( [
						'Package "test-package" was not found. Cloning...',
						'Cloned.'
					] );

					expect( response.packages ).to.be.an( 'array' );
					expect( response.packages.length ).to.equal( 0 );

					expect( stubs.bootstrapCommand.execute.calledOnce ).to.equal( true );
				} );
		} );

		it( 'resolves promise after pulling the changes', () => {
			stubs.fs.existsSync.returns( true );

			let callCounter = 0;

			stubs.execCommand.execute = sinon.spy( ( commandData, logger ) => {
				switch ( callCounter++ ) {

					case 0:
						return Promise.resolve( {
							logs: getCommandLogs( '' )
						} );

					case 1:
						logger.info( '' );
						break;

					case 2:
						logger.info( 'Already on \'master\'.' );
						break;

					case 3:
						return Promise.resolve( {
							logs: getCommandLogs( '* master\n  remotes/origin/master' )
						} );

					case 4:
						logger.info( 'Already up-to-date.' );
						break;
				}

				return Promise.resolve();
			} );

			return updateCommand.execute( data )
				.then( ( response ) => {
					const exec = stubs.execCommand.execute;

					expect( exec.callCount ).to.equal( 5 );
					expect( exec.getCall( 0 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git status -s' );
					expect( exec.getCall( 1 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git fetch' );
					expect( exec.getCall( 2 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git checkout master' );
					expect( exec.getCall( 3 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git branch' );
					expect( exec.getCall( 4 ).args[ 0 ].arguments[ 0 ] ).to.equal( 'git pull origin master' );

					expect( response.logs.info ).to.deep.equal( [
						'Already on \'master\'.',
						'Already up-to-date.'
					] );
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
					( response ) => {
						const errMsg = 'Package "test-package" has uncommitted changes. Aborted.';

						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( errMsg );
						expect( exec.firstCall.args[ 0 ].arguments[ 0 ] ).to.equal( 'git status -s' );
					}
				);
		} );

		it( 'does not pull the changes if detached on a commit or a tag', () => {
			stubs.fs.existsSync.returns( true );

			data.repository.branch = '1a0ff0a2ee60549656177cd2a18b057764ec2146';

			let callCounter = 0;

			stubs.execCommand.execute = sinon.spy( ( commandData, logger ) => {
				switch ( callCounter++ ) {

					case 0:
						return Promise.resolve( {
							logs: getCommandLogs( '' )
						} );

					case 1:
						logger.info( '' );
						break;

					case 2:
						logger.info( 'Note: checking out \'1a0ff0a2ee60549656177cd2a18b057764ec2146\'.' );
						break;

					case 3:
						return Promise.resolve( {
							logs: getCommandLogs( [
								'* (HEAD detached at 1a0ff0a2ee60549656177cd2a18b057764ec2146)',
								'  master',
								'  remotes/origin/master'
							].join( '\n' ) )
						} );
				}

				return Promise.resolve();
			} );

			return updateCommand.execute( data )
				.then( ( response ) => {
					expect( response.logs.info ).to.deep.equal( [
						'Note: checking out \'1a0ff0a2ee60549656177cd2a18b057764ec2146\'.',
						'Package "test-package" is on a detached commit or tag.'
					] );

					expect( stubs.execCommand.execute.callCount ).to.equal( 4 );
				} );
		} );

		it( 'aborts if user wants to pull changes from non-existing branch', () => {
			stubs.fs.existsSync.returns( true );

			data.repository.branch = 'develop';

			let callCounter = 0;

			stubs.execCommand.execute = sinon.spy( ( commandData, logger ) => {
				switch ( callCounter++ ) {

					case 0:
						return Promise.resolve( {
							logs: getCommandLogs( '' )
						} );

					case 1:
						logger.info( '' );
						break;

					case 2:
						logger.info( 'Already on \'develop\'.' );
						break;

					case 3:
						return Promise.resolve( {
							logs: getCommandLogs( '* develop' )
						} );

					case 4:
						logger.error( 'fatal: Couldn\'t find remote ref develop' );

						return Promise.reject();
				}

				return Promise.resolve();
			} );

			return updateCommand.execute( data )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					( response ) => {
						expect( response.logs.info ).to.deep.equal( [
							'Already on \'develop\'.'
						] );

						const errMsg = 'fatal: Couldn\'t find remote ref develop';
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( errMsg );

						expect( stubs.execCommand.execute.callCount ).to.equal( 5 );
					}
				);
		} );

		it( 'aborts if user wants to check out to non-existing branch', () => {
			stubs.fs.existsSync.returns( true );

			data.repository.branch = 'non-existing-branch';

			let callCounter = 0;

			stubs.execCommand.execute = sinon.spy( ( commandData, logger ) => {
				switch ( callCounter++ ) {

					case 0:
						return Promise.resolve( {
							logs: getCommandLogs( '' )
						} );

					case 1:
						logger.info( '' );
						break;

					case 2:
						logger.error( 'error: pathspec \'ggdfgd\' did not match any file(s) known to git.' );

						return Promise.reject();

					case 3:
						return Promise.resolve( {
							logs: getCommandLogs( '* master\n  remotes/origin/master' )
						} );

					case 4:
						logger.info( 'Already up-to-date.' );
						break;
				}

				return Promise.resolve();
			} );

			return updateCommand.execute( data )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					( response ) => {
						const errMsg = 'error: pathspec \'ggdfgd\' did not match any file(s) known to git.';
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( errMsg );

						expect( stubs.execCommand.execute.callCount ).to.equal( 3 );
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
