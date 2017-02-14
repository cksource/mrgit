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
				expect( logger.all ).to.be.a( 'function' );
				expect( logger.concat ).to.be.a( 'function' );
				expect( logger.getLastInserted ).to.be.a( 'function' );
			} );

			it( 'returns all collected logs', () => {
				const logs = logger.all();

				expect( logs.info ).be.an( 'array' );
				expect( logs.error ).be.an( 'array' );
			} );

			it( 'logs an "info" message', () => {
				logger.info( 'Test.' );

				expect( logger.all().info ).to.deep.equal( [ 'Test.' ] );
			} );

			it( 'logs an "error" message', () => {
				logger.error( 'Test.' );

				expect( logger.all().error ).to.deep.equal( [ 'Test.' ] );
			} );

			it( 'returns last inserted log', () => {
				logger.info( 'Info Test.' );

				expect( logger.getLastInserted() ).to.equal( 'Info Test.' );

				logger.info( 'Error Test.' );

				expect( logger.getLastInserted() ).to.equal( 'Error Test.' );
			} );

			it( 'merges logs from other logger', () => {
				const otherLogger = getLogger();

				otherLogger.info( 'Other Logger 1.' );
				otherLogger.info( 'Other Logger 2.' );
				otherLogger.error( 'Other Logger 3.' );

				logger.info( 'Logger 1.' );
				logger.error( 'Logger 2.' );

				logger.concat( otherLogger.all() );

				const logs = logger.all();

				expect( logs.info ).to.deep.equal( [
					'Logger 1.',
					'Other Logger 1.',
					'Other Logger 2.'
				] );

				expect( logs.error ).to.deep.equal( [
					'Logger 2.',
					'Other Logger 3.'
				] );
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
