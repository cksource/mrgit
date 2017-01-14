/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const createForkPool = require( './utils/createforkpool' );
const logDisplay = require( './utils/displaylog' );

/**
 * @param {Array} parameters Arguments that user provided.
 * @param {Object} options
 * @param {String} data.options.cwd Current work directory.
 */
module.exports = function( parameters, options ) {
	// options.repositoryResolver should be an absolute path.
	if ( fs.existsSync( options.repositoryResolver ) ) {
		options.repositoryResolver = path.resolve( options.repositoryResolver );
	}

	const mgitConf = require( path.resolve( options.cwd, 'mgit.json' ) );
	const forkPool = createForkPool( path.join( __dirname, 'utils', 'child-process.js' ) );

	const commandPath = path.join( __dirname, 'commands', parameters[ 0 ] );
	const command = require( commandPath );

	const startTime = process.hrtime();

	if ( typeof command.beforeExecute === 'function' ) {
		command.beforeExecute( parameters );
	}

	const parsedPackages = new Set();

	const packageNames = Object.keys( mgitConf.dependencies );

	for ( const item of packageNames ) {
		enqueue( item );
	}

	function enqueue( packageName ) {
		if ( parsedPackages.has( packageName ) ) {
			return;
		}

		parsedPackages.add( packageName );

		const data = {
			command: commandPath,
			parameters: parameters.slice( 1 ),
			options,
			name: packageName,
			mgit: mgitConf
		};

		forkPool.enqueue( data )
			.then( ( returnedData ) => {
				if ( Array.isArray( returnedData.packages ) ) {
					returnedData.packages.forEach( enqueue );
				}

				if ( returnedData.logs ) {
					logDisplay( packageName, returnedData.logs );
				}

				if ( forkPool.isDone ) {
					return onDone();
				}
			} )
			.catch( ( err ) => {
				const chalk = require( 'chalk' );

				console.log( chalk.black.bgRed( err ) );

				process.exit( 1 );
			} );
	}

	function onDone() {
		return forkPool.killAll()
			.then( () => {
				if ( typeof command.afterExecute === 'function' ) {
					command.afterExecute( parsedPackages );
				}

				const endTime = process.hrtime( startTime );
				const chalk = require( 'chalk' );

				console.log( chalk.cyan( `Execution time: ${ endTime[ 0 ] }s${ endTime[ 1 ].toString().substring( 0, 3 ) }ms.` ) );
			} );
	}
};
