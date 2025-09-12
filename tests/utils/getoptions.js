/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const getOptions = require( '../../lib/utils/getoptions' );
const path = require( 'upath' );
const fs = require( 'fs' );
const shell = require( 'shelljs' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

const cwd = path.resolve( __dirname, '..', 'fixtures', 'project-a' );

describe( 'utils', () => {
	describe( 'getOptions()', () => {
		it( 'returns default options', () => {
			const options = getOptions( {}, cwd );

			expect( options ).to.have.property( 'dependencies' );

			delete options.dependencies;

			expect( options ).to.deep.equal( {
				cwd,
				config: path.resolve( cwd, 'mrgit.json' ),
				packages: path.resolve( cwd, 'packages' ),
				resolverPath: path.resolve( __dirname, '../../lib/default-resolver.js' ),
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

		it( 'uses default process.cwd() if not specified', () => {
			sinon.stub( process, 'cwd' ).returns( cwd );

			const options = getOptions( {} );

			expect( options.cwd ).to.equal( cwd );
		} );

		it( 'returns dependencies read from default configuration file', () => {
			const options = getOptions( {}, cwd );
			const mrgitJson = require( path.join( cwd, 'mrgit.json' ) );

			expect( options.dependencies ).to.deep.equal( mrgitJson.dependencies );
		} );

		it( 'fails if configuration file is not defined ', () => {
			const cwd = path.resolve( __dirname, '..', 'fixtures', 'project-with-no-mrgitjson' );

			expect( () => getOptions( {}, cwd ) ).to.throw( Error, 'Cannot find the configuration file.' );
		} );

		it( 'reads options from default configuration file', () => {
			const cwd = path.resolve( __dirname, '..', 'fixtures', 'project-with-options-in-mrgitjson' );
			const options = getOptions( {}, cwd );

			expect( options ).to.deep.equal( {
				dependencies: {
					'simple-package': 'a/b'
				},
				cwd,
				config: path.resolve( cwd, 'mrgit.json' ),
				packages: path.resolve( cwd, 'foo' ),
				resolverPath: path.resolve( __dirname, '../../lib/default-resolver.js' ),
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

		it( 'reads options from custom configuration file', () => {
			const cwd = path.resolve( __dirname, '..', 'fixtures', 'project-with-custom-config' );
			const options = getOptions( {
				config: 'mrgit-custom.json'
			}, cwd );

			expect( options.dependencies ).to.deep.equal( {
				'simple-package': 'a/b'
			} );

			expect( options.config ).to.equal( path.resolve( cwd, 'mrgit-custom.json' ) );
		} );

		it( 'priorities passed options', () => {
			const cwd = path.resolve( __dirname, '..', 'fixtures', 'project-with-options-in-mrgitjson' );
			const options = getOptions( {
				resolverUrlTemplate: 'a/b/c',
				packages: 'bar'
			}, cwd );

			expect( options ).to.deep.equal( {
				dependencies: {
					'simple-package': 'a/b'
				},
				cwd,
				config: path.resolve( cwd, 'mrgit.json' ),
				packages: path.resolve( cwd, 'bar' ),
				resolverPath: path.resolve( __dirname, '../../lib/default-resolver.js' ),
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

		it( 'returns "packagesPrefix" as array', () => {
			const options = getOptions( {
				packagesPrefix: 'ckeditor5-'
			}, cwd );

			expect( options ).to.have.property( 'dependencies' );

			delete options.dependencies;

			expect( options ).to.deep.equal( {
				cwd,
				config: path.resolve( cwd, 'mrgit.json' ),
				packages: path.resolve( cwd, 'packages' ),
				resolverPath: path.resolve( __dirname, '../../lib/default-resolver.js' ),
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

		it( 'attaches to options branch name from the cwd directory (if in git repository)', () => {
			const fsExistsStub = sinon.stub( fs, 'existsSync' );
			const shelljsStub = sinon.stub( shell, 'exec' );

			fsExistsStub.returns( true );
			shelljsStub.returns( {
				stdout: 'master\n'
			} );

			const options = getOptions( {}, cwd );

			expect( options ).to.have.property( 'dependencies' );

			delete options.dependencies;

			expect( options ).to.deep.equal( {
				cwd,
				config: path.resolve( cwd, 'mrgit.json' ),
				packages: path.resolve( cwd, 'packages' ),
				resolverPath: path.resolve( __dirname, '../../lib/default-resolver.js' ),
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

			fsExistsStub.restore();
			shelljsStub.restore();
		} );

		it( 'throws an error when --preset option is used, but presets are not defined in configuration', () => {
			expect( () => {
				getOptions( { preset: 'foo' }, cwd );
			} ).to.throw( Error, 'Preset "foo" is not defined in configuration file.' );
		} );

		it( 'throws an error when --preset option is used, but the specific preset is not defined in configuration', () => {
			const cwdForPresets = path.resolve( __dirname, '..', 'fixtures', 'project-with-presets' );

			expect( () => {
				getOptions( { preset: 'foo' }, cwdForPresets );
			} ).to.throw( Error, 'Preset "foo" is not defined in configuration file.' );
		} );

		it( 'returns options with preset merged with dependencies when --preset option is used', () => {
			const cwdForPresets = path.resolve( __dirname, '..', 'fixtures', 'project-with-presets' );

			const options = getOptions( { preset: 'development' }, cwdForPresets );

			expect( options ).to.have.property( 'dependencies' );
			expect( options.dependencies ).to.deep.equal( {
				'linters-config': 'foo/linters-config@latest',
				'dev-tools': 'foo/dev-tools#developmentBranch'
			} );
		} );

		it( 'returns options with "$rootRepository" taken from a preset if --preset option is used', () => {
			const cwdForPresets = path.resolve( __dirname, '..', 'fixtures', 'project-with-defined-root' );

			const options = getOptions( { preset: 'development' }, cwdForPresets );

			expect( options.$rootRepository ).to.equal( 'ckeditor/ckeditor5#developmentBranch' );
		} );
	} );
} );
