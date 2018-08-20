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
			mgitOptions: {
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
		it( 'clones a package if is not available', () => {
			commandData.arguments.push( '--recursive' );

			stubs.fs.existsSync.returns( false );
			stubs.bootstrapCommand.execute.returns( Promise.resolve( {
				logs: getCommandLogs( 'Cloned.' )
			} ) );

			return pullCommand.execute( commandData )
				.then( response => {
					expect( response.logs.info ).to.deep.equal( [
						'Package "test-package" was not found. Cloning...',
						'Cloned.'
					] );

					expect( stubs.bootstrapCommand.execute.calledOnce ).to.equal( true );
					expect( stubs.bootstrapCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( commandData );
				} );
		} );

		it( 'resolves promise after pulling the changes', () => {
			stubs.fs.existsSync.returns( true );

			const exec = stubs.execCommand.execute;

			exec.returns( Promise.resolve( {
				logs: getCommandLogs( 'Already up-to-date.' )
			} ) );

			return pullCommand.execute( commandData )
				.then( response => {
					expect( exec.callCount ).to.equal( 1 );
					expect( exec.firstCall.args[ 0 ].arguments[ 0 ] ).to.equal( 'git pull' );

					expect( response.logs.info ).to.deep.equal( [
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

			expect( consoleLog.calledOnce ).to.equal( true );
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
