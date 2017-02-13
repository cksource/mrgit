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
				join: sandbox.stub( path, 'join', ( ...chunks ) => chunks.join( '/' ) )
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
					( response ) => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'resolves promise with last commit id', () => {
			const execCommandResponse = {
				logs: {
					info: [ '584f34152d782cc2f26453e10b93c4a16ef01925' ]
				}
			};

			stubs.execCommand.execute.returns( Promise.resolve( execCommandResponse ) );

			return saveHashesCommand.execute( data )
				.then( ( commandResponse ) => {
					expect( commandResponse.response ).to.deep.equal( {
						packageName: data.packageName,
						commit: '584f34152d782cc2f26453e10b93c4a16ef01925'
					} );

					expect( commandResponse.logs.info[ 0 ] ).to.equal( 'Commit: "584f34152d782cc2f26453e10b93c4a16ef01925".' );
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
				commit: '584f34152d782cc2f26453e10b93c4a16ef01925'
			} );
			commandResponses.add( {
				packageName: 'package-test',
				commit: '52910fe61a4c39b01e35462f2cc287d25143f485'
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
				'test-package': 'organization/test-package#584f34152d782cc2f26453e10b93c4a16ef01925',
				'package-test': 'organization/package-test#52910fe61a4c39b01e35462f2cc287d25143f485',
				'other-package': 'organization/other-package'
			} );
		} );
	} );
} );
