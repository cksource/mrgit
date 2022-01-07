/**
 * @license Copyright (c) 2003-2022, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = require( 'chai' ).expect;

describe( 'commands/status', () => {
	let statusCommand, stubs, commandData;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			gitStatusParser: sinon.stub(),
			execCommand: {
				execute: sinon.stub()
			},
			table: {
				constructor: sinon.stub(),
				push: sinon.stub(),
				toString: sinon.stub()
			},
			chalk: {
				cyan: sinon.stub(),
				bold: sinon.stub(),
				yellow: sinon.stub(),
				green: sinon.stub(),
				red: sinon.stub(),
				blue: sinon.stub(),
				magenta: sinon.stub()
			}
		};

		commandData = {
			toolOptions: {
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
			cyan: stubs.chalk.cyan.callsFake( msg => msg ),
			bold: stubs.chalk.bold.callsFake( msg => msg ),
			yellow: stubs.chalk.yellow.callsFake( msg => msg ),
			green: stubs.chalk.green.callsFake( msg => msg ),
			red: stubs.chalk.red.callsFake( msg => msg ),
			blue: stubs.chalk.blue.callsFake( msg => msg ),
			magenta: stubs.chalk.magenta.callsFake( msg => msg ),
			underline: stubs.chalk.magenta.callsFake( msg => msg )
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
		sinon.restore();
		mockery.deregisterAll();
		mockery.disable();
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( statusCommand.helpMessage ).is.a( 'string' );
		} );
	} );

	describe( '#name', () => {
		it( 'returns a full name of executed command', () => {
			expect( statusCommand.name ).is.a( 'string' );
		} );
	} );

	describe( 'beforeExecute()', () => {
		it( 'should describe why logs are not display in "real-time"', () => {
			const logStub = sinon.stub( console, 'log' );

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

			return statusCommand.execute( commandData )
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

			return statusCommand.execute( commandData )
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
						mrgitBranch: 'master'
					} );
				} );

			function getCommandArguments( command ) {
				return Object.assign( {}, commandData, {
					arguments: [ command ]
				} );
			}
		} );

		it( 'modifies the package name if "packagesPrefix" is an array', () => {
			commandData.toolOptions.packagesPrefix = [
				'@ckeditor/ckeditor-',
				'@ckeditor/ckeditor5-'
			];

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

			return statusCommand.execute( commandData )
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
						mrgitBranch: 'master'
					} );
				} );

			function getCommandArguments( command ) {
				return Object.assign( {}, commandData, {
					arguments: [ command ]
				} );
			}
		} );

		it( 'does not modify the package name if "packagesPrefix" option is not specified', () => {
			// mrgit resolves this option to be an empty array if it isn't specified.
			commandData.toolOptions.packagesPrefix = [];

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

			return statusCommand.execute( commandData )
				.then( statusResponse => {
					expect( statusResponse.response ).to.deep.equal( {
						packageName: '@ckeditor/ckeditor5-test-package',
						commit: '6bfd379',
						status: { response: 'Parsed response.' },
						mrgitBranch: 'master'
					} );
				} );
		} );
	} );

	describe( 'afterExecute()', () => {
		it( 'do not display anything if processed packages list is empty', () => {
			const logStub = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			commandResponses.add( { response: true } );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( logStub.called ).to.equal( false );
			logStub.restore();
		} );

		it( 'do not display anything if command responses list is empty', () => {
			const logStub = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'foo-package' );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( logStub.called ).to.equal( false );
			logStub.restore();
		} );

		it( 'draws the table with statuses of the repositories', () => {
			const logStub = sinon.stub( console, 'log' );

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
					unmerged: []
				},
				mrgitBranch: 'master',
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
					unmerged: []
				},
				mrgitBranch: 't/1',
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
				[ 'bar', 't/1 ↑3', 'ef45678', '+1 ?1' ]
			);
			expect( stubs.table.push.secondCall.args[ 0 ] ).to.deep.equal(
				[ 'foo', 'master ↓2', 'abcd123', 'M1' ]
			);

			expect( stubs.table.toString.calledOnce ).to.equal( true );

			expect( logStub.calledTwice ).to.equal( true );
			expect( logStub.firstCall.args[ 0 ] ).to.equal( '┻━┻' );
			expect( logStub.secondCall.args[ 0 ] ).to.match( /^Legend:/ );
			expect( stubs.chalk.cyan.calledOnce ).to.equal( true );

			logStub.restore();
		} );

		it( 'highlights a row if current branch is other than master', () => {
			const logStub = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-foo' );

			commandResponses.add( {
				packageName: 'foo',
				status: {
					branch: 't/ckeditor5-bar/1',
					ahead: 0,
					behind: 0,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: []
				},
				mrgitBranch: 'master',
				commit: 'abcd123'
			} );

			statusCommand.afterExecute( processedPackages, commandResponses );
			expect( stubs.chalk.magenta.called ).to.equal( true );

			logStub.restore();
		} );

		it( 'does not highlight a row if current branch is equal to master', () => {
			const logStub = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-foo' );

			commandResponses.add( {
				packageName: 'foo',
				status: {
					branch: 'master',
					ahead: 0,
					behind: 0,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: []
				},
				mrgitBranch: 'master',
				commit: 'abcd123'
			} );

			statusCommand.afterExecute( processedPackages, commandResponses );
			expect( stubs.chalk.magenta.called ).to.equal( false );

			logStub.restore();
		} );

		it( 'adds "!" before the branch name if current branch is other than defined in "mrgit.json"', () => {
			const logStub = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-bar' );

			commandResponses.add( {
				packageName: 'bar',
				status: {
					branch: 't/1',
					ahead: 0,
					behind: 0,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: []
				},
				mrgitBranch: 'master',
				commit: 'ef45678'
			} );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( stubs.table.push.firstCall.args[ 0 ] ).to.deep.equal(
				[ 'bar', '! t/1', 'ef45678', '' ]
			);

			// First - in the table, second - in the legend.
			expect( stubs.chalk.cyan.calledTwice ).to.equal( true );

			logStub.restore();
		} );

		it( 'sorts packages by alphabetically', () => {
			const logStub = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-foo' );
			processedPackages.add( '@ckeditor/ckeditor5-bar' );
			processedPackages.add( '@ckeditor/ckeditor5-bom' );
			processedPackages.add( '@ckeditor/ckeditor5-aaa' );

			commandResponses.add( getCommandResponse( 'foo', '1111111' ) );
			commandResponses.add( getCommandResponse( 'bar', '2222222' ) );
			commandResponses.add( getCommandResponse( 'bom', '3333333' ) );
			commandResponses.add( getCommandResponse( 'aaa', '4444444' ) );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( stubs.table.push.getCall( 0 ).args[ 0 ][ 0 ], 1 ).to.equal( 'aaa' );
			expect( stubs.table.push.getCall( 1 ).args[ 0 ][ 0 ], 2 ).to.equal( 'bar' );
			expect( stubs.table.push.getCall( 2 ).args[ 0 ][ 0 ], 3 ).to.equal( 'bom' );
			expect( stubs.table.push.getCall( 3 ).args[ 0 ][ 0 ], 4 ).to.equal( 'foo' );

			logStub.restore();

			function getCommandResponse( packageName, commit ) {
				return {
					packageName,
					status: {
						branch: 'master',
						ahead: 0,
						behind: 0,
						staged: [],
						modified: [],
						untracked: [],
						unmerged: []
					},
					mrgitBranch: 'master',
					commit
				};
			}
		} );

		it( 'counts unmerged files as modified', () => {
			const logStub = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-foo' );

			commandResponses.add( {
				packageName: 'foo',
				status: {
					branch: 'master',
					ahead: 0,
					behind: 2,
					staged: [],
					modified: [ 'README.md' ],
					untracked: [],
					unmerged: [ '.travis.yml' ]
				},
				mrgitBranch: 'master',
				commit: 'abcd123'
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
				[ 'foo', 'master ↓2', 'abcd123', 'M2' ]
			);

			expect( stubs.table.toString.calledOnce ).to.equal( true );

			expect( logStub.calledTwice ).to.equal( true );
			expect( logStub.firstCall.args[ 0 ] ).to.equal( '┻━┻' );
			expect( logStub.secondCall.args[ 0 ] ).to.match( /^Legend:/ );
			expect( stubs.chalk.cyan.calledOnce ).to.equal( true );

			logStub.restore();
		} );

		it( 'counts unmerged files as modified even if number of modified files is equal 0', () => {
			const logStub = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-foo' );

			commandResponses.add( {
				packageName: 'foo',
				status: {
					branch: 'master',
					ahead: 0,
					behind: 2,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: [ '.travis.yml' ]
				},
				mrgitBranch: 'master',
				commit: 'abcd123'
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

			expect( stubs.table.toString.calledOnce ).to.equal( true );

			expect( logStub.calledTwice ).to.equal( true );
			expect( logStub.firstCall.args[ 0 ] ).to.equal( '┻━┻' );
			expect( logStub.secondCall.args[ 0 ] ).to.match( /^Legend:/ );
			expect( stubs.chalk.cyan.calledOnce ).to.equal( true );

			logStub.restore();
		} );
	} );
} );
