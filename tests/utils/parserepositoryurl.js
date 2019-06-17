/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const parseRepositoryUrl = require( '../../lib/utils/parserepositoryurl' );

describe( 'utils', () => {
	describe( 'parseRepositoryUrl()', () => {
		it( 'returns "master" branch if "options.defaultBranch" was not specified', () => {
			const repository = parseRepositoryUrl( 'foo/bar', {
				urlTemplate: 'https://github.com/${ path }.git'
			} );

			expect( repository ).to.deep.equal( {
				url: 'https://github.com/foo/bar.git',
				branch: 'master',
				directory: 'bar'
			} );
		} );

		it( 'allows modifying the branch using hash in "<organization>/<repositoryName>" template', () => {
			const repository = parseRepositoryUrl( 'foo/bar#stable', {
				urlTemplate: 'https://github.com/${ path }.git'
			} );

			expect( repository ).to.deep.equal( {
				url: 'https://github.com/foo/bar.git',
				branch: 'stable',
				directory: 'bar'
			} );
		} );

		it( 'ignores "options.defaultBranch" if branch is defined in specified repository', () => {
			const repository = parseRepositoryUrl( 'foo/bar#stable', {
				urlTemplate: 'https://github.com/${ path }.git',
				defaultBranch: 'master'
			} );

			expect( repository ).to.deep.equal( {
				url: 'https://github.com/foo/bar.git',
				branch: 'stable',
				directory: 'bar'
			} );
		} );

		it( 'extracts all parameters basing on specified "http" URL', () => {
			const repository = parseRepositoryUrl( 'http://github.com/foo/bar.git' );

			expect( repository ).to.deep.equal( {
				url: 'http://github.com/foo/bar.git',
				branch: 'master',
				directory: 'bar'
			} );
		} );

		it( 'extracts all parameters basing on specified "https" URL', () => {
			const repository = parseRepositoryUrl( 'https://github.com/foo/bar.git' );

			expect( repository ).to.deep.equal( {
				url: 'https://github.com/foo/bar.git',
				branch: 'master',
				directory: 'bar'
			} );
		} );

		it( 'extracts all parameters basing on specified "file" (Unix path)', () => {
			const repository = parseRepositoryUrl( 'file:///Users/Workspace/Projects/foo/bar' );

			expect( repository ).to.deep.equal( {
				url: 'file:///Users/Workspace/Projects/foo/bar',
				branch: 'master',
				directory: 'bar'
			} );
		} );

		it( 'extracts all parameters basing on specified "file" (Windows path)', () => {
			const repository = parseRepositoryUrl( 'file://C:/Users/Workspace/Projects/foo/bar' );

			expect( repository ).to.deep.equal( {
				url: 'file://c/Users/Workspace/Projects/foo/bar',
				branch: 'master',
				directory: 'bar'
			} );
		} );

		it( 'extracts all parameters basing on specified "git" URL', () => {
			const repository = parseRepositoryUrl( 'git@github.com:foo/bar.git' );

			expect( repository ).to.deep.equal( {
				url: 'git@github.com:foo/bar.git',
				branch: 'master',
				directory: 'bar'
			} );
		} );

		it( 'allows modifying the branch using hash in the URL', () => {
			const repository = parseRepositoryUrl( 'https://github.com/foo/bar.git#stable' );

			expect( repository ).to.deep.equal( {
				url: 'https://github.com/foo/bar.git',
				branch: 'stable',
				directory: 'bar'
			} );
		} );
	} );
} );
