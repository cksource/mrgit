/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );
const chalk = require( 'chalk' );
const shell = require( '../utils/shell' );

module.exports = {
	get helpMessage() {
		const {
			gray: g,
			magenta: m,
			underline: u
		} = chalk;

		return `
    ${ u( 'Description:' ) }
        Updates all packages. For packages that contain uncommitted changes, the update process is aborted.
        If some package is missed, it will be installed automatically.

        The update process executes following commands:

            * Checks whether repository can be updated. If the repository contains uncommitted changes,
              the process is aborted.
            * Fetches changes from the remote.
            * Checks out on the branch or particular commit that is specified in "mrgit.json" file.
            * Pulls the changes if the repository is not detached at some commit.

    ${ u( 'Options:' ) }
        ${ m( '--recursive' ) } (-r)            Whether to install dependencies recursively. Only packages matching these
                                    patterns will be cloned recursively.
                                    ${ g( 'Default: false' ) }
		`;
	},

	/**
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	execute( data ) {
		const log = require( '../utils/log' )();
		const execCommand = require( './exec' );

		const destinationPath = path.join( data.toolOptions.packages, data.repository.directory );

		// Package is not cloned.
		if ( !fs.existsSync( destinationPath ) ) {
			log.info( `Package "${ data.packageName }" was not found. Cloning...` );

			return this._clonePackage( {
				path: destinationPath,
				name: data.packageName,
				url: data.repository.url,
				branch: data.repository.branch,
				tag: data.repository.tag
			}, data.toolOptions, { log } );
		}

		return execCommand.execute( getExecData( 'git status -s' ) )
			.then( async response => {
				const stdout = response.logs.info.join( '\n' ).trim();

				if ( stdout ) {
					throw new Error( `Package "${ data.packageName }" has uncommitted changes. Aborted.` );
				}

				return execCommand.execute( getExecData( 'git fetch' ) );
			} )
			.then( response => {
				log.concat( response.logs );
			} )
			.then( async () => {
				let checkoutValue;

				if ( !data.repository.tag ) {
					checkoutValue = data.repository.branch;
				} else if ( data.repository.tag === 'latest' ) {
					const commandOutput = await execCommand.execute(
						getExecData( 'git log --tags --simplify-by-decoration --pretty="%S"' )
					);
					const latestTag = commandOutput.logs.info[ 0 ].trim().split( '\n' ).shift();

					checkoutValue = 'tags/' + latestTag.trim();
				} else {
					checkoutValue = 'tags/' + data.repository.tag;
				}

				return execCommand.execute( getExecData( `git checkout "${ checkoutValue }"` ) );
			} )
			.then( response => {
				log.concat( response.logs );
			} )
			.then( () => {
				return execCommand.execute( getExecData( 'git branch' ) );
			} )
			.then( response => {
				const stdout = response.logs.info.join( '\n' ).trim();
				const isOnBranchRegexp = /HEAD detached at+/;

				// If on a detached commit, mrgit must not pull the changes.
				if ( isOnBranchRegexp.test( stdout ) ) {
					log.info( `Package "${ data.packageName }" is on a detached commit.` );

					return { logs: log.all() };
				}

				return execCommand.execute( getExecData( `git pull origin "${ data.repository.branch }"` ) )
					.then( response => {
						log.concat( response.logs );

						return { logs: log.all() };
					} );
			} )
			.catch( commandResponseOrError => {
				if ( commandResponseOrError instanceof Error ) {
					log.error( commandResponseOrError.message );
				} else {
					log.concat( commandResponseOrError.logs );
				}

				return Promise.reject( { logs: log.all() } );
			} );

		function getExecData( command ) {
			return Object.assign( {}, data, {
				arguments: [ command ]
			} );
		}
	},

	/**
	 * @param {Set} parsedPackages Collection of processed packages.
	 */
	afterExecute( parsedPackages, commandResponses, toolOptions ) {
		console.log( chalk.cyan( `${ parsedPackages.size } packages have been processed.` ) );

		const repositoryResolver = require( toolOptions.resolverPath );

		const repositoryDirectories = Object.keys( toolOptions.dependencies )
			.map( packageName => {
				const repository = repositoryResolver( packageName, toolOptions );

				return path.join( toolOptions.packages, repository.directory );
			} );

		const skippedPackages = fs.readdirSync( toolOptions.packages )
			.map( directoryName => {
				const absolutePath = path.join( toolOptions.packages, directoryName );

				if ( !directoryName.startsWith( '@' ) ) {
					return absolutePath;
				}

				return fs.readdirSync( absolutePath ).map( directoryName => path.join( absolutePath, directoryName ) );
			} )
			// TODO: Array.prototype.flat would be awesome here... But it isn't supported in Node yet.
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
			.reduce( ( pathsCollection, pathOrArrayPaths ) => {
				if ( Array.isArray( pathOrArrayPaths ) ) {
					pathsCollection.push( ...pathOrArrayPaths );
				} else {
					pathsCollection.push( pathOrArrayPaths );
				}

				return pathsCollection;
			}, [] )
			.filter( pathOrDirectory => {
				if ( !fs.lstatSync( pathOrDirectory ).isDirectory() ) {
					return false;
				}

				return !repositoryDirectories.includes( pathOrDirectory );
			} );

		if ( skippedPackages.length ) {
			console.log(
				chalk.yellow( 'Paths to directories listed below are skipped by mrgit because they are not defined in "mrgit.json":' )
			);

			skippedPackages.forEach( absolutePath => {
				console.log( chalk.yellow( `  - ${ absolutePath }` ) );
			} );
		}
	},

	/**
	 * @private
	 * @param {Object} packageDetails
	 * @param {String} packageDetails.name A name of the package.
	 * @param {String} packageDetails.url A url that will be cloned.
	 * @param {String} packageDetails.path An absolute path where the package should be cloned.
	 * @param {String} packageDetails.branch A branch on which the repository will be checked out after cloning.
	 * @param {Options} toolOptions Options resolved by mrgit.
	 * @param {Object} options Additional options which aren't related to mrgit.
	 * @param {Logger} options.log Logger
	 * @param {Boolean} [options.doNotTryAgain=false] If set to `true`, bootstrap command won't be executed again.
	 * @returns {Promise}
	 */
	_clonePackage( packageDetails, toolOptions, options ) {
		const log = options.log;

		return shell( `git clone --progress "${ packageDetails.url }" "${ packageDetails.path }"` )
			.then( async output => {
				log.info( output );

				let checkoutValue;

				if ( !packageDetails.tag ) {
					checkoutValue = packageDetails.branch;
				} else if ( packageDetails.tag === 'latest' ) {
					const commandOutput = await shell(
						`cd "${ packageDetails.path }" && git log --tags --simplify-by-decoration --pretty="%S"`
					);
					const latestTag = commandOutput.trim().split( '\n' ).shift();

					checkoutValue = 'tags/' + latestTag.trim();
				} else {
					checkoutValue = 'tags/' + packageDetails.tag;
				}

				return shell( `cd "${ packageDetails.path }" && git checkout --quiet "${ checkoutValue }"` );
			} )
			.then( () => {
				const commandOutput = {
					logs: log.all()
				};

				if ( toolOptions.recursive ) {
					const packageJson = require( path.join( packageDetails.path, 'package.json' ) );
					const packages = [];

					if ( packageJson.dependencies ) {
						packages.push( ...Object.keys( packageJson.dependencies ) );
					}

					if ( packageJson.devDependencies ) {
						packages.push( ...Object.keys( packageJson.devDependencies ) );
					}

					commandOutput.packages = packages;
				}

				return commandOutput;
			} )
			.catch( error => {
				/* istanbul ignore else */
				if ( isRemoteHungUpError( error ) && !options.doNotTryAgain ) {
					return delay( 5000 ).then( () => {
						return this._clonePackage( packageDetails, toolOptions, { log, doNotTryAgain: true } );
					} );
				}

				log.error( error );

				return Promise.reject( { logs: log.all() } );
			} );
	}
};

// See: https://github.com/cksource/mrgit/issues/87
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
