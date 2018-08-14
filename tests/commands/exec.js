/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = require( 'chai' ).expect;

describe( 'commands/exec', () => {
	let execCommand, stubs, data;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			exec: sinon.stub(),
			fs: {
				existsSync: sinon.stub( fs, 'existsSync' )
			},
			path: {
				join: sinon.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) )
			},
			process: {
				chdir: sinon.stub( process, 'chdir' )
			}
		};

		data = {
			// Command `#execute` function is called without the "exec" command.
			// `mgit exec pwd` => [ 'pwd' ]
			arguments: [ 'pwd' ],
			packageName: 'test-package',
			options: {
				cwd: __dirname,
				packages: 'packages'
			},
			repository: {
				directory: 'test-package'
			}
		};

		mockery.registerMock( '../utils/shell', stubs.exec );

		execCommand = require( '../../lib/commands/exec' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.disable();
	} );

	describe( 'beforeExecute()', () => {
		it( 'throws an error if command to execute is not specified', () => {
			expect( () => {
				// `beforeExecute` is called with full user's input (mgit exec [command-to-execute]).
				execCommand.beforeExecute( [ 'exec' ] );
			} ).to.throw( Error, 'Missing command to execute. Use: mgit exec [command-to-execute].' );
		} );

		it( 'does nothing if command is specified', () => {
			expect( () => {
				execCommand.beforeExecute( [ 'exec', 'pwd' ] );
			} ).to.not.throw( Error );
		} );
	} );

	describe( 'execute()', () => {
		it( 'does not execute the command if package is not available', () => {
			stubs.fs.existsSync.returns( false );

			return execCommand.execute( data )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						const err = 'Package "test-package" is not available. Run "mgit bootstrap" in order to download the package.';
						expect( response.logs.error[ 0 ] ).to.equal( err );
					}
				);
		} );

		it( 'rejects promise if something went wrong', () => {
			const error = new Error( 'Unexpected error.' );

			stubs.fs.existsSync.returns( true );
			stubs.exec.returns( Promise.reject( error ) );

			return execCommand.execute( data )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( stubs.process.chdir.calledTwice ).to.equal( true );
						expect( stubs.process.chdir.firstCall.args[ 0 ] ).to.equal( 'packages/test-package' );
						expect( stubs.process.chdir.secondCall.args[ 0 ] ).to.equal( __dirname );
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'resolves promise if command has been executed', () => {
			const pwd = '/packages/test-package';
			stubs.fs.existsSync.returns( true );
			stubs.exec.returns( Promise.resolve( pwd ) );

			return execCommand.execute( data )
				.then( response => {
					expect( stubs.process.chdir.calledTwice ).to.equal( true );
					expect( stubs.process.chdir.firstCall.args[ 0 ] ).to.equal( 'packages/test-package' );
					expect( stubs.process.chdir.secondCall.args[ 0 ] ).to.equal( __dirname );
					expect( response.logs.info[ 0 ] ).to.equal( pwd );
				} );
		} );
	} );
} );
