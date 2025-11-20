/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';
import execCommand from './exec.js';
import { gitStatusParser } from '../utils/gitstatusparser.js';
import { logFactory } from '../utils/log.js';

export default {
	name: 'checkout',

	get helpMessage() {
		const {
			gray: g,
			underline: u,
			yellow: y
		} = chalk;

		return `
    ${ u( 'Description:' ) }
        Checks out the repository to specified branch or commit saved in configuration file.

        If specified a branch as an argument for "checkout" command, mrgit will use the branch
        instead of data saved in configuration file. E.g "${ g( 'mrgit checkout master' ) }" will check out
        all branches to "master".

        You can also call "${ g( 'mrgit checkout .' ) }" in order to restore files before changes.

    ${ u( 'Options:' ) }
        ${ y( '--branch' ) } (-b)             If specified, mrgit will create given branch in all repositories
                                  that contain changes that could be committed.
                                  ${ g( '> mrgit checkout --branch develop' ) }
		`;
	},

	/**
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	execute( data ) {
		// Used `--branch` option.
		if ( data.toolOptions.branch ) {
			return this._createAndCheckout( data.toolOptions.branch, data );
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
		const log = logFactory();

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
