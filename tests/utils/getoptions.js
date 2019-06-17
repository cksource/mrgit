/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const getOptions = require( '../../lib/utils/getoptions' );
const path = require( 'upath' );
const expect = require( 'chai' ).expect;
const cwd = path.resolve( __dirname, '..', 'fixtures', 'project-a' );

describe( 'utils', () => {
	describe( 'getOptions()', () => {
		it( 'returns default options', () => {
			const options = getOptions( {}, cwd );

			expect( options ).to.have.property( 'dependencies' );

			delete options.dependencies;

			expect( options ).to.deep.equal( {
				cwd,
				packages: path.resolve( cwd, 'packages' ),
				resolverPath: path.resolve( __dirname, '../../lib/default-resolver.js' ),
				resolverUrlTemplate: 'git@github.com:${ path }.git',
				resolverTargetDirectory: 'git',
				resolverDefaultBranch: 'master',
				scope: null,
				ignore: null,
				packagesPrefix: [],
				overrideDirectoryNames: {
					'override-directory': 'custom-directory'
				}
			} );
		} );

		it( 'returns depepndencies read from mrgit.json', () => {
			const options = getOptions( {}, cwd );
			const mrgitJson = require( path.join( cwd, 'mrgit.json' ) );

			expect( options.dependencies ).to.deep.equal( mrgitJson.dependencies );
		} );

		it( 'does not fail if mrgit.json is not defined ', () => {
			const cwd = path.resolve( __dirname, '..', 'fixtures', 'project-with-no-mrgitjson' );
			const options = getOptions( {}, cwd );

			expect( options ).to.deep.equal( {
				cwd,
				packages: path.resolve( cwd, 'packages' ),
				resolverPath: path.resolve( __dirname, '../../lib/default-resolver.js' ),
				resolverUrlTemplate: 'git@github.com:${ path }.git',
				resolverTargetDirectory: 'git',
				resolverDefaultBranch: 'master',
				scope: null,
				ignore: null,
				packagesPrefix: [],
				overrideDirectoryNames: {}
			} );
		} );

		it( 'reads options from mrgit.json', () => {
			const cwd = path.resolve( __dirname, '..', 'fixtures', 'project-with-options-in-mrgitjson' );
			const options = getOptions( {}, cwd );

			expect( options ).to.deep.equal( {
				dependencies: {
					'simple-package': 'a/b'
				},
				cwd,
				packages: path.resolve( cwd, 'foo' ),
				resolverPath: path.resolve( __dirname, '../../lib/default-resolver.js' ),
				resolverUrlTemplate: 'git@github.com:${ path }.git',
				resolverTargetDirectory: 'git',
				resolverDefaultBranch: 'master',
				scope: null,
				ignore: null,
				packagesPrefix: [],
				overrideDirectoryNames: {}
			} );
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
				packages: path.resolve( cwd, 'bar' ),
				resolverPath: path.resolve( __dirname, '../../lib/default-resolver.js' ),
				resolverUrlTemplate: 'a/b/c',
				resolverTargetDirectory: 'git',
				resolverDefaultBranch: 'master',
				scope: null,
				ignore: null,
				packagesPrefix: [],
				overrideDirectoryNames: {}
			} );
		} );
	} );
} );
