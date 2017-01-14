/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const repositoryResolver = require( '../../lib/utils/default-repository-resolver' );
const expect = require( 'chai' ).expect;
const cwd = require( 'path' ).resolve( __dirname, '..', 'fixtures', 'project-a' );

describe( 'utils', () => {
	describe( 'default repositoryResolver()', () => {
		it( 'returns undefined if package was not defined', () => {
			expect( repositoryResolver( '404', cwd ) ).to.equal( null );
		} );

		it( 'returns Git over SSH URL', () => {
			expect( repositoryResolver( 'foo', cwd ) ).to.deep.equal( {
				url: 'git@github.com:a/b.git',
				branch: 'master'
			} );
		} );

		it( 'returns Git over SSH URL with branch name', () => {
			expect( repositoryResolver( 'bar', cwd ) ).to.deep.equal( {
				url: 'git@github.com:a/b.git',
				branch: 'dev'
			} );
		} );

		it( 'returns Git over SSH URL for a scoped package', () => {
			expect( repositoryResolver( '@foo/bar', cwd ) ).to.deep.equal( {
				url: 'git@github.com:c/d.git',
				branch: 'master'
			} );
		} );
	} );
} );
