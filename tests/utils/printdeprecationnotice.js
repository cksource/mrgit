/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, beforeEach, describe, it, expect } from 'vitest';
import { printDeprecationNotice, DEPRECATION_NOTICE } from '../../lib/utils/printdeprecationnotice.js';

describe( 'utils/printDeprecationNotice()', () => {
	let consoleErrorSpy, consoleLogSpy;

	beforeEach( () => {
		consoleErrorSpy = vi.spyOn( console, 'error' ).mockImplementation( () => {} );
		consoleLogSpy = vi.spyOn( console, 'log' ).mockImplementation( () => {} );
	} );

	it( 'prints the notice to stderr', () => {
		printDeprecationNotice( {} );

		expect( consoleErrorSpy ).toHaveBeenCalledOnce();
		expect( consoleErrorSpy.mock.calls[ 0 ][ 0 ] ).to.contain( DEPRECATION_NOTICE );
	} );

	it( 'does not print anything to stdout', () => {
		printDeprecationNotice( {} );

		expect( consoleLogSpy ).not.toHaveBeenCalled();
	} );

	it( 'does not print the notice when the "MRGIT_NO_DEPRECATION_WARNING" variable is set', () => {
		printDeprecationNotice( { MRGIT_NO_DEPRECATION_WARNING: '1' } );

		expect( consoleErrorSpy ).not.toHaveBeenCalled();
	} );

	it( 'does not change the exit code', () => {
		const exitCode = process.exitCode;

		printDeprecationNotice( {} );

		expect( process.exitCode ).to.equal( exitCode );
	} );

	it( 'uses "process.env" by default', () => {
		vi.stubEnv( 'MRGIT_NO_DEPRECATION_WARNING', '1' );

		printDeprecationNotice();

		expect( consoleErrorSpy ).not.toHaveBeenCalled();

		vi.unstubAllEnvs();
	} );
} );
