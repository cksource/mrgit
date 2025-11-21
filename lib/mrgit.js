/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs/promises';
import upath from 'upath';
import chalk from 'chalk';
import { pathToFileURL } from 'url';
import { Listr } from 'listr2';
import { displayLog } from './utils/displaylog.js';
import { getOptions } from './utils/getoptions.js';
import { getPackageNames } from './utils/getpackagenames.js';
import { getCommandInstance } from './utils/getcommandinstance.js';
import { addRootRepositorySuffix } from './utils/rootrepositoryutils.js';

/**
 * @param {Array.<String>} args Arguments that the user provided.
 * @param {Options} options The options object. It will be extended with the default options.
 */
export async function mrgit( args, options ) {
	const command = await getCommandInstance( args[ 0 ] );

	if ( !command ) {
		return;
	}

	const toolOptions = await getOptions( options );
	const mainPkgJsonPath = upath.join( toolOptions.cwd, 'package.json' );
	const { default: repositoryResolver } = await import( pathToFileURL( toolOptions.resolverPath ).href );

	let mainPackageName = '';
	const hasPkgJson = await fs.access( mainPkgJsonPath ).then( () => true, () => false );

	if ( hasPkgJson ) {
		const { default: mainPkgJson } = await import( pathToFileURL( mainPkgJsonPath ).href, { with: { type: 'json' } } );

		mainPackageName = mainPkgJson.name;
	}

	const tasks = new Listr(
		[
			{
				title: 'Verify environment',
				task: async () => {
					throw new Error( 'The configuration file must be located inside a git repository when using "$rootRepository".' );
				},
				enabled: async ctx => {
					if ( ctx.userModifiers.skipRoot ) {
						return false;
					}

					if ( !ctx.toolOptions.$rootRepository ) {
						return false;
					}

					const pathToCheck = upath.join( toolOptions.cwd, '.git' );
					const isInsideGit = await fs.access( pathToCheck ).then( () => true, () => false );

					return !isInsideGit;
				}
			},
			{
				title: 'Execute a before execute hook',
				task: async ( ctx, task ) => {
					await ctx.command.beforeExecute( args, toolOptions, task );
				},
				enabled: ctx => {
					return 'beforeExecute' in ctx.command;
				},
				options: {
					persistentOutput: true,
					rendererOptions: {
						collapseSubtasks: false
					}
				}
			},
			{
				title: 'Execute a task per repository',
				task: ( ctx, task ) => {
					ctx.allPackagesNumber = ctx.packageNames.length;

					return task.newListr(
						ctx.packageNames.map( packageName => mapPackageToListrTask( packageName, mainPackageName ) ),
						{
							concurrent: ctx.taskConcurrent,
							exitOnError: false,
							rendererOptions: {
								collapseSubtasks: false
							}
						}
					);
				}
			},
			{
				title: 'Execute a after execute hook',
				task: async ( ctx, task ) => {
					await ctx.command.afterExecute( ctx.processedPackages, ctx.commandResponses, ctx.toolOptions, task );

					const endTime = process.hrtime( ctx.startTime );

					task.output = chalk.cyan( `Execution time: ${ endTime[ 0 ] }s${ endTime[ 1 ].toString().substring( 0, 3 ) }ms.` );

					if ( ctx.packagesWithError.size ) {
						const repositoryForm = ctx.packagesWithError.size === 1 ? 'repository' : 'repositories';
						let message = `\n❗❗❗ The command failed to execute in ${ ctx.packagesWithError.size } ${ repositoryForm }:\n`;
						message += [ ...ctx.packagesWithError ].map( pkgName => `  - ${ pkgName }` ).join( '\n' );
						message += '\n';

						console.log( chalk.red( message ) );

						process.exitCode = 1;
					}
				},
				enabled: ctx => {
					return 'afterExecute' in ctx.command;
				}
			},
			{
				title: 'Display logs',
				task: async ctx => {
					for ( const params of ctx.logsToDisplay ) {
						displayLog( ...params );
					}
				},
				enabled: ctx => {
					return ctx.logsToDisplay.size > 0;
				}
			}
		],
		{
			concurrent: false,
			rendererOptions: {
				collapseSubtasks: false
			},
			renderer: 'verbose',
			ctx: {
				// TODO: Support to override.
				taskConcurrent: 4,
				// User input.
				userArguments: args,
				userModifiers: options,
				// Command instance.
				command,
				// Internal options.
				toolOptions,
				repositoryResolver,
				startTime: process.hrtime(),
				packageNames: getPackageNames( toolOptions, command ),
				allPackagesNumber: 0,
				donePackagesNumber: 0,
				processedPackages: new Set(),
				commandResponses: new Set(),
				packagesWithError: new Set(),
				logsToDisplay: new Set()
			}
		}
	);

	return tasks.run()
		.catch( error => {
			console.log( error );
			console.log( chalk.red( error.stack ) );

			process.exit( 1 );
		} );
}

