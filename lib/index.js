/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );
const chalk = require( 'chalk' );
const createForkPool = require( './utils/createforkpool' );
const displayLog = require( './utils/displaylog' );
const getOptions = require( './utils/getoptions' );
const getPackageNames = require( './utils/getpackagenames' );
const getCommandInstance = require( './utils/getcommandinstance' );
const getCwd = require( './utils/getcwd' );
const { addRootRepositorySuffix } = require( './utils/rootrepositoryutils' );

const CHILD_PROCESS_PATH = require.resolve( './utils/child-process' );

/**
 * @param {Array.<String>} args Arguments that the user provided.
 * @param {Options} options The options object. It will be extended with the default options.
 */
module.exports = function( args, options ) {
	const command = getCommandInstance( args[ 0 ] );

	if ( !command ) {
		return;
	}

	const cwd = getCwd();
	const startTime = process.hrtime();
	const toolOptions = getOptions( options, cwd );
	const repositoryResolver = require( toolOptions.resolverPath );
	const forkPool = createForkPool( CHILD_PROCESS_PATH );

	const mainPkgJsonPath = path.resolve( cwd, 'package.json' );

	if ( !fs.existsSync( mainPkgJsonPath ) ) {
		console.log( chalk.red( '"mrgit.json" file has to be located inside git repository.' ) );

		process.exit( 1 );
	}

	const mainPackageName = require( mainPkgJsonPath ).name;

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
			.then( () => {
				if ( command.afterExecute ) {
					command.afterExecute( processedPackages, commandResponses, toolOptions );
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
};
