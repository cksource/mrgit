/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'upath' );
const chalk = require( 'chalk' );
const shell = require( '../utils/shell' );
const buildOptions = require( 'minimist-options' );
const minimist = require( 'minimist' );

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
			}, this._parseArguments( data.arguments ) );
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

					return Promise.resolve( { logs: log.all() } );
				}

				return execCommand.execute( getExecData( `git pull origin ${ data.repository.branch }` ) )
					.then( response => {
						log.concat( response.logs );

						return Promise.resolve( { logs: log.all() } );
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
	afterExecute( parsedPackages ) {
		console.log( chalk.cyan( `${ parsedPackages.size } packages have been processed.` ) );
	},

	/**
	 * @private
	 * @param {Object} packageDetails
	 * @param {Object} options Command options.
	 * @returns {Promise}
	 */
	_clonePackage( packageDetails, options ) {
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

				if ( options.recursive ) {
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
	},

	/**
	 * @private
	 * @param {Array.<String>} argv List of arguments provided by the user via CLI.
	 * @returns {Object}
	 */
	_parseArguments( argv ) {
		return minimist( argv, buildOptions( {
			recursive: {
				type: 'boolean',
				alias: 'r',
			}
		} ) );
	}
};
