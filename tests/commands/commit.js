/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = require( 'chai' ).expect;

describe( 'commands/commit', () => {
	let commitCommand, stubs, commandData;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			execCommand: {
				execute: sinon.stub()
			},
			gitStatusParser: sinon.stub()
		};

		commandData = {
			arguments: [],
			repository: {
				branch: 'master'
			}
		};

		mockery.registerMock( './exec', stubs.execCommand );
		mockery.registerMock( '../utils/gitstatusparser', stubs.gitStatusParser );

		commitCommand = require( '../../lib/commands/commit' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.deregisterAll();
		mockery.disable();
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( commitCommand.helpMessage ).is.a( 'string' );
		} );
	} );

	describe( '#name', () => {
		it( 'returns a full name of executed command', () => {
			expect( commitCommand.name ).is.a( 'string' );
		} );
	} );

	describe( 'beforeExecute()', () => {
		it( 'throws an error if command to execute is not specified', () => {
			expect( () => {
				commitCommand.beforeExecute( [ 'commit' ] );
			} ).to.throw( Error, 'Missing --message (-m) option. Call "mgit commit -h" in order to read more.' );
		} );

		it( 'does nothing if specified message for commit', () => {
			expect( () => {
				commitCommand.beforeExecute( [ 'commit', '--message', 'Test' ] );
			} ).to.not.throw( Error );
		} );
	} );

	describe( 'execute()', () => {
		it( 'rejects promise if called command returned an error', () => {
			const error = new Error( 'Unexpected error.' );

			stubs.execCommand.execute.rejects( {
				logs: {
					error: [ error.stack ]
				}
			} );

			return commitCommand.execute( commandData )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'commits all changes', () => {
			commandData.arguments.push( '--message' );
			commandData.arguments.push( 'Test.' );

			stubs.execCommand.execute.onFirstCall().resolves( {
				logs: {
					info: [
						'Response returned by "git status" command.'
					]
				}
			} );

			stubs.execCommand.execute.onSecondCall().resolves( {
				logs: {
					info: [
						'[master a89f9ee] Test.'
					]
				}
			} );

			stubs.gitStatusParser.returns( { anythingToCommit: true } );

			return commitCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledTwice ).to.equal( true );

					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git status --branch --porcelain' ]
					} );

					expect( stubs.execCommand.execute.secondCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git commit -a -m "Test."' ]
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'[master a89f9ee] Test.'
					] );
				} );
		} );

		it( 'accepts `--no-verify` option', () => {
			commandData.arguments.push( '-n' );
			commandData.arguments.push( '--message' );
			commandData.arguments.push( 'Test' );

			stubs.execCommand.execute.onFirstCall().resolves( {
				logs: {
					info: [
						'Response returned by "git status" command.'
					]
				}
			} );

			stubs.execCommand.execute.onSecondCall().resolves( {
				logs: {
					info: [
						'[master a89f9ee] Test'
					]
				}
			} );

			stubs.gitStatusParser.returns( { anythingToCommit: true } );

			return commitCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledTwice ).to.equal( true );

					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git status --branch --porcelain' ]
					} );

					expect( stubs.execCommand.execute.secondCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git commit -a -m "Test" -n' ]
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'[master a89f9ee] Test'
					] );
				} );
		} );

		it( 'accepts duplicated `--message` option', () => {
			commandData.arguments.push( '--message' );
			commandData.arguments.push( 'Test.' );
			commandData.arguments.push( '-m' );
			commandData.arguments.push( 'Foo.' );

			stubs.execCommand.execute.onFirstCall().resolves( {
				logs: {
					info: [
						'Response returned by "git status" command.'
					]
				}
			} );

			stubs.execCommand.execute.onSecondCall().resolves( {
				logs: {
					info: [
						'[master a89f9ee] Test.'
					]
				}
			} );

			stubs.gitStatusParser.returns( { anythingToCommit: true } );

			return commitCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledTwice ).to.equal( true );

					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git status --branch --porcelain' ]
					} );

					expect( stubs.execCommand.execute.secondCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git commit -a -m "Test." -m "Foo."' ]
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'[master a89f9ee] Test.'
					] );
				} );
		} );

		it( 'does not commit if there is no changes', () => {
			commandData.arguments.push( '--message' );
			commandData.arguments.push( 'Test.' );

			stubs.execCommand.execute.onFirstCall().resolves( {
				logs: {
					info: [
						'Response returned by "git status" command.'
					]
				}
			} );

			stubs.gitStatusParser.returns( { anythingToCommit: false } );

			return commitCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledOnce ).to.equal( true );

					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git status --branch --porcelain' ]
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'Nothing to commit.'
					] );
				} );
		} );
	} );
} );
