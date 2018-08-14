/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = require( 'chai' ).expect;

describe( 'commands/merge', () => {
	let mergeCommand, stubs, commandData;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			execCommand: {
				execute: sinon.stub()
			}
		};

		commandData = {
			arguments: [],
			repository: {
				branch: 'master'
			}
		};

		mockery.registerMock( './exec', stubs.execCommand );

		mergeCommand = require( '../../lib/commands/merge' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.deregisterAll();
		mockery.disable();
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( mergeCommand.helpMessage ).is.a( 'string' );
		} );
	} );

	describe( 'beforeExecute()', () => {
		it( 'throws an error if command to execute is not specified', () => {
			expect( () => {
				mergeCommand.beforeExecute( [ 'merge' ] );
			} ).to.throw( Error, 'Missing branch to merge. Use: mgit merge [branch].' );
		} );

		it( 'does nothing if branch to merge is specified', () => {
			expect( () => {
				mergeCommand.beforeExecute( [ 'merge', 'develop' ] );
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

			return mergeCommand.execute( commandData )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'merges specified branch', () => {
			commandData.arguments.push( 'develop' );

			stubs.execCommand.execute.onFirstCall().resolves( {
				logs: {
					info: [
						'* develop'
					]
				}
			} );

			stubs.execCommand.execute.onSecondCall().resolves( {
				logs: {
					info: [
						'Merge made by the \'recursive\' strategy.'
					]
				}
			} );

			return mergeCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledTwice ).to.equal( true );

					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --list develop' ]
					} );

					expect( stubs.execCommand.execute.secondCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git merge develop --no-ff -m "Merge branch \'develop\'"' ]
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'Merge made by the \'recursive\' strategy.'
					] );
				} );
		} );

		it( 'merges specified branch using specified message', () => {
			commandData.arguments.push( 'develop' );
			commandData.arguments.push( '--message' );
			commandData.arguments.push( 'Test.' );

			stubs.execCommand.execute.onFirstCall().resolves( {
				logs: {
					info: [
						'* develop'
					]
				}
			} );

			stubs.execCommand.execute.onSecondCall().resolves( {
				logs: {
					info: [
						'Merge made by the \'recursive\' strategy.'
					]
				}
			} );

			return mergeCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledTwice ).to.equal( true );

					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --list develop' ]
					} );

					expect( stubs.execCommand.execute.secondCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git merge develop --no-ff -m "Merge branch \'develop\'" -m "Test."' ]
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'Merge made by the \'recursive\' strategy.'
					] );
				} );
		} );

		it( 'does not merge branch if it does not exist', () => {
			commandData.arguments.push( 'develop' );
			commandData.arguments.push( '--message' );
			commandData.arguments.push( 'Test.' );

			stubs.execCommand.execute.onFirstCall().resolves( {
				logs: {
					info: [
						''
					]
				}
			} );

			return mergeCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledOnce ).to.equal( true );

					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --list develop' ]
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'Branch does not exist.'
					] );
				} );
		} );
	} );
} );
