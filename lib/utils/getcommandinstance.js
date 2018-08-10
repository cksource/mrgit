/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );

const COMMAND_ALIASES = {
	ci: 'commit',
	co: 'checkout',
	st: 'status'
};

/**
 * @param {String} response An output returned by `git status -sb` command.
 */
module.exports = function getCommandInstance( commandName ) {
	try {
		// Find full command name if used an alias or just use specified name.
		const resolvedCommandName = ( COMMAND_ALIASES[ commandName ] || commandName ).replace( /-/g, '' );

		const commandPath = require.resolve( '../commands/' + resolvedCommandName );
		const commandInstance = require( commandPath );

		commandInstance.path = commandPath;

		return commandInstance;
	} catch ( err ) {
		const message = `Command "${ commandName }" does not exist. Type: "mgit --help" in order to see available commands.`;

		console.error( chalk.red( message ) );
		process.exitCode = 1;
	}
};
