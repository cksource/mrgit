/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
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
            * Checks out on the branch or particular commit that is specified in "mgit.json" file.
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

		const destinationPath = path.join( data.mgitOptions.packages, data.repository.directory );

		// Package is not cloned.
		if ( !fs.existsSync( destinationPath ) ) {
			return this._clonePackage( {
				path: destinationPath,
				name: data.packageName,
				url: data.repository.url,
				branch: data.repository.branch
			}, data.mgitOptions );
		}

		return execCommand.execute( getExecData( 'git status -s' ) )
			.then( response => {
				const stdout = response.logs.info.join( '\n' ).trim();

				if ( stdout ) {
					throw new Error( `Package "${ data.packageName }" has uncommitted changes. Aborted.` );
				}

				return execCommand.execute( getExecData( 'git fetch' ) );
			} )
			.then( response => {
				log.concat( response.logs );
			} )
			.then( () => {
				return execCommand.execute( getExecData( `git checkout ${ data.repository.branch }` ) );
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

				// If on a detached commit, mgit must not pull the changes.
				if ( isOnBranchRegexp.test( stdout ) ) {
					log.info( `Package "${ data.packageName }" is on a detached commit.` );

					return { logs: log.all() };
				}

				return execCommand.execute( getExecData( `git pull origin ${ data.repository.branch }` ) )
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
	afterExecute( parsedPackages, commandResponses, mgitOptions ) {
		console.log( chalk.cyan( `${ parsedPackages.size } packages have been processed.` ) );

		const repositoryResolver = require( mgitOptions.resolverPath );

		const repositoryDirectories = Object.keys( mgitOptions.dependencies )
			.map( packageName => {
				const repository = repositoryResolver( packageName, mgitOptions );

				return path.join( mgitOptions.packages, repository.directory );
			} );

		const skippedPackages = fs.readdirSync( mgitOptions.packages )
			.map( pathOrDirectory => {
				return path.join( mgitOptions.packages, pathOrDirectory );
			} )
			.filter( pathOrDirectory => {
				if ( !fs.lstatSync( pathOrDirectory ).isDirectory() ) {
					return false;
				}

				return !repositoryDirectories.includes( pathOrDirectory );
			} );

		console.log(
			chalk.yellow( 'Paths to directories listed below are skipped by mgit because they are not defined in "mgit.json":' )
		);

		skippedPackages.forEach( absolutePath => {
			console.log( chalk.yellow( `  - ${ absolutePath }` ) );
		} );
	},

	/**
	 * @private
	 * @param {Object} packageDetails
	 * @param {String} packageDetails.name A name of the package.
	 * @param {String} packageDetails.url A url that will be cloned.
	 * @param {String} packageDetails.path An absolute path where the package should be cloned.
	 * @param {String} packageDetails.branch A branch on which the repository will be checked out after cloning.
	 * @param {Options} mgitOptions Options resolved by mgit.
	 * @returns {Promise}
	 */
	_clonePackage( packageDetails, mgitOptions ) {
		const log = require( '../utils/log' )();

		log.info( `Package "${ packageDetails.name }" was not found. Cloning...` );

		const command = [
			`git clone --progress "${ packageDetails.url }" "${ packageDetails.path }"`,
			`cd "${ packageDetails.path }"`,
			`git checkout --quiet ${ packageDetails.branch }`
		].join( ' && ' );

		return shell( command )
			.then( output => {
				log.info( output );

				const commandOutput = {
					logs: log.all()
				};

				if ( mgitOptions.recursive ) {
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
			} );
	}
};
