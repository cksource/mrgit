#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { generateChangelogForSinglePackage } from '@ckeditor/ckeditor5-dev-release-tools';
import parseArguments from './utils/parsearguments.mjs';

const cliArguments = parseArguments( process.argv.slice( 2 ) );

const changelogOptions = {
	cwd: process.cwd(),
	releaseBranch: cliArguments.branch
};

if ( cliArguments.from ) {
	changelogOptions.from = cliArguments.from;
}

generateChangelogForSinglePackage( changelogOptions );
