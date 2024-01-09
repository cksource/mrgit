/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = require( 'chai' ).expect;

describe( 'commands/checkout', () => {
	let checkoutCommand, stubs, commandData, toolOptions;

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

		toolOptions = {};

		commandData = {
			arguments: [],
			repository: {
				branch: 'master'
			},
			toolOptions
		};

		mockery.registerMock( './exec', stubs.execCommand );
		mockery.registerMock( '../utils/gitstatusparser', stubs.gitStatusParser );

		checkoutCommand = require( '../../lib/commands/checkout' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.deregisterAll();
		mockery.disable();
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( checkoutCommand.helpMessage ).is.a( 'string' );
		} );
	} );

	describe( '#name', () => {
		it( 'returns a full name of executed command', () => {
			expect( checkoutCommand.name ).is.a( 'string' );
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

			return checkoutCommand.execute( commandData )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'checkouts to the correct branch', () => {
			stubs.execCommand.execute.resolves( {
				logs: {
					info: [
						'Already on \'master\'',
						'Already on \'master\'\nYour branch is up-to-date with \'origin/master\'.'
					]
				}
			} );

			return checkoutCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledOnce ).to.equal( true );
					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git checkout master' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'Already on \'master\'',
						'Already on \'master\'\nYour branch is up-to-date with \'origin/master\'.'
					] );
				} );
		} );

		it( 'checkouts to specified branch', () => {
			commandData.arguments.push( 'develop' );

			stubs.execCommand.execute.resolves( {
				logs: {
					info: [
						'Switched to branch \'develop\'',
						'Your branch is up to date with \'origin/develop\'.'
					]
				}
			} );

			return checkoutCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledOnce ).to.equal( true );
					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git checkout develop' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'Switched to branch \'develop\'',
						'Your branch is up to date with \'origin/develop\'.'
					] );
				} );
		} );

		it( 'creates a new branch if a repository has changes that could be committed and specified --branch option', () => {
			toolOptions.branch = 'develop';

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
						'Switched to a new branch \'develop\''
					]
				}
			} );

			stubs.gitStatusParser.returns( { anythingToCommit: true } );

			return checkoutCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledTwice ).to.equal( true );

					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git status --branch --porcelain' ],
						toolOptions
					} );

					expect( stubs.execCommand.execute.secondCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git checkout -b develop' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'Switched to a new branch \'develop\''
					] );
				} );
		} );

		it( 'does not create a branch if a repository has no-changes that could be committed when specified --branch option', () => {
			toolOptions.branch = 'develop';

			stubs.execCommand.execute.onFirstCall().resolves( {
				logs: {
					info: [
						'Response returned by "git status" command.'
					]
				}
			} );

			stubs.gitStatusParser.returns( { anythingToCommit: false } );

			return checkoutCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledOnce ).to.equal( true );

					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git status --branch --porcelain' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'Repository does not contain changes to commit. New branch was not created.'
					] );
				} );
		} );
	} );
} );