/**
 * Creates a Listr-compatible task definition for processing a specific package.
 *
 * This function maps a given package name to a task object that can be consumed by [Listr](https://listr2.kilic.dev/)
 * task runners. The task executes a command against the package, tracks progress and errors,
 * and dynamically spawns subtasks for dependent packages.
 *
 * @param {string} packageName The name of the package to process. May include a `$` prefix if it is the root repository.
 * @param {string} rootPackageName The name of the root package used to filter out recursive tasks.
 * @returns {PackageListrTaskDefinition}
 */
function mapPackageToListrTask( packageName, rootPackageName ) {
	const isRootRepository = packageName.startsWith( '$' );
	packageName = packageName.replace( /^\$/, '' );

	return {
		title: `Processing "${ packageName }"...`,
		task: async ( ctx, task ) => {
			const commandData = {
				packageName,
				isRootRepository,
				toolOptions: ctx.toolOptions,
				commandPath: ctx.command.path,
				arguments: ctx.userArguments.slice( 1 ),
				repository: ctx.repositoryResolver( packageName, ctx.toolOptions, isRootRepository )
			};

			const returnedData = await ctx.command.execute( commandData )
				// A command rejects on failure.
				.catch( errorData => errorData );

			ctx.processedPackages.add( packageName );
			ctx.donePackagesNumber += 1;

			if ( returnedData.response ) {
				ctx.commandResponses.add( returnedData.response );
			}

			if ( returnedData.logs ) {
				if ( isRootRepository ) {
					packageName = addRootRepositorySuffix( packageName );
				}

				if ( returnedData.logs.error.length ) {
					ctx.packagesWithError.add( packageName );
				}

				ctx.logsToDisplay.add( [
					packageName,
					returnedData.logs,
					{
						current: ctx.donePackagesNumber,
						all: ctx.packageNames.length,
						skipCounter: ctx.command.skipCounter,
						colorizeOutput: ctx.command.colorizeOutput
					}
				] );
			}

			const subPackages = ( Array.isArray( returnedData.packages ) ? returnedData.packages : [] )
				.filter( item => item !== rootPackageName )
				.map( subPackageName => mapPackageToListrTask( subPackageName, rootPackageName ) );

			return task.newListr( subPackages, {
				concurrent: ctx.taskConcurrent,
				exitOnError: false,
				rendererOptions: {
					collapseSubtasks: false
				}
			} );
		}
	};
}

/**
 * @typedef {object} CommandContext
 * @property {number} taskConcurrent The maximum number of tasks that can run concurrently.
 * @property {Array<string>} userArguments User-provided positional arguments for the command.
 * @property {Object<string, any>} userModifiers User-provided options or modifiers (e.g., CLI flags).
 * @property {Command} command Instance of the command being executed.
 * @property {Options} toolOptions Internal tool configuration options.
 * @property {RepositoryResolver} repositoryResolver Resolver used to locate and access repositories.
 * @property {[number, number]} startTime High-resolution start time returned by `process.hrtime()`.
 * @property {Array<string>} packageNames Names of all packages that will be processed by the command.
 * @property {number} allPackagesNumber Total number of packages expected to be processed.
 * @property {number} donePackagesNumber Number of packages successfully processed so far.
 * @property {Set<string>} processedPackages Set of package names that have been processed.
 * @property {Set<any>} commandResponses Set of responses returned by executed package commands.
 * @property {Set<string>} packagesWithError Set of package names that encountered errors.
 * @property {Set<string>} logsToDisplay Set of logs to display after execution completes.
 */

/**
 * @typedef {object} PackageListrTaskDefinition
 * @property {string} title
 * @property {PackageListrTaskCallback} task
 */

/**
 * @callback PackageListrTaskCallback
 * @param {CommandContext} ctx
 * @param {ListrTaskObject} task
 * @returns {Promise<void>}
 */

/**
 * @typedef {object} ListrTaskObject
 * @see https://listr2.kilic.dev/task/title.html
 * @see https://listr2.kilic.dev/task/output.html
 * @property {string} title Title of the task.
 * @property {string} output Update the current output of the task.
 */
