/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import upath from 'upath';
import { pathToFileURL } from 'url';

const COMMAND_ALIASES = {
	ci: 'commit',
	co: 'checkout',
	st: 'status'
};

/**
 * @param {String} commandName An alias or fully command name that should be used.
 * @returns {Command|null}
 */
export async function getCommandInstance( commandName ) {
	try {
		// Find full command name if used an alias or just use specified name.
		const resolvedCommandName = ( COMMAND_ALIASES[ commandName ] || commandName ).replace( /-/g, '' );

		const commandPath = upath.resolve( import.meta.dirname, `../commands/${ resolvedCommandName }.js` );
		const { default: commandInstance } = await import( pathToFileURL( commandPath ).href );

		commandInstance.path = commandPath;

		return commandInstance;
	} catch {
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
 * @property {String} helpMessage A message that explains how to use specified command.
 * @property {Boolean} [skipCounter=false] A flag that allows hiding the progress bar.
 * @property {String} name A name of the command. Used for aliases and handling root package logic.
 * @property {BeforeExecuteFunction} [beforeExecute] A function automatically called once before the main command executes.
 * @property {ExecuteFunction} execute The main function of a command.
 * @property {AfterExecuteFunction} [afterExecute] A function automatically called once after the main command executes.
 */

/**
 * @typedef {Object} CommandData
 *
 * @property {String} packageName A name of package.
 * @property {Options} toolOptions Options resolved by mrgit.
 * @property {String} commandPath An absolute path to the file that keeps the command.
 * @property {Array.<String>} arguments Arguments provided by the user via CLI.
 * @property {Repository|null} repository An object that keeps data about repository for specified package.
 */

/**
 * @typedef {Object} CommandResult
 * @property {Logs} [logs] Logs collected during execution.
 * @property {Object} [response] Response object passed to `afterExecute`.
 * @property {Array} [packages] Additional packages to process.
 */

/**
 * The main function executed by mrgit for a command.
 * It receives one argument and must return a Promise that resolves when the command completes.
 * The resolved value can include logs, a response, or additional packages to process.
 *
 * @callback ExecuteFunction
 * @param {CommandData} data Input provided by the user.
 * @returns {Promise<CommandResult>}
 */

/**
 * A function automatically called by mrgit before executing the main command.
 * It runs once and can be asynchronous.
 *
 * @callback BeforeExecuteFunction
 * @param {Array<string>} args User-provided arguments (including the command name).
 * @param {Options} options Resolved mrgit options.
 * @param {ListrTaskObject} task A current Listr task.
 * @returns {Promise.<void>|void}
 */

/**
 * A function automatically called by mrgit after the main command finishes.
 * It runs once and can be asynchronous.
 *
 * @callback AfterExecuteFunction
 * @param {Set} processedPackages All packages processed by mrgit.
 * @param {Set} responses Responses returned by the `execute` function.
 * @param {Options} options Resolved mrgit options.
 * @param {ListrTaskObject} task A current Listr task.
 * @returns {Promise<void>|void}
 */
