/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { generateChangelogForSingleRepository } from '@ckeditor/ckeditor5-dev-changelog';
import parseArguments from './utils/parsearguments.mjs';
import { ROOT_DIRECTORY } from './utils/constants.mjs';

const cliOptions = parseArguments( process.argv.slice( 2 ) );

const changelogOptions = {
	cwd: ROOT_DIRECTORY,
	disableFilesystemOperations: cliOptions.dryRun
};

if ( cliOptions.date ) {
	changelogOptions.date = cliOptions.date;
}

generateChangelogForSingleRepository( changelogOptions )
	.then( maybeChangelog => {
		if ( maybeChangelog ) {
			console.log( maybeChangelog );
		}
	} );
