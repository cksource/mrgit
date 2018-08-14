/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const path = require( 'upath' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = require( 'chai' ).expect;

describe( 'commands/save', () => {
	let saveCommand, stubs, commandData, mgitJsonPath, updateFunction;

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
				join: sinon.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) )
			}
		};

		commandData = {
			packageName: 'test-package',
			arguments: []
		};

		mockery.registerMock( './exec', stubs.execCommand );
		mockery.registerMock( '../utils/updatejsonfile', ( pathToFile, callback ) => {
			mgitJsonPath = pathToFile;
			updateFunction = callback;
		} );
		mockery.registerMock( '../utils/getcwd', () => {
			return __dirname;
		} );

		saveCommand = require( '../../lib/commands/save' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.disable();
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( saveCommand.helpMessage ).is.a( 'string' );
		} );
	} );

	describe( 'beforeExecute()', () => {
		it( 'throws an error if default option is canceled', () => {
			const errorMessage = 'Need to specify what kind of information you want to save. Call "mgit save -h" in order to read more.';

			expect( () => {
				saveCommand.beforeExecute( [ 'hash', '--no-hash' ] );
			} ).to.throw( Error, errorMessage );
		} );

		it( 'does nothing if options are valid (--branch)', () => {
			expect( () => {
				saveCommand.beforeExecute( [ 'hash', '--branch' ] );
			} ).to.not.throw( Error );
		} );

		it( 'does nothing if called only command (without options)', () => {
			expect( () => {
				saveCommand.beforeExecute( [ 'hash' ] );
			} ).to.not.throw( Error );
		} );
	} );

	describe( 'execute()', () => {
		it( 'rejects promise if called command returned an error', () => {
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
						arguments: [ 'git rev-parse HEAD' ]
					} );

					expect( commandResponse.response ).to.deep.equal( {
						packageName: commandData.packageName,
						data: '584f341',
						branch: false,
						hash: true
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

			stubs.execCommand.execute.returns( Promise.resolve( execCommandResponse ) );
			commandData.arguments.push( '--branch' );

			return saveCommand.execute( commandData )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledOnce ).to.equal( true );
					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						packageName: commandData.packageName,
						arguments: [ 'git status --branch --porcelain' ]
					} );

					expect( commandResponse.response ).to.deep.equal( {
						packageName: commandData.packageName,
						data: 'master',
						branch: true,
						hash: false
					} );

					expect( commandResponse.logs.info[ 0 ] ).to.equal( 'Branch: "master".' );
				} );
		} );
	} );

	describe( 'afterExecute()', () => {
		it( 'updates collected hashes in "mgit.json" (--hash option)', () => {
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

			saveCommand.afterExecute( processedPackages, commandResponses );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test',
					'other-package': 'organization/other-package'
				}
			};

			expect( mgitJsonPath ).to.equal( __dirname + '/mgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json.dependencies ).to.deep.equal( {
				'test-package': 'organization/test-package#584f341',
				'package-test': 'organization/package-test#52910fe',
				'other-package': 'organization/other-package'
			} );
		} );

		it( 'updates collected branches in "mgit.json" (--branch option)', () => {
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

			saveCommand.afterExecute( processedPackages, commandResponses );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test',
					'other-package': 'organization/other-package'
				}
			};

			expect( mgitJsonPath ).to.equal( __dirname + '/mgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json.dependencies ).to.deep.equal( {
				'test-package': 'organization/test-package#develop',
				'package-test': 'organization/package-test#develop',
				'other-package': 'organization/other-package'
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

			saveCommand.afterExecute( processedPackages, commandResponses );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package#some-branch',
				}
			};

			expect( mgitJsonPath ).to.equal( __dirname + '/mgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json.dependencies ).to.deep.equal( {
				'test-package': 'organization/test-package',
			} );
		} );
	} );
} );
