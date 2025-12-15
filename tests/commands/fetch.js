/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, beforeEach, describe, it, expect } from 'vitest';
import execCommand from '../../lib/commands/exec.js';
import fetchCommand from '../../lib/commands/fetch.js';
import fs from 'node:fs';

vi.mock( '../../lib/commands/exec.js' );
vi.mock( 'fs' );

describe( 'commands/fetch', () => {
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
			expect( typeof fetchCommand.helpMessage ).toEqual( 'string' );
		} );
	} );

	describe( 'execute()', () => {
		it( 'skips a package if is not available', () => {
			fs.existsSync.mockReturnValue( false );

			return fetchCommand.execute( commandData )
				.then( response => {
					expect( response ).toEqual( {} );
				} );
		} );

		it( 'resolves promise after pushing the changes', () => {
			fs.existsSync.mockReturnValue( true );

			execCommand.execute.mockReturnValue( Promise.resolve( {
				logs: getCommandLogs( 'remote: Counting objects: 254, done.' )
			} ) );

			return fetchCommand.execute( commandData )
				.then( response => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 1 );
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1,
						expect.objectContaining( { arguments: [ 'git fetch' ] } )
					);

					expect( response.logs.info ).toEqual( [
						'remote: Counting objects: 254, done.'
					] );
				} );
		} );

		it( 'allows removing remote-tracking references that no longer exist', () => {
			commandData.arguments.push( '--prune' );
			fs.existsSync.mockReturnValue( true );

			execCommand.execute.mockReturnValue( Promise.resolve( {
				logs: getCommandLogs( 'remote: Counting objects: 254, done.' )
			} ) );

			return fetchCommand.execute( commandData )
				.then( response => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 1 );
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1,
						expect.objectContaining( { arguments: [ 'git fetch -p' ] } )
					);

					expect( response.logs.info ).toEqual( [
						'remote: Counting objects: 254, done.'
					] );
				} );
		} );

		it( 'prints a log if repository is up-to-date', () => {
			fs.existsSync.mockReturnValue( true );

			execCommand.execute.mockReturnValue( Promise.resolve( {
				logs: { info: [] }
			} ) );

			return fetchCommand.execute( commandData )
				.then( response => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 1 );
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1,
						expect.objectContaining( { arguments: [ 'git fetch' ] } )
					);

					expect( response.logs.info ).toEqual( [
						'Repository is up to date.'
					] );
				} );
		} );
	} );

	describe( 'afterExecute()', () => {
		it( 'informs about number of processed packages', () => {
			const consoleLog = vi.spyOn( console, 'log' ).mockImplementation( () => {} );

			const processedPackages = new Set();
			processedPackages.add( 'package-1' );
			processedPackages.add( 'package-2' );

			fetchCommand.afterExecute( processedPackages );

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
