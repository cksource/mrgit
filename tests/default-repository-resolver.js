/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const repositoryResolver = require( '../lib/default-repository-resolver' );
const expect = require( 'chai' ).expect;
const cwd = require( 'path' ).resolve( __dirname, 'fixtures', 'project-a' );

describe( 'utils', () => {
	describe( 'default repositoryResolver()', () => {
		it( 'returns undefined if package was not defined', () => {
			expect( repositoryResolver( '404', cwd ) ).to.equal( null );
		} );

		it( 'returns Git over SSH URL', () => {
			expect( repositoryResolver( 'simple-package', cwd ) ).to.deep.equal( {
				url: 'git@github.com:a/b.git',
				branch: 'master',
				directory: 'b'
			} );
		} );

		it( 'returns Git over SSH URL with branch name', () => {
			expect( repositoryResolver( 'package-with-branch', cwd ) ).to.deep.equal( {
				url: 'git@github.com:a/b.git',
				branch: 'dev',
				directory: 'b'
			} );
		} );

		it( 'returns Git over SSH URL for a scoped package', () => {
			expect( repositoryResolver( '@scoped/package', cwd ) ).to.deep.equal( {
				url: 'git@github.com:c/d.git',
				branch: 'master',
				directory: 'd'
			} );
		} );

		it( 'returns original URL if git URL is specified', () => {
			expect( repositoryResolver( 'full-url-git', cwd ) ).to.deep.equal( {
				url: 'git@github.com:cksource/mgit2.git',
				branch: 'master',
				directory: 'mgit2'
			} );
		} );

		it( 'returns original URL and branch if git URL is specified', () => {
			expect( repositoryResolver( 'full-url-git-with-branch', cwd ) ).to.deep.equal( {
				url: 'git@github.com:cksource/mgit2.git',
				branch: 'xyz',
				directory: 'mgit2'
			} );
		} );

		it( 'returns original URL if HTTPS URL is specified', () => {
			expect( repositoryResolver( 'full-url-https', cwd ) ).to.deep.equal( {
				url: 'https://github.com/cksource/mgit2.git',
				branch: 'master',
				directory: 'mgit2'
			} );
		} );
	} );
} );
