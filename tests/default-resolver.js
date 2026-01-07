/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, it, expect } from 'vitest';
import { getOptions } from '../lib/utils/getoptions.js';
import resolver from '../lib/default-resolver.js';
import upath from 'upath';

const cwd = upath.resolve( import.meta.dirname, 'fixtures', 'project-a' );

describe( 'default resolver()', () => {
	let options;

	beforeEach( async () => {
		options = await getOptions( {}, cwd );
	} );

	describe( 'with default options', () => {
		it( 'returns undefined if package was not defined', async () => {
			expect( resolver( '404', options ) ).toEqual( null );
		} );

		it( 'returns Git over SSH URL', async () => {
			expect( resolver( 'simple-package', options ) ).toEqual( {
				url: 'git@github.com:a/b.git',
				branch: 'master',
				tag: undefined,
				directory: 'b'
			} );
		} );

		it( 'returns Git over SSH URL with branch name', async () => {
			expect( resolver( 'package-with-branch', options ) ).toEqual( {
				url: 'git@github.com:a/b.git',
				branch: 'dev',
				tag: undefined,
				directory: 'b'
			} );
		} );

		it( 'returns Git over SSH URL for a scoped package', async () => {
			expect( resolver( '@scoped/package', options ) ).toEqual( {
				url: 'git@github.com:c/d.git',
				branch: 'master',
				tag: undefined,
				directory: 'd'
			} );
		} );

		it( 'returns original URL if git URL is specified', async () => {
			expect( resolver( 'full-url-git', options ) ).toEqual( {
				url: 'git@github.com:cksource/mrgit.git',
				branch: 'master',
				tag: undefined,
				directory: 'mrgit'
			} );
		} );

		it( 'returns original URL and branch if git URL is specified', async () => {
			expect( resolver( 'full-url-git-with-branch', options ) ).toEqual( {
				url: 'git@github.com:cksource/mrgit.git',
				branch: 'xyz',
				tag: undefined,
				directory: 'mrgit'
			} );
		} );

		it( 'returns original URL if HTTPS URL is specified', async () => {
			expect( resolver( 'full-url-https', options ) ).toEqual( {
				url: 'https://github.com/cksource/mrgit.git',
				branch: 'master',
				tag: undefined,
				directory: 'mrgit'
			} );
		} );

		it( 'returns specific tag', async () => {
			expect( resolver( 'package-with-specific-tag', options ) ).toEqual( {
				url: 'git@github.com:a/b.git',
				branch: 'master',
				tag: 'v30.0.0',
				directory: 'b'
			} );
		} );

		it( 'returns the "latest" tag', async () => {
			expect( resolver( 'package-with-latest-tag', options ) ).toEqual( {
				url: 'git@github.com:a/b.git',
				branch: 'master',
				tag: 'latest',
				directory: 'b'
			} );
		} );

		it( 'ignores "$rootRepository" if "isRootRepository" argument is not set to true', async () => {
			options = await getOptions( { $rootRepository: 'rootOwner/rootName' }, cwd );

			expect( resolver( 'simple-package', options ) ).toEqual( {
				url: 'git@github.com:a/b.git',
				branch: 'master',
				tag: undefined,
				directory: 'b'
			} );
		} );

		it( 'utilizes "$rootRepository" if "isRootRepository" argument is set to true', async () => {
			options = await getOptions( { $rootRepository: 'rootOwner/rootName' }, cwd );

			expect( resolver( 'simple-package', options, true ) ).toEqual( {
				url: 'git@github.com:rootOwner/rootName.git',
				branch: 'master',
				tag: undefined,
				directory: 'rootName'
			} );
		} );
	} );

	describe( 'with options.resolverUrlTempalate', async () => {
		const options = await getOptions( {
			resolverUrlTemplate: 'custom@path:${ path }.git'
		}, cwd );

		it( 'uses the template if short dependency path was used', async () => {
			expect( resolver( 'simple-package', options ) ).toEqual( {
				url: 'custom@path:a/b.git',
				branch: 'master',
				tag: undefined,
				directory: 'b'
			} );
		} );

		it( 'returns original URL if git URL is specified', async () => {
			expect( resolver( 'full-url-git', options ) ).toEqual( {
				url: 'git@github.com:cksource/mrgit.git',
				branch: 'master',
				tag: undefined,
				directory: 'mrgit'
			} );
		} );
	} );

	describe( 'with options.resolverDefaultBranch', async () => {
		const options = await getOptions( {
			resolverDefaultBranch: 'major'
		}, cwd );

		it( 'returns the default branch if dependency URL does not specify it (simple package)', async () => {
			expect( resolver( 'simple-package', options ) ).toEqual( {
				url: 'git@github.com:a/b.git',
				branch: 'major',
				tag: undefined,
				directory: 'b'
			} );
		} );

		it( 'returns the default branch if dependency URL does not specify it (package with branch)', async () => {
			expect( resolver( 'package-with-branch', options ) ).toEqual( {
				url: 'git@github.com:a/b.git',
				branch: 'dev',
				tag: undefined,
				directory: 'b'
			} );
		} );
	} );

	describe( 'with options.resolverTargetDirectory', async () => {
		const options = await getOptions( {
			resolverTargetDirectory: 'npm'
		}, cwd );

		it( 'returns package name as directory for non-scoped package', async () => {
			expect( resolver( 'simple-package', options ) ).toEqual( {
				url: 'git@github.com:a/b.git',
				branch: 'master',
				tag: undefined,
				directory: 'simple-package'
			} );
		} );

		it( 'returns package name as directory for scoped package', async () => {
			expect( resolver( '@scoped/package', options ) ).toEqual( {
				url: 'git@github.com:c/d.git',
				branch: 'master',
				tag: undefined,
				directory: '@scoped/package'
			} );
		} );
	} );

	describe( 'with options.overrideDirectoryNames', () => {
		it( 'returns package with modified directory', async () => {
			const options = await getOptions( {}, cwd );

			expect( resolver( 'override-directory', options ) ).toEqual( {
				url: 'git@github.com:foo/bar.git',
				branch: 'master',
				tag: undefined,
				directory: 'custom-directory'
			} );
		} );

		it( 'ignores modified directory if "resolverTargetDirectory" is set to "npm"', async () => {
			const options = await getOptions( {
				resolverTargetDirectory: 'npm'
			}, cwd );

			expect( resolver( 'override-directory', options ) ).toEqual( {
				url: 'git@github.com:foo/bar.git',
				branch: 'master',
				tag: undefined,
				directory: 'override-directory'
			} );
		} );
	} );
} );
