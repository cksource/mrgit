/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const expect = require( 'chai' ).expect;

describe( 'commands/checkout', () => {
	let checkoutCommand, stubs, data;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			execCommand: {
				execute: sinon.stub()
			}
		};

		data = {
			repository: {
				branch: 'master'
			}
		};

		mockery.registerMock( './exec', stubs.execCommand );

		checkoutCommand = require( '../../lib/commands/checkout' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.disable();
	} );

	describe( 'execute()', () => {
		it( 'rejects promise if called command returned an error', () => {
			const error = new Error( 'Unexpected error.' );

			stubs.execCommand.execute.rejects( {
				logs: {
					error: [ error.stack ]
				}
			} );

			return checkoutCommand.execute( data )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).to.equal( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'checkouts to the correct branch', () => {
			stubs.execCommand.execute.resolves( {
				logs: {
					info: [ 'Already on \'master\'\nYour branch is up-to-date with \'origin/master\'.' ]
				}
			} );

			return checkoutCommand.execute( data )
				.then( commandResponse => {
					expect( stubs.execCommand.execute.calledOnce ).to.equal( true );
					expect( stubs.execCommand.execute.firstCall.args[ 0 ] ).to.deep.equal( {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git checkout master' ]
					} );

					expect( commandResponse.logs.info[ 0 ] ).to.equal(
						'Your branch is up-to-date with \'origin/master\'.'
					);
				} );
		} );
	} );
} );
