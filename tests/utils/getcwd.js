/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, describe, it, expect } from 'vitest';
import { getCwd } from '../../lib/utils/getcwd.js';
import fs from 'node:fs';

vi.mock( 'fs' );

describe( 'utils', () => {
	describe( 'getCwd()', () => {
		it( 'returns "process.cwd()" value if the "mrgit.json" has been found', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( '/workspace/ckeditor/ckeditor5' );
			fs.existsSync.mockReturnValue( true );

			expect( getCwd( 'mrgit.json' ) ).toEqual( '/workspace/ckeditor/ckeditor5' );
		} );

		it( 'returns a path to the "mrgit.json" when custom working directory is provided', () => {
			fs.existsSync.mockReturnValue( true );

			expect( getCwd( 'mrgit.json', '/another-workspace/ckeditor/ckeditor5' ) ).toEqual( '/another-workspace/ckeditor/ckeditor5' );
		} );

		it( 'scans dir tree up in order to find configuration file', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( '/workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/node_modules/@ckeditor' );

			fs.existsSync
				// /workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/node_modules/@ckeditor
				.mockReturnValueOnce( false )
				// /workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/node_modules
				.mockReturnValueOnce( false )
				// /workspace/ckeditor/ckeditor5/packages/ckeditor5-engine
				.mockReturnValueOnce( false )
				// /workspace/ckeditor/ckeditor5/packages
				.mockReturnValueOnce( false )
				// /workspace/ckeditor/ckeditor5
				.mockReturnValueOnce( true );

			expect( getCwd( 'mrgit-custom.json' ) ).toEqual( '/workspace/ckeditor/ckeditor5' );

			expect( fs.existsSync.mock.calls[ 0 ] ).toEqual( [
				'/workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/node_modules/@ckeditor/mrgit-custom.json'
			] );
			expect( fs.existsSync.mock.calls[ 1 ] ).toEqual( [
				'/workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/node_modules/mrgit-custom.json'
			] );
			expect( fs.existsSync.mock.calls[ 2 ] ).toEqual( [
				'/workspace/ckeditor/ckeditor5/packages/ckeditor5-engine/mrgit-custom.json'
			] );
			expect( fs.existsSync.mock.calls[ 3 ] ).toEqual( [
				'/workspace/ckeditor/ckeditor5/packages/mrgit-custom.json'
			] );
			expect( fs.existsSync.mock.calls[ 4 ] ).toEqual( [
				'/workspace/ckeditor/ckeditor5/mrgit-custom.json'
			] );
		} );

		it( 'throws an error if the configuration file cannot be found', () => {
			vi.spyOn( process, 'cwd' ).mockReturnValue( '/workspace/ckeditor' );
			fs.existsSync.mockReturnValue( false );

			expect( () => getCwd( 'mrgit.json' ) ).to.throw( Error, 'Cannot find the configuration file.' );
		} );
	} );
} );
