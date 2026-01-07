/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = upath.dirname( __filename );

export const ROOT_DIRECTORY = upath.join( __dirname, '..', '..' );

export const RELEASE_DIRECTORY = 'release';
