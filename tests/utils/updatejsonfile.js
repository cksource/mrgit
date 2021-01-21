/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const updateJsonFile = require( '../../lib/utils/updatejsonfile' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

describe( 'utils', () => {
	afterEach( () => {
		sinon.restore();
	} );

	describe( 'updateJsonFile()', () => {
		it( 'should read, update and save JSON file', () => {
			const path = 'path/to/file.json';
			const fs = require( 'fs' );
			const readFileStub = sinon.stub( fs, 'readFileSync' ).callsFake( () => '{}' );
			const modifiedJSON = { modified: true };
			const writeFileStub = sinon.stub( fs, 'writeFileSync' );

			updateJsonFile( path, () => {
				return modifiedJSON;
			} );

			expect( readFileStub.calledOnce ).to.equal( true );
			expect( readFileStub.firstCall.args[ 0 ] ).to.equal( path );
			expect( writeFileStub.calledOnce ).to.equal( true );
			expect( writeFileStub.firstCall.args[ 0 ] ).to.equal( path );
			expect( writeFileStub.firstCall.args[ 1 ] ).to.equal( JSON.stringify( modifiedJSON, null, 2 ) + '\n' );
		} );
	} );
} );
