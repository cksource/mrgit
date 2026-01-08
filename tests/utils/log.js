/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, beforeEach, describe, it, expect } from 'vitest';
import { logFactory } from '../../lib/utils/log.js';

describe( 'utils/log', () => {
	describe( 'log()', () => {
		it( 'returns the logger', () => {
			const logger = logFactory();

			expect( logger ).to.be.an( 'object' );
			expect( logger.info ).to.be.a( 'function' );
			expect( logger.error ).to.be.a( 'function' );
			expect( logger.log ).to.be.a( 'function' );
			expect( logger.concat ).to.be.a( 'function' );
			expect( logger.all ).to.be.a( 'function' );
		} );
	} );

	describe( 'logger', () => {
		let logger, logSpy, infoSpy, errorSpy;

		beforeEach( () => {
			logger = logFactory();

			logSpy = vi.spyOn( logger, 'log' );
			infoSpy = vi.spyOn( logger, 'info' );
			errorSpy = vi.spyOn( logger, 'error' );
		} );

		describe( 'info()', () => {
			it( 'calls the log() function with the received message and the type set to "info"', () => {
				logger.info( 'Info message.' );

				expect( logSpy ).toHaveBeenCalledExactlyOnceWith( 'info', 'Info message.' );
			} );
		} );

		describe( 'error()', () => {
			it( 'calls the log() function with the received message and the type set to "error"', () => {
				logger.error( 'Error message.' );

				expect( logSpy ).toHaveBeenCalledExactlyOnceWith( 'error', 'Error message.' );
			} );

			it( 'calls the log() function with the stack trace of the received error and the type set to "error"', () => {
				const errorStack = [
					'-Error: Error message.',
					'-    at foo (path/to/foo.js:10:20)',
					'-    at bar (path/to/bar.js:30:40)'
				].join( '\n' );

				const error = new Error( 'Error message.' );
				error.stack = errorStack;

				logger.error( error );

				expect( logSpy ).toHaveBeenCalledExactlyOnceWith( 'error', errorStack );
			} );
		} );

		describe( 'log()', () => {
			it( 'stores messages of the "info" type', () => {
				expect( logger.all() ).toEqual( {
					error: [],
					info: []
				} );

				logger.log( 'info', 'Info message.' );

				expect( logger.all() ).toEqual( {
					error: [],
					info: [ 'Info message.' ]
				} );
			} );

			it( 'stores messages of the "error" type', () => {
				expect( logger.all() ).toEqual( {
					error: [],
					info: []
				} );

				logger.log( 'error', 'Error message.' );

				expect( logger.all() ).toEqual( {
					error: [ 'Error message.' ],
					info: []
				} );
			} );

			it( 'trims whitespaces from received messages', () => {
				expect( logger.all() ).toEqual( {
					error: [],
					info: []
				} );

				logger.log( 'info', '  Info message.\n ' );

				expect( logger.all() ).toEqual( {
					error: [],
					info: [ 'Info message.' ]
				} );
			} );

			it( 'ignores the "undefined" value passed as the message', () => {
				expect( logger.all() ).toEqual( {
					error: [],
					info: []
				} );

				logger.log( 'info', undefined );

				expect( logger.all() ).toEqual( {
					error: [],
					info: []
				} );
			} );

			it( 'ignores messages consisting of whitespace alone', () => {
				expect( logger.all() ).toEqual( {
					error: [],
					info: []
				} );

				logger.log( 'info', '   ' );

				expect( logger.all() ).toEqual( {
					error: [],
					info: []
				} );
			} );
		} );

		describe( 'concat()', () => {
			it( 'passes messages of the respective types to the info() and error() functions', () => {
				logger.concat( {
					info: [ 'Info message 1.', 'Info message 2.' ],
					error: [ 'Error message 1.', 'Error message 2.' ]
				} );

				expect( infoSpy ).toHaveBeenCalledTimes( 2 );
				expect( infoSpy ).toHaveBeenNthCalledWith( 1, 'Info message 1.' );
				expect( infoSpy ).toHaveBeenNthCalledWith( 2, 'Info message 2.' );

				expect( errorSpy ).toHaveBeenCalledTimes( 2 );
				expect( errorSpy ).toHaveBeenNthCalledWith( 1, 'Error message 1.' );
				expect( errorSpy ).toHaveBeenNthCalledWith( 2, 'Error message 2.' );
			} );
		} );

		describe( 'all()', () => {
			it( 'returns all stored messages', () => {
				logger.concat( {
					info: [ 'Info message 1.', 'Info message 2.' ],
					error: [ 'Error message 1.', 'Error message 2.' ]
				} );

				expect( logger.all() ).toEqual( {
					info: [ 'Info message 1.', 'Info message 2.' ],
					error: [ 'Error message 1.', 'Error message 2.' ]
				} );
			} );
		} );
	} );
} );
