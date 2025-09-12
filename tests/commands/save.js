/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = require( 'chai' ).expect;

describe( 'commands/save', () => {
	let saveCommand, stubs, commandData, toolOptions, mrgitJsonPath, updateFunction;

	const normalizedDirname = __dirname.replace( /\\/g, '/' );

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
			path: {
				join: sinon.stub().callsFake( ( ...chunks ) => chunks.join( '/' ) )
			},
			gitStatusParser: sinon.stub()
		};

		toolOptions = {
			config: normalizedDirname + '/mrgit.json'
		};

		commandData = {
			packageName: 'test-package',
			arguments: [],
			toolOptions
		};

		mockery.registerMock( './exec', stubs.execCommand );
		mockery.registerMock( '../utils/updatejsonfile', ( pathToFile, callback ) => {
			mrgitJsonPath = pathToFile;
			updateFunction = callback;
		} );
		mockery.registerMock( '../utils/getcwd', () => {
			return __dirname;
		} );
		mockery.registerMock( '../utils/gitstatusparser', stubs.gitStatusParser );

		saveCommand = require( '../../lib/commands/save' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.deregisterAll();
		mockery.disable();
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( saveCommand.helpMessage ).is.a( 'string' );
		} );
	} );

	describe( 'beforeExecute()', () => {
		it( 'defined which type of data should be saved', () => {
			saveCommand.beforeExecute( [], toolOptions );
			expect( toolOptions.hash ).to.equal( true );
		} );

		it( 'throws an error if used both options', () => {
			const errorMessage = 'Cannot use "hash" and "branch" options at the same time.';

			toolOptions.branch = true;
			toolOptions.hash = true;

			expect( () => {
				saveCommand.beforeExecute( [], toolOptions );
			} ).to.throw( Error, errorMessage );
		} );
	} );

	describe( 'execute()', () => {
		it( 'rejects promise if called command returned an error', () => {
			toolOptions.hash = true;

			const error = new Error( 'Unexpected error.' );

			stubs.execCommand.execute.returns( Promise.reject( {
				logs: {
					error: [ error.stack ]
				}
			} ) );

			return saveCommand.execute( commandData )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'resolves promise with last commit id', () => {
			toolOptions.hash = true;

			const execCommandResponse = {
				logs: {
					info: [ '584f341' ]
				}
			};

			stubs.execCommand.execute.returns( Promise.resolve( execCommandResponse ) );

			return saveCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledOnce ).to.equal( true );
					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						packageName: commandData.packageName,
						arguments: [ 'git rev-parse HEAD' ],
						toolOptions: {
							hash: true,
							config: normalizedDirname + '/mrgit.json'
						}
					} );

					expect( commandResponse.response ).to.deep.equal( {
						packageName: commandData.packageName,
						data: '584f341',
						hash: true,
						branch: undefined
					} );

					expect( commandResponse.logs.info[ 0 ] ).to.equal( 'Commit: "584f341".' );
				} );
		} );

		it( 'resolves promise with a name of current branch if called with --branch option', () => {
			const execCommandResponse = {
				logs: {
					info: [ '## master...origin/master' ]
				}
			};

			toolOptions.branch = true;

			stubs.gitStatusParser.returns( { branch: 'master' } );
			stubs.execCommand.execute.returns( Promise.resolve( execCommandResponse ) );

			return saveCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledOnce ).to.equal( true );
					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						packageName: commandData.packageName,
						arguments: [ 'git status --branch --porcelain' ],
						toolOptions: {
							branch: true,
							config: normalizedDirname + '/mrgit.json'
						}
					} );

					expect( commandResponse.response ).to.deep.equal( {
						packageName: commandData.packageName,
						data: 'master',
						branch: true,
						hash: undefined
					} );

					expect( commandResponse.logs.info[ 0 ] ).to.equal( 'Branch: "master".' );
				} );
		} );
	} );

	describe( 'afterExecute()', () => {
		it( 'updates collected hashes in "mrgit.json" (--hash option, default behavior)', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );
			processedPackages.add( 'package-test' );

			commandResponses.add( {
				packageName: 'test-package',
				data: '584f341',
				hash: true,
				branch: false
			} );
			commandResponses.add( {
				packageName: 'package-test',
				data: '52910fe',
				hash: true,
				branch: false
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test',
					'other-package': 'organization/other-package'
				}
			};

			expect( mrgitJsonPath ).to.equal( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json.dependencies ).to.deep.equal( {
				'test-package': 'organization/test-package#584f341',
				'package-test': 'organization/package-test#52910fe',
				'other-package': 'organization/other-package'
			} );
		} );

		it( 'updates collected branches in "mrgit.json" (--branch option)', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );
			processedPackages.add( 'package-test' );

			commandResponses.add( {
				packageName: 'test-package',
				data: 'develop',
				hash: false,
				branch: true
			} );
			commandResponses.add( {
				packageName: 'package-test',
				data: 'develop',
				hash: false,
				branch: true
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test',
					'other-package': 'organization/other-package'
				}
			};

			expect( mrgitJsonPath ).to.equal( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json.dependencies ).to.deep.equal( {
				'test-package': 'organization/test-package#develop',
				'package-test': 'organization/package-test#develop',
				'other-package': 'organization/other-package'
			} );
		} );

		it( 'updates collected hashes in "mrgit.json" (--preset option)', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );
			processedPackages.add( 'package-test' );

			commandResponses.add( {
				packageName: 'test-package',
				data: '584f341',
				hash: true,
				branch: false
			} );
			commandResponses.add( {
				packageName: 'package-test',
				data: '52910fe',
				hash: true,
				branch: false
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test'
				},
				preset: 'development',
				presets: {
					development: {
						'test-package': 'organization/test-package#development',
						'package-test': 'organization/package-test#development'
					}
				}
			};

			toolOptions.preset = 'development';

			expect( mrgitJsonPath ).to.equal( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json ).to.deep.equal( {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test'
				},
				preset: 'development',
				presets: {
					development: {
						'test-package': 'organization/test-package#584f341',
						'package-test': 'organization/package-test#52910fe'
					}
				}
			} );
		} );

		it( 'adds new value to the preset if its not in it, but it is in the base dependencies (--preset option)', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );
			processedPackages.add( 'package-test' );

			commandResponses.add( {
				packageName: 'test-package',
				data: '584f341',
				hash: true,
				branch: false
			} );
			commandResponses.add( {
				packageName: 'package-test',
				data: '52910fe',
				hash: true,
				branch: false
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test'
				},
				preset: 'development',
				presets: {
					development: {
						'test-package': 'organization/test-package#development'
					}
				}
			};

			toolOptions.preset = 'development';

			expect( mrgitJsonPath ).to.equal( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json ).to.deep.equal( {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test'
				},
				preset: 'development',
				presets: {
					development: {
						'test-package': 'organization/test-package#584f341',
						'package-test': 'organization/package-test#52910fe'
					}
				}
			} );
		} );

		it( 'updates base dependencies if specified preset is not defined (--preset option)', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );
			processedPackages.add( 'package-test' );

			commandResponses.add( {
				packageName: 'test-package',
				data: '584f341',
				hash: true,
				branch: false
			} );
			commandResponses.add( {
				packageName: 'package-test',
				data: '52910fe',
				hash: true,
				branch: false
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test'
				},
				preset: 'development',
				presets: {}
			};

			toolOptions.preset = 'development';

			expect( mrgitJsonPath ).to.equal( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json ).to.deep.equal( {
				dependencies: {
					'test-package': 'organization/test-package#584f341',
					'package-test': 'organization/package-test#52910fe'
				},
				preset: 'development',
				presets: {}
			} );
		} );

		it( 'updates base dependencies if specified presets are not defined (--preset option)', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );
			processedPackages.add( 'package-test' );

			commandResponses.add( {
				packageName: 'test-package',
				data: '584f341',
				hash: true,
				branch: false
			} );
			commandResponses.add( {
				packageName: 'package-test',
				data: '52910fe',
				hash: true,
				branch: false
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test'
				},
				preset: 'development'
			};

			toolOptions.preset = 'development';

			expect( mrgitJsonPath ).to.equal( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json ).to.deep.equal( {
				dependencies: {
					'test-package': 'organization/test-package#584f341',
					'package-test': 'organization/package-test#52910fe'
				},
				preset: 'development'
			} );
		} );

		it( 'does not save "#master" branch because it is default branch', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );

			commandResponses.add( {
				packageName: 'test-package',
				data: 'master',
				hash: false,
				branch: true
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package#some-branch'
				}
			};

			expect( mrgitJsonPath ).to.equal( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json.dependencies ).to.deep.equal( {
				'test-package': 'organization/test-package'
			} );
		} );

		it( 'overwrites tags defined in "mrgit.json"', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );
			processedPackages.add( 'package-test' );

			commandResponses.add( {
				packageName: 'test-package',
				data: 'develop',
				hash: false,
				branch: true
			} );
			commandResponses.add( {
				packageName: 'package-test',
				data: 'develop',
				hash: false,
				branch: true
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package@v30.0.0',
					'package-test': 'organization/package-test@latest'
				}
			};

			expect( mrgitJsonPath ).to.equal( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json.dependencies ).to.deep.equal( {
				'test-package': 'organization/test-package#develop',
				'package-test': 'organization/package-test#develop'
			} );
		} );
	} );
} );
