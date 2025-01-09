/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );

const ROOT_REPOSITORY_SUFFIX = '[ROOT REPOSITORY]';

const ROOT_REPOSITORY_UNSUPPORTED_COMMANDS = [
	require( '../commands/close' ).name,
	require( '../commands/save' ).name
];

function addRootRepositorySuffix( packageName, { bold = false } = {} ) {
	let suffix = ROOT_REPOSITORY_SUFFIX;

	if ( bold ) {
		suffix = chalk.bold( suffix );
	}

	return [ packageName, suffix ].join( ' ' );
}

function doesCommandSupportRootPackage( command ) {
	return !ROOT_REPOSITORY_UNSUPPORTED_COMMANDS.includes( command.name );
}

module.exports = {
	addRootRepositorySuffix,
	doesCommandSupportRootPackage
};
