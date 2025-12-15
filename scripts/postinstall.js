/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import fs from 'node:fs';

const ROOT_DIRECTORY = upath.join( import.meta.dirname, '..' );

// When installing a repository as a dependency, the `.git` directory does not exist.
// In such a case, husky should not attach its hooks as npm treats it as a package, not a git repository.
if ( fs.existsSync( upath.join( ROOT_DIRECTORY, '.git' ) ) ) {
	const { default: husky } = await import( 'husky' );

	husky.install();
}
