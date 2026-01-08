/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import childProcess from 'node:child_process';
import genericPool from 'generic-pool';

/**
 * @param {String} childPath Path to module that will be forked.
 * @returns {Object} response
 * @returns {Boolean} response.isDone
 * @returns {Function} response.enqueue
 * @returns {Promise} response.killAll
 */
export function createForkPool( childPath ) {
	const forkPoolFactory = {
		create() {
			return new Promise( resolve => {
				resolve( childProcess.fork( childPath ) );
			} );
		},

		destroy( child ) {
			child.kill();
		}
	};

	const pool = genericPool.createPool( forkPoolFactory, {
		max: 4,
		min: 2
	} );

	return {
		get isDone() {
			return !pool.pending && !pool.borrowed;
		},

		enqueue( data ) {
			return new Promise( ( resolve, reject ) => {
				pool.acquire()
					.then( child => {
						child.once( 'message', returnedData => {
							pool.release( child );

							resolve( returnedData );
						} );

						child.send( data );
					} )
					.catch( reject );
			} );
		},

		killAll() {
			return pool.drain()
				.then( () => {
					pool.clear();
				} );
		}
	};
};
