/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const fs = require( 'fs' );
const path = require( 'upath' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = require( 'chai' ).expect;

describe( 'commands/fetch', () => {
	let fetchCommand, stubs, commandData;

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
			execCommand: {
				execute: sinon.stub()
			}
		};

		commandData = {
			arguments: [],
			packageName: 'test-package',
			toolOptions: {
				cwd: __dirname,
				packages: 'packages'
			},
			repository: {
				directory: 'test-package',
				url: 'git@github.com/organization/test-package.git',
				branch: 'master'
			}
		};

		mockery.registerMock( './exec', stubs.execCommand );

		fetchCommand = require( '../../lib/commands/fetch' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.deregisterAll();
		mockery.disable();
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( fetchCommand.helpMessage ).is.a( 'string' );
		} );
	} );

	describe( 'execute()', () => {
		it( 'skips a package if is not available', () => {
			stubs.fs.existsSync.returns( false );

			return fetchCommand.execute( commandData )
				.then( response => {
					expect( response ).toEqual( {} );
				} );
		} );

		it( 'resolves promise after pushing the changes', () => {
			stubs.fs.existsSync.returns( true );

			const exec = stubs.execCommand.execute;

			exec.returns( Promise.resolve( {
				logs: getCommandLogs( 'remote: Counting objects: 254, done.' )
			} ) );

			return fetchCommand.execute( commandData )
				.then( response => {
					expect( exec.callCount ).toEqual( 1 );
					expect( exec.firstCall.args[ 0 ].arguments[ 0 ] ).toEqual( 'git fetch' );

					expect( response.logs.info ).toEqual( [
						'remote: Counting objects: 254, done.'
					] );
				} );
		} );

		it( 'allows removing remote-tracking references that no longer exist', () => {
			commandData.arguments.push( '--prune' );
			stubs.fs.existsSync.returns( true );

			const exec = stubs.execCommand.execute;

			exec.returns( Promise.resolve( {
				logs: getCommandLogs( 'remote: Counting objects: 254, done.' )
			} ) );

			return fetchCommand.execute( commandData )
				.then( response => {
					expect( exec.callCount ).toEqual( 1 );
					expect( exec.firstCall.args[ 0 ].arguments[ 0 ] ).toEqual( 'git fetch -p' );

					expect( response.logs.info ).toEqual( [
						'remote: Counting objects: 254, done.'
					] );
				} );
		} );

		it( 'prints a log if repository is up-to-date', () => {
			stubs.fs.existsSync.returns( true );

			const exec = stubs.execCommand.execute;

			exec.returns( Promise.resolve( {
				logs: { info: [] }
			} ) );

			return fetchCommand.execute( commandData )
				.then( response => {
					expect( exec.callCount ).toEqual( 1 );
					expect( exec.firstCall.args[ 0 ].arguments[ 0 ] ).toEqual( 'git fetch' );

					expect( response.logs.info ).toEqual( [
						'Repository is up to date.'
					] );
				} );
		} );
	} );

	describe( 'afterExecute()', () => {
		it( 'informs about number of processed packages', () => {
			const consoleLog = sinon.stub( console, 'log' );

			const processedPackages = new Set();
			processedPackages.add( 'package-1' );
			processedPackages.add( 'package-2' );

			fetchCommand.afterExecute( processedPackages );

			expect( consoleLog.calledOnce ).toEqual( true );
			expect( consoleLog.firstCall.args[ 0 ] ).to.match( /2 packages have been processed\./ );

			consoleLog.restore();
		} );
	} );

	function getCommandLogs( msg, isError = false ) {
		const logs = {
			error: [],
			info: []
		};

		if ( isError ) {
			logs.error.push( msg );
		} else {
			logs.info.push( msg );
		}

		return logs;
	}
} );
