/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'upath' );
const createForkPool = require( './utils/createforkpool' );
const logDisplay = require( './utils/displaylog' );
const getOptions = require( './utils/getoptions' );
const getPackageNames = require( './utils/getpackagenames' );
const chalk = require( 'chalk' );

const aliases = {
	st: 'status',
	co: 'checkout'
};

/**
 * @param {Array.<String>} args Arguments that the user provided.
 * @param {Options} options The options object. It will be extended with the default options.
 */
module.exports = function( args, options ) {
	const startTime = process.hrtime();
	const forkPool = createForkPool( path.join( __dirname, 'utils', 'child-process.js' ) );

	options = getOptions( options, require( './utils/getcwd' )() );

	const repositoryResolver = require( options.resolverPath );

	// If used an alias in order to call the command - replace the alias with a full name.
	if ( args[ 0 ] in aliases ) {
		args[ 0 ] = aliases[ args[ 0 ] ];
	}

	// Remove all dashes from command name.
	args[ 0 ] = args[ 0 ].replace( /-/g, '' );

	const commandPath = path.join( __dirname, 'commands', args[ 0 ] );
	const command = require( commandPath );

	if ( typeof command.beforeExecute == 'function' ) {
		command.beforeExecute( args );
	}

	const processedPackages = new Set();
	const commandResponses = new Set();
	const packagesWithError = new Set();
	const packageNames = getPackageNames( options );

	let allPackagesNumber = packageNames.length;

	if ( allPackagesNumber === 0 ) {
		console.log( chalk.red( 'No packages found that match the given criteria.' ) );

		return onDone();
	}

	let donePackagesNumber = 0;

	for ( const item of packageNames ) {
		enqueue( item );
	}

	function enqueue( packageName ) {
		if ( processedPackages.has( packageName ) ) {
			return;
		}

		processedPackages.add( packageName );

		const data = {
			command: commandPath,
			arguments: args.slice( 1 ),
			options,
			packageName,
			repository: repositoryResolver( packageName, options )
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
					if ( returnedData.logs.error.length ) {
						packagesWithError.add( packageName );
					}

					logDisplay( packageName, returnedData.logs, {
						current: donePackagesNumber,
						all: allPackagesNumber,
						command: args[ 0 ]
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
				if ( typeof command.afterExecute === 'function' ) {
					command.afterExecute( processedPackages, commandResponses );
				}

				const endTime = process.hrtime( startTime );

				console.log( chalk.cyan( `Execution time: ${ endTime[ 0 ] }s${ endTime[ 1 ].toString().substring( 0, 3 ) }ms.` ) );

				if ( packagesWithError.size ) {
					const repositoryForm = packagesWithError.size === 1 ? 'repository' : 'repositories';
					const message = `\n❗❗❗ The command failed to execute in ${ packagesWithError.size } ${ repositoryForm }.❗❗❗\n`;

					console.log( chalk.red( message ) );
					process.exit( 1 );
				}
			} );
	}
};
