/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, beforeEach, describe, it, expect } from 'vitest';
import pushCommand from '../../lib/commands/push.js';
import execCommand from '../../lib/commands/exec.js';
import fs from 'node:fs';

vi.mock( '../../lib/commands/exec.js' );
vi.mock( 'fs' );

describe( 'commands/push', () => {
	let commandData;

	beforeEach( () => {
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
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( typeof pushCommand.helpMessage ).toEqual( 'string' );
		} );
	} );

	describe( 'execute()', () => {
		it( 'skips a package if is not available', () => {
			fs.existsSync.mockReturnValue( false );

			return pushCommand.execute( commandData )
				.then( response => {
					expect( response ).toEqual( {} );
				} );
		} );

		it( 'skips a package if its in detached head mode', () => {
			fs.existsSync.mockReturnValue( true );

			execCommand.executeGit.mockReturnValueOnce( Promise.resolve( {
				logs: getCommandLogs( '' )
			} ) );

			return pushCommand.execute( commandData )
				.then( response => {
					expect( execCommand.executeGit ).toHaveBeenCalledTimes( 1 );
					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 1,
						commandData,
						[ 'branch', '--show-current' ]
					);

					expect( response.logs.info ).toEqual( [
						'This repository is currently in detached head mode - skipping.'
					] );
				} );
		} );

		it( 'resolves promise after pushing the changes', () => {
			fs.existsSync.mockReturnValue( true );

			execCommand.executeGit
				.mockResolvedValueOnce( {
					logs: getCommandLogs( 'master' )
				} )
				.mockResolvedValueOnce( {
					logs: getCommandLogs( 'Everything up-to-date' )
				} );

			return pushCommand.execute( commandData )
				.then( response => {
					expect( execCommand.executeGit ).toHaveBeenCalledTimes( 2 );
					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 1,
						commandData,
						[ 'branch', '--show-current' ]
					);
					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 2,
						commandData,
						[ 'push' ]
					);

					expect( response.logs.info ).toEqual( [
						'Everything up-to-date'
					] );
				} );
		} );

		it( 'allows modifying the "git push" command', () => {
			commandData.arguments.push( '--verbose' );
			commandData.arguments.push( '--all' );
			fs.existsSync.mockReturnValue( true );

			execCommand.executeGit.mockReturnValue( Promise.resolve( {
				logs: getCommandLogs( 'Everything up-to-date' )
			} ) );

			return pushCommand.execute( commandData )
				.then( response => {
					expect( execCommand.executeGit ).toHaveBeenCalledTimes( 2 );
					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 1,
						commandData,
						[ 'branch', '--show-current' ]
					);
					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 2,
						commandData,
						[ 'push', '--verbose', '--all' ]
					);

					expect( response.logs.info ).toEqual( [
						'Everything up-to-date'
					] );
				} );
		} );

		it( 'passes shell-like fragments as plain push arguments', () => {
			commandData.arguments.push( 'origin; touch HACKED; #' );
			fs.existsSync.mockReturnValue( true );

			execCommand.executeGit
				.mockResolvedValueOnce( { logs: getCommandLogs( 'master' ) } )
				.mockResolvedValueOnce( { logs: getCommandLogs( 'Everything up-to-date' ) } );

			return pushCommand.execute( commandData )
				.then( () => {
					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 2,
						commandData,
						[ 'push', 'origin; touch HACKED; #' ]
					);
				} );
		} );
	} );

	describe( 'afterExecute()', () => {
		it( 'informs about number of processed packages', () => {
			const consoleLog = vi.spyOn( console, 'log' ).mockImplementation( () => {} );

			const processedPackages = new Set();
			processedPackages.add( 'package-1' );
			processedPackages.add( 'package-2' );

			pushCommand.afterExecute( processedPackages );

			expect( consoleLog ).toHaveBeenCalledTimes( 1 );
			expect( consoleLog ).toHaveBeenCalledWith( '2 packages have been processed.' );
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
