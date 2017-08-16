/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = require( 'chai' ).expect;

describe( 'commands/status', () => {
	let statusCommand, sandbox, stubs, data;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			gitStatusParser: sandbox.stub(),
			execCommand: {
				execute: sandbox.stub()
			},
			table: {
				constructor: sandbox.stub(),
				push: sandbox.stub(),
				toString: sandbox.stub()
			}
		};

		data = {
			options: {
				packagesPrefix: '@ckeditor/ckeditor5-'
			},
			repository: {
				branch: 'master'
			},
			packageName: '@ckeditor/ckeditor5-test-package',
			arguments: []
		};

		// Do not modify the color.
		mockery.registerMock( 'chalk', {
			cyan: text => text,
			bold: text => text,
			yellow: text => text,
			green: text => text,
			red: text => text,
			blue: text => text,
			magenta: text => text
		} );
		mockery.registerMock( 'cli-table', class Table {
			constructor( ...args ) {
				stubs.table.constructor( ...args );
			}

			push( ...args ) {
				return stubs.table.push( ...args );
			}

			toString( ...args ) {
				return stubs.table.toString( ...args );
			}
		} );
		mockery.registerMock( './exec', stubs.execCommand );
		mockery.registerMock( '../utils/gitstatusparser', stubs.gitStatusParser );

		statusCommand = require( '../../lib/commands/status' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	describe( 'beforeExecute()', () => {
		it( 'should describe why logs are not display in "real-time"', () => {
			const logStub = sandbox.stub( console, 'log' );

			statusCommand.beforeExecute();

			expect( logStub.calledOnce ).to.equal( true );
			logStub.restore();
		} );
	} );

	describe( 'execute()', () => {
		it( 'rejects promise if any called command returned an error', () => {
			const error = new Error( 'Unexpected error.' );

			stubs.execCommand.execute.onSecondCall().resolves( {} );
			stubs.execCommand.execute.onFirstCall().rejects( {
				logs: {
					error: [ error.stack ]
				}
			} );

			return statusCommand.execute( data )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'returns a response with status of the repository', () => {
			stubs.execCommand.execute.onFirstCall().resolves( {
				logs: {
					info: [ '6bfd379a56a32c9f8b6e58bf08e39c124cdbae10' ]
				}
			} );
			stubs.execCommand.execute.onSecondCall().resolves( {
				logs: {
					info: [ 'Response returned by "git status" command.' ]
				}
			} );

			stubs.gitStatusParser.returns( { response: 'Parsed response.' } );

			return statusCommand.execute( data )
				.then( statusResponse => {
					expect( stubs.execCommand.execute.calledTwice ).to.equal( true );
					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal(
						getCommandArguments( 'git rev-parse HEAD' )
					);
					expect( stubs.execCommand.execute.secondCall.args[ 0 ] ).to.deep.equal(
						getCommandArguments( 'git status --branch --porcelain' )
					);

					expect( stubs.gitStatusParser.calledOnce ).to.equal( true );
					expect( stubs.gitStatusParser.firstCall.args[ 0 ] ).to.equal( 'Response returned by "git status" command.' );

					expect( statusResponse.response ).to.deep.equal( {
						packageName: 'test-package',
						commit: '6bfd379',
						status: { response: 'Parsed response.' },
						mgitBranch: 'master'
					} );
				} );

			function getCommandArguments( command ) {
				return Object.assign( {}, data, {
					arguments: [ command ]
				} );
			}
		} );

		it( 'does not modify the package name if "packagesPrefix" option is not specified', () => {
			delete data.options.packagesPrefix;

			stubs.execCommand.execute.onFirstCall().resolves( {
				logs: {
					info: [ '6bfd379a56a32c9f8b6e58bf08e39c124cdbae10' ]
				}
			} );
			stubs.execCommand.execute.onSecondCall().resolves( {
				logs: {
					info: [ 'Response returned by "git status" command.' ]
				}
			} );

			stubs.gitStatusParser.returns( { response: 'Parsed response.' } );

			return statusCommand.execute( data )
				.then( statusResponse => {
					expect( statusResponse.response ).to.deep.equal( {
						packageName: '@ckeditor/ckeditor5-test-package',
						commit: '6bfd379',
						status: { response: 'Parsed response.' },
						mgitBranch: 'master'
					} );
				} );
		} );
	} );

	describe( 'afterExecute()', () => {
		it( 'do not display any thing if processed packages list is empty', () => {
			const logStub = sandbox.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			commandResponses.add( { response: true } );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( logStub.called ).to.equal( false );
			logStub.restore();
		} );

		it( 'do not display any thing if command responses list is empty', () => {
			const logStub = sandbox.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'foo-package' );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( logStub.called ).to.equal( false );
			logStub.restore();
		} );

		it( 'draws the table with statuses of the repositories', () => {
			const logStub = sandbox.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-foo' );
			processedPackages.add( '@ckeditor/ckeditor5-bar' );

			commandResponses.add( {
				packageName: 'foo',
				status: {
					branch: 'master',
					ahead: 0,
					behind: 2,
					staged: [],
					modified: [ 'README.md' ],
					untracked: [],
				},
				mgitBranch: 'master',
				commit: 'abcd123'
			} );

			commandResponses.add( {
				packageName: 'bar',
				status: {
					branch: 't/1',
					ahead: 3,
					behind: 0,
					staged: [ 'gulpfile.js' ],
					modified: [],
					untracked: [ 'CHANGELOG.md' ],
				},
				mgitBranch: 'master',
				commit: 'ef45678'
			} );

			stubs.table.toString.returns( '┻━┻' );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( stubs.table.constructor.firstCall.args[ 0 ] ).to.deep.equal( {
				head: [ 'Package', 'Branch', 'Commit', 'Status' ],
				style: {
					compact: true
				}
			} );
			expect( stubs.table.push.firstCall.args[ 0 ] ).to.deep.equal(
				[ 'foo', 'master ↓2', 'abcd123', 'M1' ]
			);
			expect( stubs.table.push.secondCall.args[ 0 ] ).to.deep.equal(
				[ 'bar', 't/1 ↑3', 'ef45678', '+1 ?1' ]
			);

			expect( stubs.table.toString.calledOnce ).to.equal( true );

			expect( logStub.calledTwice ).to.equal( true );
			expect( logStub.firstCall.args[ 0 ] ).to.equal( '┻━┻' );
			expect( logStub.secondCall.args[ 0 ] ).to.equal(
				'Legend:\n' +
				'↑ branch is ahead ↓ or behind, + staged files, M modified files, ? untracked files.'
			);

			logStub.restore();
		} );
	} );
} );
