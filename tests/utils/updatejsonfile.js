/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const updateJsonFile = require( '../../lib/utils/updatejsonfile' );
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
	describe( 'updateJsonFile()', () => {
		it( 'should read, update and save JSON file', () => {
			const path = 'path/to/file.json';
			const fs = require( 'fs' );
			const readFileStub = sandbox.stub( fs, 'readFileSync' ).callsFake( () => '{}' );
			const modifiedJSON = { modified: true };
			const writeFileStub = sandbox.stub( fs, 'writeFileSync' );

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
