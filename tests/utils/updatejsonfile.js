/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, describe, it, expect } from 'vitest';
import { updateJsonFile } from '../../lib/utils/updatejsonfile.js';
import fs from 'node:fs';

vi.mock( 'fs' );

describe( 'utils', () => {
	describe( 'updateJsonFile()', () => {
		it( 'should read, update and save JSON file', () => {
			const path = 'path/to/file.json';
			const originalFile = { original: true };
			const updateFunction = object => ( { modified: true, ...object } );
			fs.readFileSync.mockReturnValue( JSON.stringify( originalFile ) );

			updateJsonFile( path, updateFunction );

			expect( fs.readFileSync ).toHaveBeenCalledExactlyOnceWith( path, 'utf-8' );
			expect( fs.writeFileSync ).toHaveBeenCalledExactlyOnceWith( path, [
				'{',
				'  "modified": true,',
				'  "original": true',
				'}',
				''
			].join( '\n' ), 'utf-8' );
		} );
	} );
} );
