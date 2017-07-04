/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const childProcess = require( 'child_process' );
const genericPool = require( 'generic-pool' );

/**
 * @param {String} childPath Path to module that will be forked.
 * @returns {Object} response
 * @returns {Boolean} response.isDone
 * @returns {Function} response.enqueue
 * @returns {Promise} response.killAll
 */
module.exports = function createForkPool( childPath ) {
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
