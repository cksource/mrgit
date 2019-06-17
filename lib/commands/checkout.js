/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const execCommand = require( './exec' );
const gitStatusParser = require( '../utils/gitstatusparser' );

module.exports = {
	name: 'checkout',

	get helpMessage() {
		const {
			gray: g,
			underline: u,
			yellow: y
		} = chalk;

		return `
    ${ u( 'Description:' ) }
        Checks out the repository to specified branch or commit saved in "mgit.json" file.
        
        If specified a branch as an argument for "checkout" command, mgit will use the branch 
        instead of data saved in "mgit.json". E.g "${ g( 'mgit checkout master' ) }" will check out
        all branches to "master".

        You can also call "${ g( 'mgit checkout .' ) }" in order to restore files before changes.
        
    ${ u( 'Options:' ) }
        ${ y( '--branch' ) } (-b)             If specified, mgit will create given branch in all repositories
                                  that contain changes that could be committed.
                                  ${ g( '> mgit checkout --branch develop' ) }    
		`;
	},

	/**
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	execute( data ) {
		// Used `--branch` option.
		if ( data.mgitOptions.branch ) {
			return this._createAndCheckout( data.mgitOptions.branch, data );
		}

		const branch = data.arguments[ 0 ] || data.repository.branch;
		const checkoutCommand = `git checkout ${ branch }`;

		return execCommand.execute( this._getExecData( checkoutCommand, data ) );
	},

	/**
	 * Executes "git checkout -b `branch`" command if a repository contains changes which could be committed.
	 *
	 * @private
	 * @param {String} branch
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	_createAndCheckout( branch, data ) {
		const log = require( '../utils/log' )();

		return execCommand.execute( this._getExecData( 'git status --branch --porcelain', data ) )
			.then( execResponse => {
				const status = gitStatusParser( execResponse.logs.info[ 0 ] );

				if ( !status.anythingToCommit ) {
					log.info( 'Repository does not contain changes to commit. New branch was not created.' );

					return {
						logs: log.all()
					};
				}

				const checkoutCommand = `git checkout -b ${ branch }`;

				return execCommand.execute( this._getExecData( checkoutCommand, data ) );
			} );
	},

	/**
	 * Prepares new configuration object for "execute" command which is called inside this command.
	 *
	 * @private
	 * @param {String} command
	 * @param {CommandData} data
	 * @returns {CommandData}
	 */
	_getExecData( command, data ) {
		return Object.assign( {}, data, {
			arguments: [ command ]
		} );
	}
};
