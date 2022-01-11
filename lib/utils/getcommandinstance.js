/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
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
 * @param {String} commandName An alias or fully command name that should be used.
 * @returns {Command|null}
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
		const message = `Command "${ commandName }" does not exist. Type: "mrgit --help" in order to see available commands.`;

		console.error( chalk.red( message ) );
	}

	process.exitCode = 1;

	return null;
};

/**
 * @typedef {Object} Command
 *
 * @property {String} path An absolute path to the file that keeps the command.
 *
 * @property {String} helpMessage A message that explains how to use specified command.
 *
 * @property {Function} execute A function that is called on every repository that match to specified criteria. It receives an object
 * as an argument that contains following properties
 *
 * @property {Boolean} [skipCounter=false] A flag that allows hiding the progress bar (number of package and number of all
 * packages to process) on the screen.
 *
 * @property {String} [name] A name of the command. It's useful if specified command has defined an alias.
 *
 * @property {Function} [beforeExecute] A function that is called by mrgit automatically before executing the main command's method.
 * This function is called once. It receives two parameters:
 *     - an array of arguments typed by a user (including called command name).
 *     - an options object (`Options`) which contains options resolved by mrgit.
 *
 * @property {Function} execute The main function of command.
 * It receives single argument (`CommandData`) that represents an input provided by a user.
 * It must returns an instance of `Promise`. The promise must resolve an object that can contains following properties:
 *     - `logs` - an object that matches to `Logs` object definition.
 *     - `response` - the entire `response` object is added to a collection that will be passed as second argument to `#afterExecute`
 *       function.
 *     - `packages` - an array of packages that mrgit should process as well.
 *
 * @property {Function} [afterExecute] A function that is called by mrgit automatically after executing the main command's method.
 * This function is called once. It receives three parameters:
 *   - a collection (`Set`) that contains all processed packages by mrgit.
 *   - a collection (`Set`) that contains responses returned by `#execute` function.
 *   - an options object (`Options`) which contains options resolved by mrgit.
 */

/**
 * @typedef {Object} CommandData
 *
 * @property {String} packageName A name of package.
 *
 * @propery {Options} toolOptions Options resolved by mrgit.
 *
 * @property {String} commandPath An absolute path to the file that keeps the command.
 *
 * @property {Array.<String>} arguments Arguments provided by the user via CLI.
 *
 * @property {Repository|null} repository An object that keeps data about repository for specified package.
 */
