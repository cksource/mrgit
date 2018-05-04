/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const fs = require( 'fs' );
const getCwd = require( '../../lib/utils/getcwd' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

describe( 'utils', () => {
	let sandbox;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
	} );

	afterEach( () => {
		sandbox.restore();
	} );
	describe( 'getCwd()', () => {
		it( 'returns "process.cwd()" value if the "mgit.json" has been found', () => {
			sandbox.stub( process, 'cwd' ).returns( '/workspace/ckeditor/ckeditor5' );
			sandbox.stub( fs, 'existsSync' ).returns( true );

			expect( getCwd() ).to.equal( '/workspace/ckeditor/ckeditor5' );
		} );

		it( 'scans dir tree up in order to find "mgit.json" file', () => {
			sandbox.stub( process, 'cwd' ).returns( '/workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/node_modules/@ckeditor' );

			const existsSync = sandbox.stub( fs, 'existsSync' );

			// /workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/node_modules/@ckeditor
			existsSync.onCall( 0 ).returns( false );
			// /workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/node_modules
			existsSync.onCall( 1 ).returns( false );
			// /workspace/ckeditor/ckeditor5/packages/ckeditor5-engine
			existsSync.onCall( 2 ).returns( false );
			// /workspace/ckeditor/ckeditor5/packages
			existsSync.onCall( 3 ).returns( false );
			// /workspace/ckeditor/ckeditor5
			existsSync.onCall( 4 ).returns( true );

			expect( getCwd() ).to.equal( '/workspace/ckeditor/ckeditor5' );

			expect( existsSync.getCall( 0 ).args[ 0 ] ).to.equal(
				'/workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/node_modules/@ckeditor/mgit.json'
			);
			expect( existsSync.getCall( 1 ).args[ 0 ] ).to.equal(
				'/workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/node_modules/mgit.json'
			);
			expect( existsSync.getCall( 2 ).args[ 0 ] ).to.equal( '/workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/mgit.json' );
			expect( existsSync.getCall( 3 ).args[ 0 ] ).to.equal( '/workspace/ckeditor/ckeditor5/packages/mgit.json' );
			expect( existsSync.getCall( 4 ).args[ 0 ] ).to.equal( '/workspace/ckeditor/ckeditor5/mgit.json' );
		} );

		it( 'throws an error if the "mgit.json" cannot be found', () => {
			sandbox.stub( process, 'cwd' ).returns( '/workspace/ckeditor' );
			sandbox.stub( fs, 'existsSync' ).returns( false );

			expect( () => getCwd() ).to.throw( Error, 'Cannot find the "mgit.json" file.' );
		} );
	} );
} );
