/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const fs = require( 'fs' );
const getCwd = require( '../../lib/utils/getcwd' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

describe( 'utils', () => {
	afterEach( () => {
		sinon.restore();
	} );

	describe( 'getCwd()', () => {
		it( 'returns "process.cwd()" value if the "mrgit.json" has been found', () => {
			sinon.stub( process, 'cwd' ).returns( '/workspace/ckeditor/ckeditor5' );
			sinon.stub( fs, 'existsSync' ).returns( true );

			expect( getCwd( 'mrgit.json' ) ).to.equal( '/workspace/ckeditor/ckeditor5' );
		} );

		it( 'returns a path to the "mrgit.json" when custom working directory is provided', () => {
			sinon.stub( fs, 'existsSync' ).returns( true );

			expect( getCwd( 'mrgit.json', '/another-workspace/ckeditor/ckeditor5' ) ).to.equal( '/another-workspace/ckeditor/ckeditor5' );
		} );

		it( 'scans dir tree up in order to find configuration file', () => {
			sinon.stub( process, 'cwd' ).returns( '/workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/node_modules/@ckeditor' );

			const existsSync = sinon.stub( fs, 'existsSync' );

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

			expect( getCwd( 'mrgit-custom.json' ) ).to.equal( '/workspace/ckeditor/ckeditor5' );

			expect( existsSync.getCall( 0 ).args[ 0 ] ).to.equal(
				'/workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/node_modules/@ckeditor/mrgit-custom.json'
			);
			expect( existsSync.getCall( 1 ).args[ 0 ] ).to.equal(
				'/workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/node_modules/mrgit-custom.json'
			);
			expect( existsSync.getCall( 2 ).args[ 0 ] ).to.equal(
				'/workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/mrgit-custom.json'
			);
			expect( existsSync.getCall( 3 ).args[ 0 ] ).to.equal( '/workspace/ckeditor/ckeditor5/packages/mrgit-custom.json' );
			expect( existsSync.getCall( 4 ).args[ 0 ] ).to.equal( '/workspace/ckeditor/ckeditor5/mrgit-custom.json' );
		} );

		it( 'throws an error if the configuration file cannot be found', () => {
			sinon.stub( process, 'cwd' ).returns( '/workspace/ckeditor' );
			sinon.stub( fs, 'existsSync' ).returns( false );

			expect( () => getCwd( 'mrgit.json' ) ).to.throw( Error, 'Cannot find the configuration file.' );
		} );
	} );
} );
