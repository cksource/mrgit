/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;

describe( 'utils/log', () => {
	let log, stubs;

	beforeEach( () => {
		log = require( '../../lib/utils/log' );

		stubs = {
			info: sinon.stub(),
			error: sinon.stub(),
			log: sinon.stub()
		};
	} );

	afterEach( () => {
		sinon.restore();
	} );

	describe( 'log()', () => {
		it( 'returns the logger', () => {
			const logger = log();

			expect( logger ).to.be.an( 'object' );
			expect( logger.info ).to.be.a( 'function' );
			expect( logger.error ).to.be.a( 'function' );
			expect( logger.log ).to.be.a( 'function' );
			expect( logger.concat ).to.be.a( 'function' );
			expect( logger.all ).to.be.a( 'function' );
		} );
	} );

	describe( 'logger', () => {
		let logger;

		beforeEach( () => {
			logger = log();
		} );

		describe( 'info()', () => {
			it( 'calls the log() function with the received message and the type set to "info"', () => {
				logger.log = stubs.log;

				logger.info( 'Info message.' );

				expect( stubs.log.callCount ).to.equal( 1 );
				expect( stubs.log.getCall( 0 ).args[ 0 ] ).to.equal( 'info' );
				expect( stubs.log.getCall( 0 ).args[ 1 ] ).to.equal( 'Info message.' );
			} );
		} );

		describe( 'error()', () => {
			it( 'calls the log() function with the received message and the type set to "error"', () => {
				logger.log = stubs.log;

				logger.error( 'Error message.' );

				expect( stubs.log.callCount ).to.equal( 1 );
				expect( stubs.log.getCall( 0 ).args[ 0 ] ).to.equal( 'error' );
				expect( stubs.log.getCall( 0 ).args[ 1 ] ).to.equal( 'Error message.' );
			} );

			it( 'calls the log() function with the stack trace of the received error and the type set to "error"', () => {
				logger.log = stubs.log;

				const errorStack = [
					'-Error: Error message.',
					'-    at foo (path/to/foo.js:10:20)',
					'-    at bar (path/to/bar.js:30:40)'
				].join( '\n' );

				const error = new Error( 'Error message.' );
				error.stack = errorStack;

				logger.error( error );

				expect( stubs.log.callCount ).to.equal( 1 );
				expect( stubs.log.getCall( 0 ).args[ 0 ] ).to.equal( 'error' );
				expect( stubs.log.getCall( 0 ).args[ 1 ] ).to.equal( errorStack );
			} );
		} );

		describe( 'log()', () => {
			it( 'stores messages of the "info" type', () => {
				expect( logger.all() ).to.deep.equal( {
					error: [],
					info: []
				} );

				logger.log( 'info', 'Info message.' );

				expect( logger.all() ).to.deep.equal( {
					error: [],
					info: [ 'Info message.' ]
				} );
			} );

			it( 'stores messages of the "error" type', () => {
				expect( logger.all() ).to.deep.equal( {
					error: [],
					info: []
				} );

				logger.log( 'error', 'Error message.' );

				expect( logger.all() ).to.deep.equal( {
					error: [ 'Error message.' ],
					info: []
				} );
			} );

			it( 'trims whitespaces from received messages', () => {
				expect( logger.all() ).to.deep.equal( {
					error: [],
					info: []
				} );

				logger.log( 'info', '  Info message.\n ' );

				expect( logger.all() ).to.deep.equal( {
					error: [],
					info: [ 'Info message.' ]
				} );
			} );

			it( 'ignores the "undefined" value passed as the message', () => {
				expect( logger.all() ).to.deep.equal( {
					error: [],
					info: []
				} );

				logger.log( 'info', undefined );

				expect( logger.all() ).to.deep.equal( {
					error: [],
					info: []
				} );
			} );

			it( 'ignores messages consisting of whitespace alone', () => {
				expect( logger.all() ).to.deep.equal( {
					error: [],
					info: []
				} );

				logger.log( 'info', '   ' );

				expect( logger.all() ).to.deep.equal( {
					error: [],
					info: []
				} );
			} );
		} );

		describe( 'concat()', () => {
			it( 'passes messages of the respective types to the info() and error() functions', () => {
				logger.info = stubs.info;
				logger.error = stubs.error;

				logger.concat( {
					info: [ 'Info message 1.', 'Info message 2.' ],
					error: [ 'Error message 1.', 'Error message 2.' ]
				} );

				expect( stubs.info.callCount ).to.equal( 2 );
				expect( stubs.info.getCall( 0 ).args[ 0 ] ).to.equal( 'Info message 1.' );
				expect( stubs.info.getCall( 1 ).args[ 0 ] ).to.equal( 'Info message 2.' );

				expect( stubs.error.callCount ).to.equal( 2 );
				expect( stubs.error.getCall( 0 ).args[ 0 ] ).to.equal( 'Error message 1.' );
				expect( stubs.error.getCall( 1 ).args[ 0 ] ).to.equal( 'Error message 2.' );
			} );
		} );

		describe( 'all()', () => {
			it( 'returns all stored messages', () => {
				logger.concat( {
					info: [ 'Info message 1.', 'Info message 2.' ],
					error: [ 'Error message 1.', 'Error message 2.' ]
				} );

				expect( logger.all() ).to.deep.equal( {
					info: [ 'Info message 1.', 'Info message 2.' ],
					error: [ 'Error message 1.', 'Error message 2.' ]
				} );
			} );
		} );
	} );
} );
