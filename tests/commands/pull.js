/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const fs = require( 'fs' );
const path = require( 'upath' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = require( 'chai' ).expect;

describe( 'commands/pull', () => {
	let pullCommand, stubs, commandData;

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
			bootstrapCommand: {
				execute: sinon.stub()
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
		mockery.registerMock( './bootstrap', stubs.bootstrapCommand );

		pullCommand = require( '../../lib/commands/pull' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.deregisterAll();
		mockery.disable();
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( pullCommand.helpMessage ).is.a( 'string' );
		} );
	} );

	describe( 'execute()', () => {
		it( 'skips a package if is not available', () => {
			stubs.fs.existsSync.returns( false );

			return pullCommand.execute( commandData )
				.then( response => {
					expect( response ).toEqual( {} );
				} );
		} );

		it( 'skips a package if its in detached head mode', () => {
			stubs.fs.existsSync.returns( true );

			const exec = stubs.execCommand.execute;

			exec.onCall( 0 ).returns( Promise.resolve( {
				logs: getCommandLogs( '' )
			} ) );

			return pullCommand.execute( commandData )
				.then( response => {
					expect( exec.callCount ).toEqual( 1 );
					expect( exec.getCall( 0 ).args[ 0 ].arguments[ 0 ] ).toEqual( 'git branch --show-current' );

					expect( response.logs.info ).toEqual( [
						'This repository is currently in detached head mode - skipping.'
					] );
				} );
		} );

		it( 'resolves promise after pulling the changes', () => {
			stubs.fs.existsSync.returns( true );

			const exec = stubs.execCommand.execute;

			exec.onCall( 0 ).returns( Promise.resolve( {
				logs: getCommandLogs( 'master' )
			} ) );
			exec.onCall( 1 ).returns( Promise.resolve( {
				logs: getCommandLogs( 'Already up-to-date.' )
			} ) );

			return pullCommand.execute( commandData )
				.then( response => {
					expect( exec.callCount ).toEqual( 2 );
					expect( exec.getCall( 0 ).args[ 0 ].arguments[ 0 ] ).toEqual( 'git branch --show-current' );
					expect( exec.getCall( 1 ).args[ 0 ].arguments[ 0 ] ).toEqual( 'git pull' );

					expect( response.logs.info ).toEqual( [
						'Already up-to-date.'
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

			pullCommand.afterExecute( processedPackages );

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
