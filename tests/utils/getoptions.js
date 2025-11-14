/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, beforeEach, describe, it, expect } from 'vitest';
import { getOptions } from '../../lib/utils/getoptions.js';

import fs from 'fs';
import shelljs from 'shelljs';
import upath from 'upath';

vi.mock( 'fs' );
vi.mock( 'shelljs' );

const cwd = upath.resolve( import.meta.dirname, '..', 'fixtures', 'project-a' );

describe( 'utils', () => {
	let mrgitJsonExists, dotGitExists;

	beforeEach( () => {
		mrgitJsonExists = true;
		dotGitExists = false;

		fs.existsSync.mockImplementation( path => {
			if ( path.endsWith( '/mrgit.json' ) ) {
				return mrgitJsonExists;
			}

			if ( path.endsWith( '/mrgit-custom.json' ) ) {
				return true;
			}

			if ( path.endsWith( '/.git' ) ) {
				return dotGitExists;
			}

			return false;
		} );
	} );

	describe( 'getOptions()', () => {
		it( 'returns default options', async () => {
			const options = await getOptions( {}, cwd );

			expect( options ).toHaveProperty( 'dependencies' );

			delete options.dependencies;

			expect( options ).toEqual( {
				cwd,
				config: upath.resolve( cwd, 'mrgit.json' ),
				packages: upath.resolve( cwd, 'packages' ),
				resolverPath: upath.resolve( import.meta.dirname, '../../lib/default-resolver.js' ),
				resolverUrlTemplate: 'git@github.com:${ path }.git',
				resolverTargetDirectory: 'git',
				resolverDefaultBranch: 'master',
				scope: null,
				ignore: null,
				skipRoot: false,
				packagesPrefix: [],
				overrideDirectoryNames: {
					'override-directory': 'custom-directory'
				},
				baseBranches: []
			} );
		} );

		it( 'uses default process.cwd() if not specified', async () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( cwd );

			const options = await getOptions( {} );

			expect( options.cwd ).toEqual( cwd );
		} );

		it( 'returns dependencies read from default configuration file', async () => {
			const options = await getOptions( {}, cwd );
			const mrgitJson = require( upath.join( cwd, 'mrgit.json' ) );

			expect( options.dependencies ).toEqual( mrgitJson.dependencies );
		} );

		it( 'fails if configuration file is not defined ', async () => {
			mrgitJsonExists = false;
			const cwd = upath.resolve( import.meta.dirname, '..', 'fixtures', 'project-with-no-mrgitjson' );

			try {
				await getOptions( {}, cwd );

				throw new Error( 'Expected the test to throw.' );
			} catch ( error ) {
				expect( error.message ).toEqual( 'Cannot find the configuration file.' );
			}
		} );

		it( 'reads options from default configuration file', async () => {
			const cwd = upath.resolve( import.meta.dirname, '..', 'fixtures', 'project-with-options-in-mrgitjson' );
			const options = await getOptions( {}, cwd );

			expect( options ).toEqual( {
				dependencies: {
					'simple-package': 'a/b'
				},
				cwd,
				config: upath.resolve( cwd, 'mrgit.json' ),
				packages: upath.resolve( cwd, 'foo' ),
				resolverPath: upath.resolve( import.meta.dirname, '../../lib/default-resolver.js' ),
				resolverUrlTemplate: 'git@github.com:${ path }.git',
				resolverTargetDirectory: 'git',
				resolverDefaultBranch: 'master',
				scope: null,
				ignore: null,
				skipRoot: false,
				packagesPrefix: [],
				overrideDirectoryNames: {},
				baseBranches: []
			} );
		} );

		it( 'reads options from custom configuration file', async () => {
			const cwd = upath.resolve( import.meta.dirname, '..', 'fixtures', 'project-with-custom-config' );
			const options = await getOptions( {
				config: 'mrgit-custom.json'
			}, cwd );

			expect( options.dependencies ).toEqual( {
				'simple-package': 'a/b'
			} );

			expect( options.config ).toEqual( upath.resolve( cwd, 'mrgit-custom.json' ) );
		} );

		it( 'priorities passed options', async () => {
			const cwd = upath.resolve( import.meta.dirname, '..', 'fixtures', 'project-with-options-in-mrgitjson' );
			const options = await getOptions( {
				resolverUrlTemplate: 'a/b/c',
				packages: 'bar'
			}, cwd );

			expect( options ).toEqual( {
				dependencies: {
					'simple-package': 'a/b'
				},
				cwd,
				config: upath.resolve( cwd, 'mrgit.json' ),
				packages: upath.resolve( cwd, 'bar' ),
				resolverPath: upath.resolve( import.meta.dirname, '../../lib/default-resolver.js' ),
				resolverUrlTemplate: 'a/b/c',
				resolverTargetDirectory: 'git',
				resolverDefaultBranch: 'master',
				scope: null,
				ignore: null,
				skipRoot: false,
				packagesPrefix: [],
				overrideDirectoryNames: {},
				baseBranches: []
			} );
		} );

		it( 'returns "packagesPrefix" as array', async () => {
			const options = await getOptions( {
				packagesPrefix: 'ckeditor5-'
			}, cwd );

			expect( options ).to.have.property( 'dependencies' );

			delete options.dependencies;

			expect( options ).toEqual( {
				cwd,
				config: upath.resolve( cwd, 'mrgit.json' ),
				packages: upath.resolve( cwd, 'packages' ),
				resolverPath: upath.resolve( import.meta.dirname, '../../lib/default-resolver.js' ),
				resolverUrlTemplate: 'git@github.com:${ path }.git',
				resolverTargetDirectory: 'git',
				resolverDefaultBranch: 'master',
				scope: null,
				ignore: null,
				skipRoot: false,
				packagesPrefix: [
					'ckeditor5-'
				],
				overrideDirectoryNames: {
					'override-directory': 'custom-directory'
				},
				baseBranches: []
			} );
		} );

		it( 'attaches to options branch name from the cwd directory (if in git repository)', async () => {
			dotGitExists = true;
			shelljs.exec.mockReturnValue( { stdout: 'master\n' } );

			const options = await getOptions( {}, cwd );

			expect( options ).to.have.property( 'dependencies' );

			delete options.dependencies;

			expect( options ).toEqual( {
				cwd,
				config: upath.resolve( cwd, 'mrgit.json' ),
				packages: upath.resolve( cwd, 'packages' ),
				resolverPath: upath.resolve( import.meta.dirname, '../../lib/default-resolver.js' ),
				resolverUrlTemplate: 'git@github.com:${ path }.git',
				resolverTargetDirectory: 'git',
				resolverDefaultBranch: 'master',
				scope: null,
				ignore: null,
				skipRoot: false,
				packagesPrefix: [],
				overrideDirectoryNames: {
					'override-directory': 'custom-directory'
				},
				baseBranches: [],
				cwdPackageBranch: 'master'
			} );
		} );

		it( 'throws an error when --preset option is used, but presets are not defined in configuration', async () => {
			try {
				await getOptions( { preset: 'foo' }, cwd );

				throw new Error( 'Expected the test to throw.' );
			} catch ( error ) {
				expect( error.message ).toEqual( 'Preset "foo" is not defined in configuration file.' );
			}
		} );

		it( 'throws an error when --preset option is used, but the specific preset is not defined in configuration', async () => {
			const cwdForPresets = upath.resolve( import.meta.dirname, '..', 'fixtures', 'project-with-presets' );

			try {
				await getOptions( { preset: 'foo' }, cwdForPresets );

				throw new Error( 'Expected the test to throw.' );
			} catch ( error ) {
				expect( error.message ).toEqual( 'Preset "foo" is not defined in configuration file.' );
			}
		} );

		it( 'returns options with preset merged with dependencies when --preset option is used', async () => {
			const cwdForPresets = upath.resolve( import.meta.dirname, '..', 'fixtures', 'project-with-presets' );

			const options = await getOptions( { preset: 'development' }, cwdForPresets );

			expect( options ).to.have.property( 'dependencies' );
			expect( options.dependencies ).toEqual( {
				'linters-config': 'foo/linters-config@latest',
				'dev-tools': 'foo/dev-tools#developmentBranch'
			} );
		} );

		it( 'returns options with "$rootRepository" taken from a preset if --preset option is used', async () => {
			const cwdForPresets = upath.resolve( import.meta.dirname, '..', 'fixtures', 'project-with-defined-root' );

			const options = await getOptions( { preset: 'development' }, cwdForPresets );

			expect( options.$rootRepository ).toEqual( 'ckeditor/ckeditor5#developmentBranch' );
		} );
	} );
} );
