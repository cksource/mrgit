/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const resolver = require( '../lib/default-resolver' );
const getOptions = require( '../lib/utils/getoptions' );
const expect = require( 'chai' ).expect;
const cwd = require( 'upath' ).resolve( __dirname, 'fixtures', 'project-a' );

describe( 'default resolver()', () => {
	describe( 'with default options', () => {
		const options = getOptions( {}, cwd );

		it( 'returns undefined if package was not defined', () => {
			expect( resolver( '404', options ) ).to.equal( null );
		} );

		it( 'returns Git over SSH URL', () => {
			expect( resolver( 'simple-package', options ) ).to.deep.equal( {
				url: 'git@github.com:a/b.git',
				branch: 'master',
				tag: undefined,
				directory: 'b'
			} );
		} );

		it( 'returns Git over SSH URL with branch name', () => {
			expect( resolver( 'package-with-branch', options ) ).to.deep.equal( {
				url: 'git@github.com:a/b.git',
				branch: 'dev',
				tag: undefined,
				directory: 'b'
			} );
		} );

		it( 'returns Git over SSH URL for a scoped package', () => {
			expect( resolver( '@scoped/package', options ) ).to.deep.equal( {
				url: 'git@github.com:c/d.git',
				branch: 'master',
				tag: undefined,
				directory: 'd'
			} );
		} );

		it( 'returns original URL if git URL is specified', () => {
			expect( resolver( 'full-url-git', options ) ).to.deep.equal( {
				url: 'git@github.com:cksource/mrgit.git',
				branch: 'master',
				tag: undefined,
				directory: 'mrgit'
			} );
		} );

		it( 'returns original URL and branch if git URL is specified', () => {
			expect( resolver( 'full-url-git-with-branch', options ) ).to.deep.equal( {
				url: 'git@github.com:cksource/mrgit.git',
				branch: 'xyz',
				tag: undefined,
				directory: 'mrgit'
			} );
		} );

		it( 'returns original URL if HTTPS URL is specified', () => {
			expect( resolver( 'full-url-https', options ) ).to.deep.equal( {
				url: 'https://github.com/cksource/mrgit.git',
				branch: 'master',
				tag: undefined,
				directory: 'mrgit'
			} );
		} );

		it( 'returns specific tag', () => {
			expect( resolver( 'package-with-specific-tag', options ) ).to.deep.equal( {
				url: 'git@github.com:a/b.git',
				branch: 'master',
				tag: 'v30.0.0',
				directory: 'b'
			} );
		} );

		it( 'returns the "latest" tag', () => {
			expect( resolver( 'package-with-latest-tag', options ) ).to.deep.equal( {
				url: 'git@github.com:a/b.git',
				branch: 'master',
				tag: 'latest',
				directory: 'b'
			} );
		} );
	} );

	describe( 'with options.resolverUrlTempalate', () => {
		const options = getOptions( {
			resolverUrlTemplate: 'custom@path:${ path }.git'
		}, cwd );

		it( 'uses the template if short dependency path was used', () => {
			expect( resolver( 'simple-package', options ) ).to.deep.equal( {
				url: 'custom@path:a/b.git',
				branch: 'master',
				tag: undefined,
				directory: 'b'
			} );
		} );

		it( 'returns original URL if git URL is specified', () => {
			expect( resolver( 'full-url-git', options ) ).to.deep.equal( {
				url: 'git@github.com:cksource/mrgit.git',
				branch: 'master',
				tag: undefined,
				directory: 'mrgit'
			} );
		} );
	} );

	describe( 'with options.resolverDefaultBranch', () => {
		const options = getOptions( {
			resolverDefaultBranch: 'major'
		}, cwd );

		it( 'returns the default branch if dependency URL does not specify it (simple package)', () => {
			expect( resolver( 'simple-package', options ) ).to.deep.equal( {
				url: 'git@github.com:a/b.git',
				branch: 'major',
				tag: undefined,
				directory: 'b'
			} );
		} );

		it( 'returns the default branch if dependency URL does not specify it (package with branch)', () => {
			expect( resolver( 'package-with-branch', options ) ).to.deep.equal( {
				url: 'git@github.com:a/b.git',
				branch: 'dev',
				tag: undefined,
				directory: 'b'
			} );
		} );
	} );

	describe( 'with options.resolverTargetDirectory', () => {
		const options = getOptions( {
			resolverTargetDirectory: 'npm'
		}, cwd );

		it( 'returns package name as directory for non-scoped package', () => {
			expect( resolver( 'simple-package', options ) ).to.deep.equal( {
				url: 'git@github.com:a/b.git',
				branch: 'master',
				tag: undefined,
				directory: 'simple-package'
			} );
		} );

		it( 'returns package name as directory for scoped package', () => {
			expect( resolver( '@scoped/package', options ) ).to.deep.equal( {
				url: 'git@github.com:c/d.git',
				branch: 'master',
				tag: undefined,
				directory: '@scoped/package'
			} );
		} );
	} );

	describe( 'with options.overrideDirectoryNames', () => {
		it( 'returns package with modified directory', () => {
			const options = getOptions( {}, cwd );

			expect( resolver( 'override-directory', options ) ).to.deep.equal( {
				url: 'git@github.com:foo/bar.git',
				branch: 'master',
				tag: undefined,
				directory: 'custom-directory'
			} );
		} );

		it( 'ignores modified directory if "resolverTargetDirectory" is set to "npm"', () => {
			const options = getOptions( {
				resolverTargetDirectory: 'npm'
			}, cwd );

			expect( resolver( 'override-directory', options ) ).to.deep.equal( {
				url: 'git@github.com:foo/bar.git',
				branch: 'master',
				tag: undefined,
				directory: 'override-directory'
			} );
		} );
	} );
} );
