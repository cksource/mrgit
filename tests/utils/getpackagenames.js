/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const getPackageNames = require( '../../lib/utils/getpackagenames' );
const expect = require( 'chai' ).expect;

describe( 'utils', () => {
	describe( 'getPackageNames()', () => {
		it( 'returns specified packages', () => {
			const dependencies = {
				'@ckeditor/ckeditor5-core': '*',
				'@ckeditor/ckeditor5-engine': '*',
				'@ckeditor/ckeditor5-utils': '*'
			};

			const packages = getPackageNames( { dependencies } );

			expect( packages ).to.deep.equal( Object.keys( dependencies ) );
		} );

		it( 'returns specified packages which matches to specified pattern (scope)', () => {
			const dependencies = {
				'@ckeditor/ckeditor5-core': '*',
				'@ckeditor/ckeditor5-engine': '*',
				'@ckeditor/ckeditor5-editor-classic': '*',
				'@ckeditor/ckeditor5-editor-inline': '*',
				'@ckeditor/ckeditor5-utils': '*'
			};

			const packages = getPackageNames( {
				dependencies,
				scope: 'ckeditor5-editor-*'
			} );

			expect( packages ).to.deep.equal( [
				'@ckeditor/ckeditor5-editor-classic',
				'@ckeditor/ckeditor5-editor-inline'
			] );
		} );

		it( 'returns specified packages which matches to specified pattern (ignore)', () => {
			const dependencies = {
				'@ckeditor/ckeditor5-core': '*',
				'@ckeditor/ckeditor5-engine': '*',
				'@ckeditor/ckeditor5-editor-classic': '*',
				'@ckeditor/ckeditor5-editor-inline': '*',
				'@ckeditor/ckeditor5-utils': '*'
			};

			const packages = getPackageNames( {
				dependencies,
				ignore: 'ckeditor5-e*'
			} );

			expect( packages ).to.deep.equal( [
				'@ckeditor/ckeditor5-core',
				'@ckeditor/ckeditor5-utils'
			] );
		} );

		it( 'returns specified packages which matches to specified patterns (scope and ignore)', () => {
			const dependencies = {
				'@ckeditor/ckeditor5-engine': '*',
				'@ckeditor/ckeditor5-editor-classic': '*',
				'@ckeditor/ckeditor5-editor-inline': '*',
				'@ckeditor/ckeditor5-utils': '*'
			};

			const packages = getPackageNames( {
				dependencies,
				scope: 'ckeditor5-editor-*',
				ignore: 'ckeditor5-*-inline'
			} );

			expect( packages ).to.deep.equal( [
				'@ckeditor/ckeditor5-editor-classic',
			] );
		} );
	} );
} );
