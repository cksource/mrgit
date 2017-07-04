/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const path = require( 'path' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = require( 'chai' ).expect;

describe( 'commands/savehashes', () => {
	let saveHashesCommand, sandbox, stubs, data, mgitJsonPath, updateFunction;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			execCommand: {
				execute: sandbox.stub()
			},
			path: {
				join: sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) )
			}
		};

		data = {
			packageName: 'test-package',
		};

		mockery.registerMock( './exec', stubs.execCommand );
		mockery.registerMock( '../utils/updatejsonfile', ( pathToFile, callback ) => {
			mgitJsonPath = pathToFile;
			updateFunction = callback;
		} );
		mockery.registerMock( '../utils/getcwd', () => {
			return __dirname;
		} );

		saveHashesCommand = require( '../../lib/commands/savehashes' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	describe( 'execute()', () => {
		it( 'rejects promise if called command returned an error', () => {
			const error = new Error( 'Unexpected error.' );

			stubs.execCommand.execute.returns( Promise.reject( error ) );

			return saveHashesCommand.execute( data )
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

			return saveHashesCommand.execute( data )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledOnce ).to.equal( true );
					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						packageName: data.packageName,
						arguments: [ 'git rev-parse HEAD' ]
					} );

					expect( commandResponse.response ).to.deep.equal( {
						packageName: data.packageName,
						commit: '584f341'
					} );

					expect( commandResponse.logs.info[ 0 ] ).to.equal( 'Commit: "584f341".' );
				} );
		} );
	} );

	describe( 'afterExecute()', () => {
		it( 'updates collected hashes in "mgit.json"', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );
			processedPackages.add( 'package-test' );

			commandResponses.add( {
				packageName: 'test-package',
				commit: '584f341'
			} );
			commandResponses.add( {
				packageName: 'package-test',
				commit: '52910fe'
			} );

			saveHashesCommand.afterExecute( processedPackages, commandResponses );

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
	} );
} );
