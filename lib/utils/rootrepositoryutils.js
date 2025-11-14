/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import close from '../commands/close.js';
import save from '../commands/save.js';

const ROOT_REPOSITORY_SUFFIX = '[ROOT REPOSITORY]';

const ROOT_REPOSITORY_UNSUPPORTED_COMMANDS = [
	close.name,
	save.name
];

export function addRootRepositorySuffix( packageName, { bold = false } = {} ) {
	let suffix = ROOT_REPOSITORY_SUFFIX;

	if ( bold ) {
		suffix = chalk.bold( suffix );
	}

	return [ packageName, suffix ].join( ' ' );
}

export function doesCommandSupportRootPackage( command ) {
	return !ROOT_REPOSITORY_UNSUPPORTED_COMMANDS.includes( command.name );
}
