/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
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

			const command = { name: 'sync' };

			const packages = getPackageNames( { dependencies }, command );

			expect( packages ).to.deep.equal( Object.keys( dependencies ) );
		} );

		it( 'returns specified packages which match to specified pattern (scope)', () => {
			const dependencies = {
				'@ckeditor/ckeditor5-core': '*',
				'@ckeditor/ckeditor5-engine': '*',
				'@ckeditor/ckeditor5-editor-classic': '*',
				'@ckeditor/ckeditor5-editor-inline': '*',
				'@ckeditor/ckeditor5-utils': '*'
			};

			const command = { name: 'sync' };

			const packages = getPackageNames( {
				dependencies,
				scope: 'ckeditor5-editor-*'
			}, command );

			expect( packages ).to.deep.equal( [
				'@ckeditor/ckeditor5-editor-classic',
				'@ckeditor/ckeditor5-editor-inline'
			] );
		} );

		it( 'returns specified packages which match to specified pattern (ignore)', () => {
			const dependencies = {
				'@ckeditor/ckeditor5-core': '*',
				'@ckeditor/ckeditor5-engine': '*',
				'@ckeditor/ckeditor5-editor-classic': '*',
				'@ckeditor/ckeditor5-editor-inline': '*',
				'@ckeditor/ckeditor5-utils': '*'
			};

			const command = { name: 'sync' };

			const packages = getPackageNames( {
				dependencies,
				ignore: 'ckeditor5-e*'
			}, command );

			expect( packages ).to.deep.equal( [
				'@ckeditor/ckeditor5-core',
				'@ckeditor/ckeditor5-utils'
			] );
		} );

		it( 'returns specified packages which match to specified patterns (scope and ignore)', () => {
			const dependencies = {
				'@ckeditor/ckeditor5-engine': '*',
				'@ckeditor/ckeditor5-editor-classic': '*',
				'@ckeditor/ckeditor5-editor-inline': '*',
				'@ckeditor/ckeditor5-utils': '*'
			};

			const command = { name: 'sync' };

			const packages = getPackageNames( {
				dependencies,
				scope: 'ckeditor5-editor-*',
				ignore: 'ckeditor5-*-inline'
			}, command );

			expect( packages ).to.deep.equal( [
				'@ckeditor/ckeditor5-editor-classic'
			] );
		} );

		it( 'returns root package name', () => {
			const dependencies = {
				'@ckeditor/ckeditor5-core': '*',
				'@ckeditor/ckeditor5-engine': '*',
				'@ckeditor/ckeditor5-utils': '*'
			};

			const command = { name: 'sync' };

			const packages = getPackageNames( {
				dependencies,
				$rootRepository: 'rootOwner/rootName'
			}, command );

			expect( packages ).to.deep.equal( [ '$rootName', ...Object.keys( dependencies ) ] );
		} );
	} );
} );
