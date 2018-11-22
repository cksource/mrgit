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

describe( 'commands/bootstrap', () => {
	let bootstrapCommand, stubs, data;

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
			}
		};

		data = {
			packageName: 'test-package',
			options: {
				cwd: __dirname,
				packages: 'packages'
			},
			repository: {
				directory: 'test-package',
				url: 'git@github.com/organization/test-package.git',
				branch: 'master'
			}
		};

		mockery.registerMock( '../utils/exec', stubs.exec );

		bootstrapCommand = require( '../../lib/commands/bootstrap' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.disable();
	} );

	describe( 'execute()', () => {
		it( 'rejects promise if something went wrong', () => {
			const error = new Error( 'Unexpected error.' );

			stubs.fs.existsSync.returns( false );
			stubs.exec.returns( Promise.reject( error ) );

			return bootstrapCommand.execute( data )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'clones a repository if is not available', () => {
			stubs.fs.existsSync.returns( false );
			stubs.exec.returns( Promise.resolve( 'Git clone log.' ) );

			return bootstrapCommand.execute( data )
				.then( response => {
					expect( stubs.exec.calledOnce ).to.equal( true );

					const cloneCommand = stubs.exec.firstCall.args[ 0 ].split( ' && ' );

					// Clone the repository.
					expect( cloneCommand[ 0 ] )
						.to.equal( 'git clone --progress "git@github.com/organization/test-package.git" "packages/test-package"' );
					// Change the directory to cloned package.
					expect( cloneCommand[ 1 ] ).to.equal( 'cd "packages/test-package"' );
					// And check out to proper branch.
					expect( cloneCommand[ 2 ] ).to.equal( 'git checkout --quiet master' );

					expect( response.logs.info[ 0 ] ).to.equal( 'Git clone log.' );
				} );
		} );

		it( 'does not clone a repository if is available', () => {
			stubs.fs.existsSync.returns( true );

			return bootstrapCommand.execute( data )
				.then( response => {
					expect( stubs.exec.called ).to.equal( false );

					expect( response.logs.info[ 0 ] ).to.equal( 'Package "test-package" is already cloned.' );
				} );
		} );

		it( 'installs dependencies of cloned package', () => {
			data.options.recursive = true;
			data.options.packages = __dirname + '/../fixtures';
			data.repository.directory = 'project-a';

			stubs.fs.existsSync.returns( true );

			return bootstrapCommand.execute( data )
				.then( response => {
					expect( response.packages ).is.an( 'array' );
					expect( response.packages ).to.deep.equal( [ 'test-foo' ] );
				} );
		} );

		it( 'installs devDependencies of cloned package', () => {
			data.options.recursive = true;
			data.options.packages = __dirname + '/../fixtures';
			data.repository.directory = 'project-with-options-in-mgitjson';

			stubs.fs.existsSync.returns( true );

			return bootstrapCommand.execute( data )
				.then( response => {
					expect( response.packages ).is.an( 'array' );
					expect( response.packages ).to.deep.equal( [ 'test-bar' ] );
				} );
		} );

		it( 'tries to install missing packages once again if git ends with unexpected error', function() {
			this.timeout( 5500 );

			stubs.fs.existsSync.returns( false );

			stubs.exec.onFirstCall().returns( Promise.reject( [
				'exec: Cloning into \'/some/path\'...',
				'remote: Enumerating objects: 6, done.',
				'remote: Counting objects: 100% (6/6), done.',
				'remote: Compressing objects: 100% (6/6), done.',
				'packet_write_wait: Connection to 000.00.000.000 port 22: Broken pipe',
				'fatal: The remote end hung up unexpectedly',
				'fatal: early EOF',
				'fatal: index-pack failed'
			].join( '\n' ) ) );

			stubs.exec.onSecondCall().returns( Promise.resolve( 'Git clone log.' ) );

			return bootstrapCommand.execute( data )
				.then( response => {
					expect( stubs.exec.calledTwice ).to.equal( true );

					const firstCommand = stubs.exec.firstCall.args[ 0 ].split( ' && ' );

					// Clone the repository.
					expect( firstCommand[ 0 ] )
						.to.equal( 'git clone --progress "git@github.com/organization/test-package.git" "packages/test-package"' );
					// Change the directory to cloned package.
					expect( firstCommand[ 1 ] ).to.equal( 'cd "packages/test-package"' );
					// And check out to proper branch.
					expect( firstCommand[ 2 ] ).to.equal( 'git checkout --quiet master' );

					const secondCommand = stubs.exec.secondCall.args[ 0 ].split( ' && ' );

					// Clone the repository.
					expect( secondCommand[ 0 ] )
						.to.equal( 'git clone --progress "git@github.com/organization/test-package.git" "packages/test-package"' );
					// Change the directory to cloned package.
					expect( secondCommand[ 1 ] ).to.equal( 'cd "packages/test-package"' );
					// And check out to proper branch.
					expect( secondCommand[ 2 ] ).to.equal( 'git checkout --quiet master' );

					expect( response.logs.info[ 0 ] ).to.equal( 'Git clone log.' );
				} );
		} );
	} );

	describe( 'afterExecute()', () => {
		it( 'informs about number of processed packages', () => {
			const consoleLog = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			processedPackages.add( 'package-1' );
			processedPackages.add( 'package-2' );

			bootstrapCommand.afterExecute( processedPackages );

			expect( consoleLog.calledOnce ).to.equal( true );
			expect( consoleLog.firstCall.args[ 0 ] ).to.match( /2 packages have been processed\./ );

			consoleLog.restore();
		} );
	} );
} );
