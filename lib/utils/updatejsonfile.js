/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );

/**
 * Updates JSON file under specified path.
 * @param {String} path Path to file on disk.
 * @param {Function} updateFunction Function that will be called with parsed JSON object. It should return
 * modified JSON object to save.
 */
module.exports = function updateJsonFile( path, updateFunction ) {
	const contents = fs.readFileSync( path, 'utf-8' );
	let json = JSON.parse( contents );
	json = updateFunction( json );

	fs.writeFileSync( path, JSON.stringify( json, null, 2 ) + '\n', 'utf-8' );
};
