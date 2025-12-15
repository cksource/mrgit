/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import upath from 'upath';
import chalk from 'chalk';
import { pathToFileURL } from 'node:url';
import { createForkPool } from './utils/createforkpool.js';
import { displayLog } from './utils/displaylog.js';
import { getOptions } from './utils/getoptions.js';
import { getPackageNames } from './utils/getpackagenames.js';
import { getCommandInstance } from './utils/getcommandinstance.js';
import { addRootRepositorySuffix } from './utils/rootrepositoryutils.js';

const CHILD_PROCESS_PATH = upath.resolve( import.meta.dirname, './utils/child-process' );

/**
 * @param {Array.<String>} args Arguments that the user provided.
 * @param {Options} options The options object. It will be extended with the default options.
 */
export async function mrgit( args, options ) {
	const command = await getCommandInstance( args[ 0 ] );

	if ( !command ) {
		return;
	}

	const startTime = process.hrtime();
	const toolOptions = await getOptions( options );
	const { default: repositoryResolver } = await import( pathToFileURL( toolOptions.resolverPath ).href );
	const forkPool = createForkPool( CHILD_PROCESS_PATH );

	if ( shouldBreakProcess( toolOptions ) ) {
		console.log( chalk.red(
			// eslint-disable-next-line @stylistic/max-len
			`When the "${ chalk.bold( '$rootRepository' ) }" option is used, the configuration file must be located inside a git repository.`
		) );

		process.exit( 1 );
	}

	const mainPkgJsonPath = upath.resolve( toolOptions.cwd, 'package.json' );
	let mainPackageName = '';

	if ( fs.existsSync( mainPkgJsonPath ) ) {
		const { default: mainPkgJson } = await import( pathToFileURL( mainPkgJsonPath ).href, { with: { type: 'json' } } );

		mainPackageName = mainPkgJson.name;
	}

	if ( command.beforeExecute ) {
		try {
			command.beforeExecute( args, toolOptions );
		} catch ( error ) {
			console.log( chalk.red( error.message ) );

			process.exit( 1 );
		}
	}

	const processedPackages = new Set();
	const commandResponses = new Set();
	const packagesWithError = new Set();
	const packageNames = getPackageNames( toolOptions, command );

	let allPackagesNumber = packageNames.length;
	let donePackagesNumber = 0;

	if ( allPackagesNumber === 0 ) {
		console.log( chalk.yellow( 'No packages found that match to specified criteria.' ) );

		return onDone();
	}

	for ( const item of packageNames ) {
		enqueue( item );
	}

	function enqueue( packageName ) {
		if ( processedPackages.has( packageName ) ) {
			return;
		}

		// Do not enqueue main package even if other package from dependencies require it.
		if ( packageName === mainPackageName ) {
			return;
		}

		const isRootRepository = packageName.startsWith( '$' );
		packageName = packageName.replace( /^\$/, '' );

		processedPackages.add( packageName );

		const data = {
			packageName,
			isRootRepository,
			toolOptions,
			commandPath: command.path,
			arguments: args.slice( 1 ),
			repository: repositoryResolver( packageName, toolOptions, isRootRepository )
		};

		forkPool.enqueue( data )
			.then( returnedData => {
				donePackagesNumber += 1;

				if ( Array.isArray( returnedData.packages ) ) {
					returnedData.packages.forEach( item => {
						if ( processedPackages.has( item ) ) {
							return;
						}

						allPackagesNumber += 1;
						enqueue( item );
					} );
				}

				if ( returnedData.response ) {
					commandResponses.add( returnedData.response );
				}

				if ( returnedData.logs ) {
					if ( data.isRootRepository ) {
						packageName = addRootRepositorySuffix( packageName );
					}

					if ( returnedData.logs.error.length ) {
						packagesWithError.add( packageName );
					}

					displayLog( packageName, returnedData.logs, {
						current: donePackagesNumber,
						all: allPackagesNumber,
						skipCounter: command.skipCounter,
						colorizeOutput: command.colorizeOutput
					} );
				}

				if ( forkPool.isDone ) {
					return onDone();
				}
			} )
			.catch( error => {
				console.log( chalk.red( error.stack ) );

				process.exit( 1 );
			} );
	}

	function onDone() {
		return forkPool.killAll()
			.then( async () => {
				if ( command.afterExecute ) {
					await command.afterExecute( processedPackages, commandResponses, toolOptions );
				}

				const endTime = process.hrtime( startTime );

				console.log( chalk.cyan( `Execution time: ${ endTime[ 0 ] }s${ endTime[ 1 ].toString().substring( 0, 3 ) }ms.` ) );

				if ( packagesWithError.size ) {
					const repositoryForm = packagesWithError.size === 1 ? 'repository' : 'repositories';
					let message = `\n❗❗❗ The command failed to execute in ${ packagesWithError.size } ${ repositoryForm }:\n`;
					message += [ ...packagesWithError ].map( pkgName => `  - ${ pkgName }` ).join( '\n' );
					message += '\n';

					console.log( chalk.red( message ) );
					process.exit( 1 );
				}
			} );
	}

	function shouldBreakProcess( toolOptions ) {
		if ( options.skipRoot ) {
			return false;
		}

		if ( !toolOptions.$rootRepository ) {
			return false;
		}

		if ( fs.existsSync( upath.join( toolOptions.cwd, '.git' ) ) ) {
			return false;
		}

		return true;
	}
};
