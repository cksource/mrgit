/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );
const chalk = require( 'chalk' );
const exec = require( '../utils/exec' );

const command = {
	/**
	 * @param {Object} data
	 * @param {String} data.packageName Name of current package to process.
	 * @param {Options} data.options The options object.
	 * @param {Repository} data.repository
	 * @param {Boolean} [data.doNotTryAgain=false] If set to `true`, bootstrap command won't be executed again.
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();
		const destinationPath = path.join( data.options.packages, data.repository.directory );

		let promise;

		// Package is already cloned.
		if ( fs.existsSync( destinationPath ) ) {
			log.info( `Package "${ data.packageName }" is already cloned.` );

			promise = Promise.resolve();
		} else {
			const command = [
				`git clone --progress "${ data.repository.url }" "${ destinationPath }"`,
				`cd "${ destinationPath }"`,
				`git checkout --quiet ${ data.repository.branch }`
			].join( ' && ' );

			promise = exec( command );
		}

		return promise
			.then( output => {
				log.info( output );

				const commandOutput = {
					logs: log.all()
				};

				if ( data.options.recursive ) {
					const packageJson = require( path.join( destinationPath, 'package.json' ) );
					const packages = [];

					if ( packageJson.dependencies ) {
						packages.push( ...Object.keys( packageJson.dependencies ) );
					}

					if ( packageJson.devDependencies ) {
						packages.push( ...Object.keys( packageJson.devDependencies ) );
					}

					commandOutput.packages = packages;
				}

				return Promise.resolve( commandOutput );
			} )
			.catch( error => {
				if ( isRemoteHungUpError( error ) && !data.doNotTryAgain ) {
					const newData = Object.assign( {}, data, {
						doNotTryAgain: true
					} );

					return delay( 5000 ).then( () => {
						return command.execute( newData );
					} );
				}

				log.error( error );

				return Promise.reject( { logs: log.all() } );
			} );
	},

	/**
	 * @param {Set} processedPackages Collection of processed packages.
	 */
	afterExecute( processedPackages ) {
		console.log( chalk.cyan( `${ processedPackages.size } packages have been processed.` ) );
	}
};

module.exports = command;

// See: #87 and #92.
function isRemoteHungUpError( error ) {
	if ( typeof error != 'string' ) {
		error = error.toString();
	}

	const fatalErrors = error.split( '\n' )
		.filter( message => message.startsWith( 'fatal:' ) )
		.map( message => message.trim() );

	return fatalErrors[ 0 ] && fatalErrors[ 0 ].match( /fatal: the remote end hung up unexpectedly/i );
}

function delay( ms ) {
	return new Promise( resolve => {
		setTimeout( resolve, ms );
	} );
}
