/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const createForkPool = require( './utils/createforkpool' );
const displayLog = require( './utils/displaylog' );
const getOptions = require( './utils/getoptions' );
const getPackageNames = require( './utils/getpackagenames' );
const getCommandInstance = require( './utils/getcommandinstance' );
const getCwd = require( './utils/getcwd' );

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

	const startTime = process.hrtime();
	const mgitOptions = getOptions( options, getCwd() );
	const repositoryResolver = require( mgitOptions.resolverPath );
	const forkPool = createForkPool( CHILD_PROCESS_PATH );

	if ( command.beforeExecute ) {
		try {
			command.beforeExecute( args );
		} catch ( error ) {
			console.log( chalk.red( error.message ) );
			process.exit( 1 );

			return;
		}
	}

	const processedPackages = new Set();
	const commandResponses = new Set();
	const packageNames = getPackageNames( mgitOptions );

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

		processedPackages.add( packageName );

		const data = {
			packageName,
			mgitOptions,
			commandPath: command.path,
			arguments: args.slice( 1 ),
			repository: repositoryResolver( packageName, mgitOptions )
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
					command.afterExecute( processedPackages, commandResponses, mgitOptions );
				}

				const endTime = process.hrtime( startTime );

				console.log( chalk.cyan( `Execution time: ${ endTime[ 0 ] }s${ endTime[ 1 ].toString().substring( 0, 3 ) }ms.` ) );
			} );
	}
};
