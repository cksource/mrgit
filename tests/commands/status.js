/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

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
			isRootRepository: false,
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

			expect( logStub.calledOnce ).toEqual( true );
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
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).toEqual( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'returns a response with status of the repository', () => {
			stubs.execCommand.execute.onCall( 0 ).resolves( {
				logs: { info: [ '6bfd379a56a32c9f8b6e58bf08e39c124cdbae10' ] }
			} );
			stubs.execCommand.execute.onCall( 1 ).resolves( {
				logs: { info: [ 'Response returned by "git status" command.' ] }
			} );
			stubs.execCommand.execute.onCall( 2 ).resolves( {
				logs: { info: [ '\nv35.3.2\nv35.3.1\nv35.3.0\nv35.2.1\nv35.2.0' ] }
			} );
			stubs.execCommand.execute.onCall( 3 ).resolves( {
				logs: { info: [ 'Response returned by "git describe" command.' ] }
			} );

			stubs.gitStatusParser.returns( { response: 'Parsed response.' } );

			return statusCommand.execute( commandData )
				.then( statusResponse => {
					expect( stubs.execCommand.execute.callCount ).toEqual( 4 );
					expect( stubs.execCommand.execute.getCall( 0 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git rev-parse HEAD' )
					);
					expect( stubs.execCommand.execute.getCall( 1 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git status --branch --porcelain' )
					);
					expect( stubs.execCommand.execute.getCall( 2 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git log --tags --simplify-by-decoration --pretty="%S"' )
					);
					expect( stubs.execCommand.execute.getCall( 3 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git describe --abbrev=0 --tags --always' )
					);

					expect( stubs.gitStatusParser.calledOnce ).toEqual( true );
					expect( stubs.gitStatusParser.firstCall.args[ 0 ] ).toEqual( 'Response returned by "git status" command.' );
					expect( stubs.gitStatusParser.firstCall.args[ 1 ] ).toEqual( 'Response returned by "git describe" command.' );

					expect( statusResponse.response ).toEqual( {
						packageName: 'test-package',
						status: { response: 'Parsed response.' },
						isRootRepository: false,
						commit: '6bfd379',
						mrgitBranch: 'master',
						mrgitTag: undefined,
						latestTag: 'v35.3.2'
					} );
				} );
		} );

		it( 'works properly for repositories without tags', () => {
			stubs.execCommand.execute.onCall( 0 ).resolves( {
				logs: { info: [ '6bfd379a56a32c9f8b6e58bf08e39c124cdbae10' ] }
			} );
			stubs.execCommand.execute.onCall( 1 ).resolves( {
				logs: { info: [ 'Response returned by "git status" command.' ] }
			} );
			stubs.execCommand.execute.onCall( 2 ).resolves( {
				logs: { info: [] }
			} );

			stubs.gitStatusParser.returns( { response: 'Parsed response.' } );

			return statusCommand.execute( commandData )
				.then( statusResponse => {
					expect( stubs.execCommand.execute.callCount ).toEqual( 3 );
					expect( stubs.execCommand.execute.getCall( 0 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git rev-parse HEAD' )
					);
					expect( stubs.execCommand.execute.getCall( 1 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git status --branch --porcelain' )
					);
					expect( stubs.execCommand.execute.getCall( 2 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git log --tags --simplify-by-decoration --pretty="%S"' )
					);

					expect( stubs.gitStatusParser.calledOnce ).toEqual( true );
					expect( stubs.gitStatusParser.firstCall.args[ 0 ] ).toEqual( 'Response returned by "git status" command.' );
					expect( stubs.gitStatusParser.firstCall.args[ 1 ] ).toEqual( null );

					expect( statusResponse.response ).toEqual( {
						packageName: 'test-package',
						status: { response: 'Parsed response.' },
						isRootRepository: false,
						commit: '6bfd379',
						mrgitBranch: 'master',
						mrgitTag: undefined,
						latestTag: null
					} );
				} );
		} );

		it( 'modifies the package name if "packagesPrefix" is an array', () => {
			commandData.toolOptions.packagesPrefix = [
				'@ckeditor/ckeditor-',
				'@ckeditor/ckeditor5-'
			];

			stubs.execCommand.execute.onCall( 0 ).resolves( {
				logs: { info: [ '6bfd379a56a32c9f8b6e58bf08e39c124cdbae10' ] }
			} );
			stubs.execCommand.execute.onCall( 1 ).resolves( {
				logs: { info: [ 'Response returned by "git status" command.' ] }
			} );
			stubs.execCommand.execute.onCall( 2 ).resolves( {
				logs: { info: [ 'v35.3.2\nv35.3.1\nv35.3.0\nv35.2.1\nv35.2.0\n' ] }
			} );
			stubs.execCommand.execute.onCall( 3 ).resolves( {
				logs: { info: [ 'Response returned by "git describe" command.' ] }
			} );

			stubs.gitStatusParser.returns( { response: 'Parsed response.' } );

			return statusCommand.execute( commandData )
				.then( statusResponse => {
					expect( stubs.execCommand.execute.callCount ).toEqual( 4 );
					expect( stubs.execCommand.execute.getCall( 0 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git rev-parse HEAD' )
					);
					expect( stubs.execCommand.execute.getCall( 1 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git status --branch --porcelain' )
					);
					expect( stubs.execCommand.execute.getCall( 2 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git log --tags --simplify-by-decoration --pretty="%S"' )
					);
					expect( stubs.execCommand.execute.getCall( 3 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git describe --abbrev=0 --tags --always' )
					);

					expect( stubs.gitStatusParser.calledOnce ).toEqual( true );
					expect( stubs.gitStatusParser.firstCall.args[ 0 ] ).toEqual( 'Response returned by "git status" command.' );
					expect( stubs.gitStatusParser.firstCall.args[ 1 ] ).toEqual( 'Response returned by "git describe" command.' );

					expect( statusResponse.response ).toEqual( {
						packageName: 'test-package',
						status: { response: 'Parsed response.' },
						isRootRepository: false,
						commit: '6bfd379',
						mrgitBranch: 'master',
						mrgitTag: undefined,
						latestTag: 'v35.3.2'
					} );
				} );
		} );

		it( 'does not modify the package name if "packagesPrefix" option is not specified', () => {
			// mrgit resolves this option to be an empty array if it isn't specified.
			commandData.toolOptions.packagesPrefix = [];

			stubs.execCommand.execute.onCall( 0 ).resolves( {
				logs: { info: [ '6bfd379a56a32c9f8b6e58bf08e39c124cdbae10' ] }
			} );
			stubs.execCommand.execute.onCall( 1 ).resolves( {
				logs: { info: [ 'Response returned by "git status" command.' ] }
			} );
			stubs.execCommand.execute.onCall( 2 ).resolves( {
				logs: { info: [ '\nv35.3.2\nv35.3.1\nv35.3.0\nv35.2.1\nv35.2.0' ] }
			} );
			stubs.execCommand.execute.onCall( 3 ).resolves( {
				logs: { info: [ 'Response returned by "git describe" command.' ] }
			} );

			stubs.gitStatusParser.returns( { response: 'Parsed response.' } );

			return statusCommand.execute( commandData )
				.then( statusResponse => {
					expect( stubs.execCommand.execute.callCount ).toEqual( 4 );
					expect( stubs.execCommand.execute.getCall( 0 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git rev-parse HEAD' )
					);
					expect( stubs.execCommand.execute.getCall( 1 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git status --branch --porcelain' )
					);
					expect( stubs.execCommand.execute.getCall( 2 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git log --tags --simplify-by-decoration --pretty="%S"' )
					);
					expect( stubs.execCommand.execute.getCall( 3 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git describe --abbrev=0 --tags --always' )
					);

					expect( stubs.gitStatusParser.calledOnce ).toEqual( true );
					expect( stubs.gitStatusParser.firstCall.args[ 0 ] ).toEqual( 'Response returned by "git status" command.' );
					expect( stubs.gitStatusParser.firstCall.args[ 1 ] ).toEqual( 'Response returned by "git describe" command.' );

					expect( statusResponse.response ).toEqual( {
						packageName: '@ckeditor/ckeditor5-test-package',
						status: { response: 'Parsed response.' },
						isRootRepository: false,
						commit: '6bfd379',
						mrgitBranch: 'master',
						mrgitTag: undefined,
						latestTag: 'v35.3.2'
					} );
				} );
		} );

		it( 'attaches suffix to root repository name', () => {
			commandData.isRootRepository = true;

			stubs.execCommand.execute.onCall( 0 ).resolves( {
				logs: { info: [ '6bfd379a56a32c9f8b6e58bf08e39c124cdbae10' ] }
			} );
			stubs.execCommand.execute.onCall( 1 ).resolves( {
				logs: { info: [ 'Response returned by "git status" command.' ] }
			} );
			stubs.execCommand.execute.onCall( 2 ).resolves( {
				logs: { info: [ '\nv35.3.2\nv35.3.1\nv35.3.0\nv35.2.1\nv35.2.0' ] }
			} );
			stubs.execCommand.execute.onCall( 3 ).resolves( {
				logs: { info: [ 'Response returned by "git describe" command.' ] }
			} );

			stubs.gitStatusParser.returns( { response: 'Parsed response.' } );

			return statusCommand.execute( commandData )
				.then( statusResponse => {
					expect( stubs.execCommand.execute.callCount ).toEqual( 4 );
					expect( stubs.execCommand.execute.getCall( 0 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git rev-parse HEAD' )
					);
					expect( stubs.execCommand.execute.getCall( 1 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git status --branch --porcelain' )
					);
					expect( stubs.execCommand.execute.getCall( 2 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git log --tags --simplify-by-decoration --pretty="%S"' )
					);
					expect( stubs.execCommand.execute.getCall( 3 ).args[ 0 ] ).toEqual(
						getCommandArguments( 'git describe --abbrev=0 --tags --always' )
					);

					expect( stubs.gitStatusParser.calledOnce ).toEqual( true );
					expect( stubs.gitStatusParser.firstCall.args[ 0 ] ).toEqual( 'Response returned by "git status" command.' );
					expect( stubs.gitStatusParser.firstCall.args[ 1 ] ).toEqual( 'Response returned by "git describe" command.' );

					expect( statusResponse.response ).toEqual( {
						packageName: 'test-package [ROOT REPOSITORY]',
						status: { response: 'Parsed response.' },
						isRootRepository: true,
						commit: '6bfd379',
						mrgitBranch: 'master',
						mrgitTag: undefined,
						latestTag: 'v35.3.2'
					} );
				} );
		} );

		function getCommandArguments( command ) {
			return Object.assign( {}, commandData, {
				arguments: [ command ]
			} );
		}
	} );

	describe( 'afterExecute()', () => {
		it( 'do not display anything if processed packages list is empty', () => {
			const logStub = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			commandResponses.add( { response: true } );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( logStub.called ).toEqual( false );
			logStub.restore();
		} );

		it( 'do not display anything if command responses list is empty', () => {
			const logStub = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'foo-package' );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( logStub.called ).toEqual( false );
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
					tag: undefined,
					detachedHead: false,
					ahead: 0,
					behind: 2,
					staged: [],
					modified: [ 'README.md' ],
					untracked: [],
					unmerged: []
				},
				commit: 'abcd123',
				mrgitBranch: 'master',
				mrgitTag: undefined,
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			commandResponses.add( {
				packageName: 'bar',
				status: {
					branch: 't/1',
					tag: undefined,
					detachedHead: false,
					ahead: 3,
					behind: 0,
					staged: [ 'gulpfile.js' ],
					modified: [],
					untracked: [ 'CHANGELOG.md' ],
					unmerged: []
				},
				commit: 'ef45678',
				mrgitBranch: 't/1',
				mrgitTag: undefined,
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			stubs.table.toString.returns( '┻━┻' );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( stubs.table.constructor.firstCall.args[ 0 ] ).toEqual( {
				head: [ 'Package', 'Branch/Tag', 'Commit', 'Status' ],
				style: {
					compact: true
				}
			} );

			expect( stubs.table.push.firstCall.args[ 0 ] ).toEqual(
				[ 'bar', 't/1 ↑3', 'ef45678', '+1 ?1' ]
			);
			expect( stubs.table.push.secondCall.args[ 0 ] ).toEqual(
				[ 'foo', 'master ↓2', 'abcd123', 'M1' ]
			);

			expect( stubs.table.toString.calledOnce ).toEqual( true );

			expect( logStub.calledTwice ).toEqual( true );
			expect( logStub.firstCall.args[ 0 ] ).toEqual( '┻━┻' );
			expect( logStub.secondCall.args[ 0 ] ).to.match( /^Legend:/ );
			expect( stubs.chalk.cyan.calledOnce ).toEqual( true );

			logStub.restore();
		} );

		it( 'adds green "L" before the tag name to indicate latest tag being up to date', () => {
			const logStub = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-bar' );

			commandResponses.add( {
				packageName: 'bar',
				status: {
					branch: 'HEAD (no branch)',
					tag: 'v35.3.2',
					detachedHead: true,
					ahead: 0,
					behind: 0,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: []
				},
				commit: 'ef45678',
				mrgitBranch: 'master',
				mrgitTag: 'latest',
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( stubs.table.push.firstCall.args[ 0 ] ).toEqual(
				[ 'bar', 'L v35.3.2', 'ef45678', '' ]
			);

			expect( stubs.chalk.green.callCount ).toEqual( 4 );

			// Table
			expect( stubs.chalk.green.getCall( 0 ).args[ 0 ] ).toEqual( 'L' );
			// Legend
			expect( stubs.chalk.green.getCall( 1 ).args[ 0 ] ).toEqual( '+' );
			expect( stubs.chalk.green.getCall( 2 ).args[ 0 ] ).toEqual( 'L' );
			// Hints
			expect( stubs.chalk.green.getCall( 3 ).args[ 0 ] ).toEqual( 'L' );

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
					tag: undefined,
					detachedHead: false,
					ahead: 0,
					behind: 0,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: []
				},
				commit: 'ef45678',
				mrgitBranch: 'master',
				mrgitTag: undefined,
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( stubs.table.push.firstCall.args[ 0 ] ).toEqual(
				[ 'bar', '! t/1', 'ef45678', '' ]
			);

			expect( stubs.chalk.cyan.callCount ).toEqual( 3 );

			// Table
			expect( stubs.chalk.cyan.getCall( 0 ).args[ 0 ] ).toEqual( '!' );
			// Legend
			expect( stubs.chalk.cyan.getCall( 1 ).args[ 0 ] ).toEqual( '!' );
			// Hints
			expect( stubs.chalk.cyan.getCall( 2 ).args[ 0 ] ).toEqual( '!' );

			logStub.restore();
		} );

		it( 'adds "!" before the tag name to indicate latest tag not being up to date', () => {
			const logStub = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-bar' );

			commandResponses.add( {
				packageName: 'bar',
				status: {
					branch: 'HEAD (no branch)',
					tag: 'v30.0.0',
					detachedHead: true,
					ahead: 0,
					behind: 0,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: []
				},
				commit: 'ef45678',
				mrgitBranch: 'master',
				mrgitTag: 'latest',
				currentTag: 'v30.0.0',
				latestTag: 'v35.3.2'
			} );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( stubs.table.push.firstCall.args[ 0 ] ).toEqual(
				[ 'bar', '! v30.0.0', 'ef45678', '' ]
			);

			expect( stubs.chalk.cyan.callCount ).toEqual( 3 );

			// Table
			expect( stubs.chalk.cyan.getCall( 0 ).args[ 0 ] ).toEqual( '!' );
			// Legend
			expect( stubs.chalk.cyan.getCall( 1 ).args[ 0 ] ).toEqual( '!' );
			// Hints
			expect( stubs.chalk.cyan.getCall( 2 ).args[ 0 ] ).toEqual( '!' );

			logStub.restore();
		} );

		it( 'adds "!" before the branch name if the latest tag should be checked out instead', () => {
			const logStub = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-bar' );

			commandResponses.add( {
				packageName: 'bar',
				status: {
					branch: 'master',
					tag: undefined,
					detachedHead: false,
					ahead: 0,
					behind: 0,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: []
				},
				commit: 'ef45678',
				mrgitBranch: 'master',
				mrgitTag: 'latest',
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( stubs.table.push.firstCall.args[ 0 ] ).toEqual(
				[ 'bar', '! master', 'ef45678', '' ]
			);

			expect( stubs.chalk.cyan.callCount ).toEqual( 3 );

			// Table
			expect( stubs.chalk.cyan.getCall( 0 ).args[ 0 ] ).toEqual( '!' );
			// Legend
			expect( stubs.chalk.cyan.getCall( 1 ).args[ 0 ] ).toEqual( '!' );
			// Hints
			expect( stubs.chalk.cyan.getCall( 2 ).args[ 0 ] ).toEqual( '!' );

			logStub.restore();
		} );

		it( 'adds "!" before the branch name if specific tag should be checked out instead', () => {
			const logStub = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-bar' );

			commandResponses.add( {
				packageName: 'bar',
				status: {
					branch: 'master',
					tag: undefined,
					detachedHead: false,
					ahead: 0,
					behind: 0,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: []
				},
				commit: 'ef45678',
				mrgitBranch: 'master',
				mrgitTag: 'v30.0.0',
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( stubs.table.push.firstCall.args[ 0 ] ).toEqual(
				[ 'bar', '! master', 'ef45678', '' ]
			);

			expect( stubs.chalk.cyan.callCount ).toEqual( 3 );

			// Table
			expect( stubs.chalk.cyan.getCall( 0 ).args[ 0 ] ).toEqual( '!' );
			// Legend
			expect( stubs.chalk.cyan.getCall( 1 ).args[ 0 ] ).toEqual( '!' );
			// Hints
			expect( stubs.chalk.cyan.getCall( 2 ).args[ 0 ] ).toEqual( '!' );

			logStub.restore();
		} );

		it( 'displays appropriate message when being checked out on a specific commit', () => {
			const logStub = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( '@ckeditor/ckeditor5-bar' );

			commandResponses.add( {
				packageName: 'bar',
				status: {
					branch: 'HEAD (no branch)',
					tag: 'v35.3.2',
					detachedHead: true,
					ahead: null,
					behind: null,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: []
				},
				commit: 'ef45678',
				mrgitBranch: 'ef45678',
				mrgitTag: undefined,
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( stubs.table.push.firstCall.args[ 0 ] ).toEqual(
				[ 'bar', 'Using saved commit →', 'ef45678', '' ]
			);

			expect( stubs.chalk.cyan.callCount ).toEqual( 1 );

			// Table
			expect( stubs.chalk.cyan.getCall( 0 ).args[ 0 ] ).toEqual( '!' );

			logStub.restore();
		} );

		it( 'sorts packages alphabetically', () => {
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

			expect( stubs.table.push.getCall( 0 ).args[ 0 ][ 0 ], 1 ).toEqual( 'aaa' );
			expect( stubs.table.push.getCall( 1 ).args[ 0 ][ 0 ], 2 ).toEqual( 'bar' );
			expect( stubs.table.push.getCall( 2 ).args[ 0 ][ 0 ], 3 ).toEqual( 'bom' );
			expect( stubs.table.push.getCall( 3 ).args[ 0 ][ 0 ], 4 ).toEqual( 'foo' );

			logStub.restore();

			function getCommandResponse( packageName, commit ) {
				return {
					packageName,
					status: {
						branch: 'master',
						tag: undefined,
						detachedHead: false,
						ahead: 0,
						behind: 0,
						staged: [],
						modified: [],
						untracked: [],
						unmerged: []
					},
					commit,
					mrgitBranch: 'master',
					mrgitTag: undefined,
					currentTag: 'v35.3.2',
					latestTag: 'v35.3.2'
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
					tag: undefined,
					detachedHead: false,
					ahead: 0,
					behind: 2,
					staged: [],
					modified: [ 'README.md' ],
					untracked: [],
					unmerged: [ '.travis.yml' ]
				},
				commit: 'abcd123',
				mrgitBranch: 'master',
				mrgitTag: undefined,
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			stubs.table.toString.returns( '┻━┻' );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( stubs.table.constructor.firstCall.args[ 0 ] ).toEqual( {
				head: [ 'Package', 'Branch/Tag', 'Commit', 'Status' ],
				style: {
					compact: true
				}
			} );

			expect( stubs.table.push.firstCall.args[ 0 ] ).toEqual(
				[ 'foo', 'master ↓2', 'abcd123', 'M2' ]
			);

			expect( stubs.table.toString.calledOnce ).toEqual( true );

			expect( logStub.calledTwice ).toEqual( true );
			expect( logStub.firstCall.args[ 0 ] ).toEqual( '┻━┻' );
			expect( logStub.secondCall.args[ 0 ] ).to.match( /^Legend:/ );
			expect( stubs.chalk.cyan.calledOnce ).toEqual( true );

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
					tag: undefined,
					detachedHead: false,
					ahead: 0,
					behind: 2,
					staged: [],
					modified: [],
					untracked: [],
					unmerged: [ '.travis.yml' ]
				},
				commit: 'abcd123',
				mrgitBranch: 'master',
				mrgitTag: undefined,
				currentTag: 'v35.3.2',
				latestTag: 'v35.3.2'
			} );

			stubs.table.toString.returns( '┻━┻' );

			statusCommand.afterExecute( processedPackages, commandResponses );

			expect( stubs.table.constructor.firstCall.args[ 0 ] ).toEqual( {
				head: [ 'Package', 'Branch/Tag', 'Commit', 'Status' ],
				style: {
					compact: true
				}
			} );

			expect( stubs.table.push.firstCall.args[ 0 ] ).toEqual(
				[ 'foo', 'master ↓2', 'abcd123', 'M1' ]
			);

			expect( stubs.table.toString.calledOnce ).toEqual( true );

			expect( logStub.calledTwice ).toEqual( true );
			expect( logStub.firstCall.args[ 0 ] ).toEqual( '┻━┻' );
			expect( logStub.secondCall.args[ 0 ] ).to.match( /^Legend:/ );
			expect( stubs.chalk.cyan.calledOnce ).toEqual( true );

			logStub.restore();
		} );
	} );
} );
