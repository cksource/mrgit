/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = require( 'chai' ).expect;

describe( 'commands/close', () => {
	let closeCommand, stubs, commandData, toolOptions;

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

		toolOptions = {};

		commandData = {
			arguments: [],
			repository: {
				branch: 'master'
			},
			toolOptions
		};

		mockery.registerMock( './exec', stubs.execCommand );

		closeCommand = require( '../../lib/commands/close' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.deregisterAll();
		mockery.disable();
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( closeCommand.helpMessage ).is.a( 'string' );
		} );
	} );

	describe( 'beforeExecute()', () => {
		it( 'throws an error if command to execute is not specified', () => {
			expect( () => {
				closeCommand.beforeExecute( [ 'merge' ] );
			} ).to.throw( Error, 'Missing branch to merge. Use: mrgit close [branch].' );
		} );

		it( 'does nothing if branch to merge is specified', () => {
			expect( () => {
				closeCommand.beforeExecute( [ 'merge', 'develop' ] );
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

			return closeCommand.execute( commandData )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'merges specified branch and remove it from local and remote', () => {
			commandData.arguments.push( 'develop' );

			stubs.execCommand.execute.onCall( 0 ).resolves( {
				logs: {
					info: [
						'* develop'
					],
					error: []
				}
			} );

			stubs.execCommand.execute.onCall( 1 ).resolves( {
				logs: {
					info: [
						'develop'
					],
					error: []
				}
			} );

			stubs.execCommand.execute.onCall( 2 ).resolves( {
				logs: {
					info: [
						'Merge made by the \'recursive\' strategy.'
					],
					error: []
				}
			} );

			stubs.execCommand.execute.onCall( 3 ).resolves( {
				logs: {
					info: [
						'Deleted branch develop (was e6bda2e9).'
					],
					error: []
				}
			} );

			stubs.execCommand.execute.onCall( 4 ).resolves( {
				logs: {
					info: [
						'To github.com:foo/bar.git\n' +
						' - [deleted]         develop'
					],
					error: []
				}
			} );

			return closeCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.callCount ).to.equal( 5 );

					expect( stubs.execCommand.execute.getCall( 0 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --list develop' ],
						toolOptions
					} );

					expect( stubs.execCommand.execute.getCall( 1 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --show-current' ],
						toolOptions
					} );

					expect( stubs.execCommand.execute.getCall( 2 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git merge develop --no-ff -m "Merge branch \'develop\'"' ],
						toolOptions
					} );

					expect( stubs.execCommand.execute.getCall( 3 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch -d develop' ],
						toolOptions
					} );

					expect( stubs.execCommand.execute.getCall( 4 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git push origin :develop' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'Merge made by the \'recursive\' strategy.',

						'Removing "develop" branch from the local registry.',

						'Deleted branch develop (was e6bda2e9).',

						'Removing "develop" branch from the remote.',

						'To github.com:foo/bar.git\n' +
						' - [deleted]         develop'
					] );
				} );
		} );

		// mrgit close develop -- --message "Test."
		it( 'merges specified branch using specified message', () => {
			commandData.arguments.push( 'develop' );
			commandData.arguments.push( '--message' );
			commandData.arguments.push( 'Test.' );

			stubs.execCommand.execute.onCall( 0 ).resolves( {
				logs: {
					info: [
						'* develop'
					],
					error: []
				}
			} );

			stubs.execCommand.execute.onCall( 1 ).resolves( {
				logs: {
					info: [
						'develop'
					],
					error: []
				}
			} );

			stubs.execCommand.execute.onCall( 2 ).resolves( {
				logs: {
					info: [
						'Merge made by the \'recursive\' strategy.'
					],
					error: []
				}
			} );

			stubs.execCommand.execute.onCall( 3 ).resolves( {
				logs: {
					info: [
						'Deleted branch develop (was e6bda2e9).'
					],
					error: []
				}
			} );

			stubs.execCommand.execute.onCall( 4 ).resolves( {
				logs: {
					info: [
						'To github.com:foo/bar.git\n' +
						' - [deleted]         develop'
					],
					error: []
				}
			} );

			return closeCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.callCount ).to.equal( 5 );

					expect( stubs.execCommand.execute.getCall( 0 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --list develop' ],
						toolOptions
					} );

					expect( stubs.execCommand.execute.getCall( 1 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --show-current' ],
						toolOptions
					} );

					expect( stubs.execCommand.execute.getCall( 2 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git merge develop --no-ff -m "Merge branch \'develop\'" -m "Test."' ],
						toolOptions
					} );

					expect( stubs.execCommand.execute.getCall( 3 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch -d develop' ],
						toolOptions
					} );

					expect( stubs.execCommand.execute.getCall( 4 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git push origin :develop' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'Merge made by the \'recursive\' strategy.',

						'Removing "develop" branch from the local registry.',

						'Deleted branch develop (was e6bda2e9).',

						'Removing "develop" branch from the remote.',

						'To github.com:foo/bar.git\n' +
						' - [deleted]         develop'
					] );
				} );
		} );

		// mrgit close develop --message "Test."
		it( 'merges specified branch using specified message when specified as a param of mrgit', () => {
			commandData.arguments.push( 'develop' );

			toolOptions.message = 'Test.';

			stubs.execCommand.execute.onCall( 0 ).resolves( {
				logs: {
					info: [
						'* develop'
					],
					error: []
				}
			} );

			stubs.execCommand.execute.onCall( 1 ).resolves( {
				logs: {
					info: [
						'develop'
					],
					error: []
				}
			} );

			stubs.execCommand.execute.onCall( 2 ).resolves( {
				logs: {
					info: [
						'Merge made by the \'recursive\' strategy.'
					],
					error: []
				}
			} );

			stubs.execCommand.execute.onCall( 3 ).resolves( {
				logs: {
					info: [
						'Deleted branch develop (was e6bda2e9).'
					],
					error: []
				}
			} );

			stubs.execCommand.execute.onCall( 4 ).resolves( {
				logs: {
					info: [
						'To github.com:foo/bar.git\n' +
						' - [deleted]         develop'
					],
					error: []
				}
			} );

			return closeCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.callCount ).to.equal( 5 );

					expect( stubs.execCommand.execute.getCall( 0 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --list develop' ],
						toolOptions
					} );

					expect( stubs.execCommand.execute.getCall( 1 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --show-current' ],
						toolOptions
					} );

					expect( stubs.execCommand.execute.getCall( 2 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git merge develop --no-ff -m "Merge branch \'develop\'" -m "Test."' ],
						toolOptions
					} );

					expect( stubs.execCommand.execute.getCall( 3 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch -d develop' ],
						toolOptions
					} );

					expect( stubs.execCommand.execute.getCall( 4 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git push origin :develop' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'Merge made by the \'recursive\' strategy.',

						'Removing "develop" branch from the local registry.',

						'Deleted branch develop (was e6bda2e9).',

						'Removing "develop" branch from the remote.',

						'To github.com:foo/bar.git\n' +
						' - [deleted]         develop'
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
					],
					error: []
				}
			} );

			return closeCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledOnce ).to.equal( true );

					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --list develop' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'Branch does not exist.'
					] );
				} );
		} );

		it( 'does not merge branch if in detached head mode', () => {
			commandData.arguments.push( 'develop' );

			stubs.execCommand.execute.onCall( 0 ).resolves( {
				logs: {
					info: [
						'* develop'
					],
					error: []
				}
			} );

			stubs.execCommand.execute.onCall( 1 ).resolves( {
				logs: {
					info: [
						''
					],
					error: []
				}
			} );

			return closeCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.callCount ).to.equal( 2 );

					expect( stubs.execCommand.execute.getCall( 0 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --list develop' ],
						toolOptions
					} );

					expect( stubs.execCommand.execute.getCall( 1 ).args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --show-current' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).to.deep.equal( [
						'This repository is currently in detached head mode - skipping.'
					] );
				} );
		} );
	} );
} );
