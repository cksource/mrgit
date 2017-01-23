/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const createForkPool = require( './utils/createforkpool' );
const logDisplay = require( './utils/displaylog' );
const getOptions = require( './utils/getoptions' );

/**
 * @param {Array.<String>} parameters Arguments that the user provided.
 * @param {Options} options The options object. It will be extended with the default options.
 */
module.exports = function( parameters, options ) {
	const startTime = process.hrtime();
	const forkPool = createForkPool( path.join( __dirname, 'utils', 'child-process.js' ) );

	options = getOptions( options, require( './utils/getcwd' )() );

	const resolver = require( options.resolverPath );

	const commandPath = path.join( __dirname, 'commands', parameters[ 0 ] );
	const command = require( commandPath );

	if ( typeof command.beforeExecute == 'function' ) {
		command.beforeExecute( parameters );
	}

	const processedPackages = new Set();
	const packageNames = Object.keys( options.dependencies );

	let allPackagesNumber = packageNames.length;
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
			parameters: parameters.slice( 1 ),
			options,
			packageName: packageName,
			repository: resolver( packageName, options )
		};

		forkPool.enqueue( data )
			.then( ( returnedData ) => {
				donePackagesNumber += 1;

				if ( Array.isArray( returnedData.packages ) ) {
					returnedData.packages.forEach( ( item ) => {
						if ( processedPackages.has( item ) ) {
							return;
						}

						allPackagesNumber += 1;
						enqueue( item );
					} );
				}

				if ( returnedData.logs ) {
					logDisplay( packageName, returnedData.logs, {
						current: donePackagesNumber,
						all: allPackagesNumber
					} );
				}

				if ( forkPool.isDone ) {
					return onDone();
				}
			} )
			.catch( ( error ) => {
				const chalk = require( 'chalk' );

				console.log( chalk.black.bgRed( error ) );

				process.exit( 1 );
			} );
	}

	function onDone() {
		return forkPool.killAll()
			.then( () => {
				if ( typeof command.afterExecute === 'function' ) {
					command.afterExecute( processedPackages );
				}

				const endTime = process.hrtime( startTime );
				const chalk = require( 'chalk' );

				console.log( chalk.cyan( `Execution time: ${ endTime[ 0 ] }s${ endTime[ 1 ].toString().substring( 0, 3 ) }ms.` ) );
			} );
	}
};
