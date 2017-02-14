/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const getLogger = require( '../../lib/utils/getlogger' );

describe( 'utils', () => {
	describe( 'getLogger()', () => {
		it( 'allows creating a new logger', () => {
			expect( getLogger ).to.be.a( 'function' );
		} );

		describe( 'logger', () => {
			let logger;

			beforeEach( () => {
				logger = getLogger();
			} );

			it( 'allows collecting the messages', () => {
				expect( logger.info ).to.be.a( 'function' );
				expect( logger.error ).to.be.a( 'function' );
				expect( logger.getAll ).to.be.a( 'function' );
				expect( logger.getLastInserted ).to.be.a( 'function' );
			} );

			it( 'returns all collected logs', () => {
				const logs = logger.getAll();

				expect( logs.info ).be.an( 'array' );
				expect( logs.error ).be.an( 'array' );
			} );

			it( 'logs an "info" message', () => {
				logger.info( 'Test.' );

				expect( logger.getAll().info ).to.deep.equal( [ 'Test.' ] );
			} );

			it( 'logs an "error" message', () => {
				logger.error( 'Test.' );

				expect( logger.getAll().error ).to.deep.equal( [ 'Test.' ] );
			} );

			it( 'returns last inserted log', () => {
				logger.info( 'Info Test.' );

				expect( logger.getLastInserted() ).to.equal( 'Info Test.' );

				logger.info( 'Error Test.' );

				expect( logger.getLastInserted() ).to.equal( 'Error Test.' );
			} );

			it( 'does not log an empty message', () => {
				logger.info( null );

				expect( logger.getLastInserted() ).to.equal( undefined );

				logger.info( ' ' );

				expect( logger.getLastInserted() ).to.equal( undefined );
			} );
		} );
	} );
} );
