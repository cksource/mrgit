/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const UNMERGED_SYMBOLS = [
	'DD', // Deleted by both.
	'UU', // Modified by both.
	'AA', // Added by both.
	'DU', // Deleted by us.
	'AU', // Added by us.
	'UD', // Deleted by them.
	'UA' // Added by them.
];

const DELETE_STAGGED_SYMBOL = 'D ';
const DELETE_NOT_STAGGED_SYMBOL = ' D';
const MODIFIED_STAGGED_SYMBOL = 'M ';
const MODIFIED_NOT_STAGGED_SYMBOL = ' M';
const RENAMED_STAGGED_SYMBOL = 'R ';
const ADDED_STAGGED_SYMBOL = 'A ';
const UNTRACKED_SYMBOL = '??';

/**
 * @param {String} response An output returned by `git status -sb` command.
 * @returns {Object} data
 */
module.exports = function gitStatusParser( response ) {
	const responseAsArray = response.split( '\n' );
	const branchData = responseAsArray.shift();

	const branch = branchData.split( '...' )[ 0 ].match( /## (.*)$/ )[ 1 ];
	const added = findFiles( [ ADDED_STAGGED_SYMBOL ] );
	const modified = findFiles( [ MODIFIED_STAGGED_SYMBOL, MODIFIED_NOT_STAGGED_SYMBOL ] );
	const deleted = findFiles( [ DELETE_STAGGED_SYMBOL, DELETE_NOT_STAGGED_SYMBOL ] );
	const renamed = findFiles( [ RENAMED_STAGGED_SYMBOL ] );
	const unmerged = findFiles( UNMERGED_SYMBOLS );
	const untracked = findFiles( [ UNTRACKED_SYMBOL ] );
	const stagged = findFiles( [ ADDED_STAGGED_SYMBOL, DELETE_STAGGED_SYMBOL, MODIFIED_STAGGED_SYMBOL, RENAMED_STAGGED_SYMBOL ] );

	let behind = branchData.match( /behind (\d+)/ );
	let ahead = branchData.match( /ahead (\d+)/ );

	if ( behind ) {
		behind = parseInt( behind[ 1 ], 10 );
	}

	if ( ahead ) {
		ahead = parseInt( ahead[ 1 ], 10 );
	}

	return {
		branch,
		behind,
		ahead,
		added,
		modified,
		deleted,
		renamed,
		unmerged,
		untracked,
		stagged
	};

	function findFiles( prefixes ) {
		const prefixesAsRegExp = new RegExp( `^${ prefixes.join( '|' ).replace( /\?/g, '\\?' ) } ` );

		return responseAsArray
			.filter( line => prefixes.some( prefix => line.trim().startsWith( prefix ) ) )
			.map( line => line.replace( prefixesAsRegExp, '' ).trim() );
	}
};
