/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, beforeEach, describe, it, expect } from 'vitest';
import execCommand from '../../lib/commands/exec.js';
import { shell } from '../../lib/utils/shell.js';
import fs from 'node:fs';

vi.mock( '../../lib/utils/shell.js' );
vi.mock( 'fs' );

describe( 'commands/exec', () => {
	let commandData, chdir;

	beforeEach( () => {
		chdir = vi.spyOn( process, 'chdir' ).mockImplementation( () => {} );

		commandData = {
			// Command `#execute` function is called without the "exec" command.
			// `mrgit exec pwd` => [ 'pwd' ]
			arguments: [ 'pwd' ],
			packageName: 'test-package',
			toolOptions: {
				cwd: __dirname,
				packages: 'packages'
			},
			repository: {
				directory: 'test-package'
			}
		};
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( typeof execCommand.helpMessage ).toEqual( 'string' );
		} );
	} );

	describe( 'beforeExecute()', () => {
		it( 'throws an error if command to execute is not specified', () => {
			expect( () => {
				// `beforeExecute` is called with full user's input (mrgit exec [command-to-execute]).
				execCommand.beforeExecute( [ 'exec' ] );
			} ).to.throw( Error, 'Missing command to execute. Use: mrgit exec [command-to-execute].' );
		} );

		it( 'does nothing if command is specified', () => {
			expect( () => {
				execCommand.beforeExecute( [ 'exec', 'pwd' ] );
			} ).to.not.throw( Error );
		} );
	} );

	describe( 'execute()', () => {
		it( 'does not execute the command if package is not available', () => {
			fs.existsSync.mockReturnValue( false );

			return execCommand.execute( commandData )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						const err = 'Package "test-package" is not available. Run "mrgit sync" in order to download the package.';
						expect( response.logs.error[ 0 ] ).toEqual( err );
					}
				);
		} );

		it( 'rejects promise if something went wrong', () => {
			const error = new Error( 'Unexpected error.' );

			fs.existsSync.mockReturnValue( true );
			shell.mockImplementation( () => Promise.reject( error ) );

			return execCommand.execute( commandData )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( chdir ).toHaveBeenCalledTimes( 2 );
						expect( chdir ).toHaveBeenNthCalledWith( 1, 'packages/test-package' );
						expect( chdir ).toHaveBeenNthCalledWith( 2, import.meta.dirname );
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).toEqual( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'resolves promise if command has been executed', () => {
			const pwd = '/packages/test-package';
			fs.existsSync.mockReturnValue( true );
			shell.mockReturnValue( Promise.resolve( pwd ) );

			return execCommand.execute( commandData )
				.then( response => {
					expect( chdir ).toHaveBeenCalledTimes( 2 );
					expect( chdir ).toHaveBeenNthCalledWith( 1, 'packages/test-package' );
					expect( chdir ).toHaveBeenNthCalledWith( 2, import.meta.dirname );
					expect( response.logs.info[ 0 ] ).toEqual( pwd );
				} );
		} );
	} );
} );
