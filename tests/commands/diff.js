/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, beforeEach, describe, it, expect } from 'vitest';
import diffCommand from '../../lib/commands/diff.js';
import execCommand from '../../lib/commands/exec.js';

vi.mock( '../../lib/commands/exec.js' );

describe( 'commands/diff', () => {
	let commandData;

	beforeEach( () => {
		commandData = {
			arguments: []
		};
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( typeof diffCommand.helpMessage ).toEqual( 'string' );
		} );
	} );

	describe( 'beforeExecute()', () => {
		it( 'informs about starting the process', () => {
			const consoleLog = vi.spyOn( console, 'log' ).mockImplementation( () => {} );

			diffCommand.beforeExecute();

			expect( consoleLog ).toHaveBeenCalledTimes( 1 );
			expect( consoleLog ).toHaveBeenCalledWith( 'Collecting changes...' );
		} );
	} );

	describe( 'execute()', () => {
		it( 'rejects promise if called command returned an error', () => {
			const error = new Error( 'Unexpected error.' );

			execCommand.execute.mockRejectedValue( {
				logs: {
					error: [ error.stack ]
				}
			} );

			return diffCommand.execute( commandData )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).toEqual( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'returns logs with the changes if any occurs', () => {
			const diffResult = 'diff --git a/gulpfile.js b/gulpfile.js\n' +
				'index 40c0e59..0699706 100644\n' +
				'--- a/gulpfile.js\n' +
				'+++ b/gulpfile.js\n' +
				'@@ -20,3 +20,4 @@ const options = {\n' +
				' gulp.task( \'lint\', () => ckeditor5Lint.lint( options ) );\n' +
				' gulp.task( \'lint-staged\', () => ckeditor5Lint.lintStaged( options ) );\n' +
				' gulp.task( \'pre-commit\', [ \'lint-staged\' ] );\n' +
				'+// Some comment.';

			execCommand.execute.mockResolvedValue( {
				logs: {
					info: [ diffResult ]
				}
			} );

			return diffCommand.execute( commandData )
				.then( diffResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 1 );
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1,
						expect.objectContaining( { arguments: [ 'git diff --color' ] } )
					);

					expect( diffResponse.logs.info[ 0 ] ).toEqual( diffResult );
				} );
		} );

		it( 'does not return the logs when repository has not changed', () => {
			execCommand.execute.mockResolvedValue( { logs: { info: [] } } );

			return diffCommand.execute( commandData )
				.then( diffResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 1 );

					expect( diffResponse ).toEqual( {} );
				} );
		} );

		it( 'allows modifying the "git diff" command', () => {
			execCommand.execute.mockResolvedValue( { logs: { info: [] } } );

			commandData.arguments = [
				'--stat',
				'--staged'
			];

			return diffCommand.execute( commandData )
				.then( diffResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 1 );
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1,
						expect.objectContaining( { arguments: [ 'git diff --color --stat --staged' ] } )
					);

					expect( diffResponse ).toEqual( {} );
				} );
		} );
	} );

	describe( 'afterExecute()', () => {
		it( 'should describe what kind of logs are displayed', () => {
			const consoleLog = vi.spyOn( console, 'log' ).mockImplementation( () => {} );

			diffCommand.afterExecute();

			expect( consoleLog ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
