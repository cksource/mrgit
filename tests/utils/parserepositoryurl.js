/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
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
				tag: undefined,
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
				tag: undefined,
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
				tag: undefined,
				directory: 'bar'
			} );
		} );

		it( 'extracts all parameters basing on specified "http" URL', () => {
			const repository = parseRepositoryUrl( 'http://github.com/foo/bar.git' );

			expect( repository ).to.deep.equal( {
				url: 'http://github.com/foo/bar.git',
				branch: 'master',
				tag: undefined,
				directory: 'bar'
			} );
		} );

		it( 'extracts all parameters basing on specified "https" URL', () => {
			const repository = parseRepositoryUrl( 'https://github.com/foo/bar.git' );

			expect( repository ).to.deep.equal( {
				url: 'https://github.com/foo/bar.git',
				branch: 'master',
				tag: undefined,
				directory: 'bar'
			} );
		} );

		it( 'extracts all parameters basing on specified "file" (Unix path)', () => {
			const repository = parseRepositoryUrl( 'file:///Users/Workspace/Projects/foo/bar' );

			expect( repository ).to.deep.equal( {
				url: 'file:///Users/Workspace/Projects/foo/bar',
				branch: 'master',
				tag: undefined,
				directory: 'bar'
			} );
		} );

		it( 'extracts all parameters basing on specified "file" (Windows path)', () => {
			const repository = parseRepositoryUrl( 'file://C:/Users/Workspace/Projects/foo/bar' );

			expect( repository ).to.deep.equal( {
				url: 'file://c/Users/Workspace/Projects/foo/bar',
				branch: 'master',
				tag: undefined,
				directory: 'bar'
			} );
		} );

		it( 'extracts all parameters basing on specified "git" URL', () => {
			const repository = parseRepositoryUrl( 'git@github.com:foo/bar.git' );

			expect( repository ).to.deep.equal( {
				url: 'git@github.com:foo/bar.git',
				branch: 'master',
				tag: undefined,
				directory: 'bar'
			} );
		} );

		it( 'allows modifying the branch using hash in the URL', () => {
			const repository = parseRepositoryUrl( 'https://github.com/foo/bar.git#stable' );

			expect( repository ).to.deep.equal( {
				url: 'https://github.com/foo/bar.git',
				branch: 'stable',
				tag: undefined,
				directory: 'bar'
			} );
		} );

		it( 'returns specific tag that contains semantic version number', () => {
			const repository = parseRepositoryUrl( 'foo/bar@v30.0.0', {
				urlTemplate: 'https://github.com/${ path }.git'
			} );

			expect( repository ).to.deep.equal( {
				url: 'https://github.com/foo/bar.git',
				branch: 'master',
				tag: 'v30.0.0',
				directory: 'bar'
			} );
		} );

		it( 'returns specific tag that does not contain semantic version number', () => {
			const repository = parseRepositoryUrl( 'foo/bar@customTagName', {
				urlTemplate: 'https://github.com/${ path }.git'
			} );

			expect( repository ).to.deep.equal( {
				url: 'https://github.com/foo/bar.git',
				branch: 'master',
				tag: 'customTagName',
				directory: 'bar'
			} );
		} );

		it( 'returns the "latest" tag', () => {
			const repository = parseRepositoryUrl( 'foo/bar@latest', {
				urlTemplate: 'https://github.com/${ path }.git'
			} );

			expect( repository ).to.deep.equal( {
				url: 'https://github.com/foo/bar.git',
				branch: 'master',
				tag: 'latest',
				directory: 'bar'
			} );
		} );

		describe( 'baseBranches support (ticket: #103)', () => {
			it( 'returns default branch name if base branches is not specified', () => {
				const repository = parseRepositoryUrl( 'foo/bar', {
					urlTemplate: 'https://github.com/${ path }.git',
					defaultBranch: 'develop',
					tag: undefined,
					cwdPackageBranch: 'master'
				} );

				expect( repository ).to.deep.equal( {
					url: 'https://github.com/foo/bar.git',
					branch: 'develop',
					tag: undefined,
					directory: 'bar'
				} );
			} );

			it( 'returns default branch name if main package is not a git repository', () => {
				const repository = parseRepositoryUrl( 'foo/bar', {
					urlTemplate: 'https://github.com/${ path }.git',
					defaultBranch: 'develop'
				} );

				expect( repository ).to.deep.equal( {
					url: 'https://github.com/foo/bar.git',
					branch: 'develop',
					tag: undefined,
					directory: 'bar'
				} );
			} );

			it( 'returns "master" as default branch if base branches and default branch are not specified', () => {
				const repository = parseRepositoryUrl( 'foo/bar', {
					urlTemplate: 'https://github.com/${ path }.git',
					cwdPackageBranch: 'master'
				} );

				expect( repository ).to.deep.equal( {
					url: 'https://github.com/foo/bar.git',
					branch: 'master',
					tag: undefined,
					directory: 'bar'
				} );
			} );

			it( 'returns default branch name if base branches is an empty array', () => {
				const repository = parseRepositoryUrl( 'foo/bar', {
					urlTemplate: 'https://github.com/${ path }.git',
					defaultBranch: 'develop',
					tag: undefined,
					baseBranches: [],
					cwdPackageBranch: 'master'
				} );

				expect( repository ).to.deep.equal( {
					url: 'https://github.com/foo/bar.git',
					branch: 'develop',
					tag: undefined,
					directory: 'bar'
				} );
			} );

			it( 'returns default branch name if the main repo is not whitelisted in "baseBranches" array', () => {
				const repository = parseRepositoryUrl( 'foo/bar', {
					urlTemplate: 'https://github.com/${ path }.git',
					defaultBranch: 'develop',
					tag: undefined,
					baseBranches: [ 'stable' ],
					cwdPackageBranch: 'master'
				} );

				expect( repository ).to.deep.equal( {
					url: 'https://github.com/foo/bar.git',
					branch: 'develop',
					tag: undefined,
					directory: 'bar'
				} );
			} );

			it( 'returns the "cwdPackageBranch" value if a branch is not specified and the value is whitelisted', () => {
				const repository = parseRepositoryUrl( 'foo/bar', {
					urlTemplate: 'https://github.com/${ path }.git',
					defaultBranch: 'develop',
					tag: undefined,
					baseBranches: [ 'stable', 'master' ],
					cwdPackageBranch: 'stable'
				} );

				expect( repository ).to.deep.equal( {
					url: 'https://github.com/foo/bar.git',
					branch: 'stable',
					tag: undefined,
					directory: 'bar'
				} );
			} );

			it( 'ignores options if a branch is specified in the repository URL', () => {
				const repository = parseRepositoryUrl( 'foo/bar#mrgit', {
					urlTemplate: 'https://github.com/${ path }.git',
					defaultBranch: 'develop',
					tag: undefined,
					baseBranches: [ 'stable' ],
					cwdPackageBranch: 'master'
				} );

				expect( repository ).to.deep.equal( {
					url: 'https://github.com/foo/bar.git',
					branch: 'mrgit',
					tag: undefined,
					directory: 'bar'
				} );
			} );

			it( 'ignores options if a branch is specified in the repository URL ("baseBranches" contains "cwdPackageBranch")', () => {
				const repository = parseRepositoryUrl( 'foo/bar#mrgit', {
					urlTemplate: 'https://github.com/${ path }.git',
					defaultBranch: 'develop',
					tag: undefined,
					baseBranches: [ 'master' ],
					cwdPackageBranch: 'master'
				} );

				expect( repository ).to.deep.equal( {
					url: 'https://github.com/foo/bar.git',
					branch: 'mrgit',
					tag: undefined,
					directory: 'bar'
				} );
			} );
		} );
	} );
} );
