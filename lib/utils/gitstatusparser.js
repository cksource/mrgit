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

const DELETE_STAGED_SYMBOL = 'D ';
const DELETE_NOT_STAGED_SYMBOL = ' D';
const MODIFIED_STAGED_SYMBOL = 'M ';
const MODIFIED_NOT_STAGED_SYMBOL = ' M';
const MODIFIED_STAGED_AND_NOT_STAGED_SYMBOL = 'MM';
const RENAMED_STAGED_SYMBOL = 'R ';
const ADDED_STAGED_SYMBOL = 'A ';
const UNTRACKED_SYMBOL = '??';

/**
 * @param {String} response An output returned by `git status -sb` command.
 * @returns {Object} data
 */
module.exports = function gitStatusParser( response ) {
	const responseAsArray = response.split( '\n' );
	const branchData = responseAsArray.shift();

	const branch = branchData.split( '...' )[ 0 ].match( /## (.*)$/ )[ 1 ];
	const added = findFiles( [ ADDED_STAGED_SYMBOL ] );
	const modified = findFiles( [ MODIFIED_NOT_STAGED_SYMBOL, MODIFIED_STAGED_AND_NOT_STAGED_SYMBOL ] );
	const deleted = findFiles( [ DELETE_STAGED_SYMBOL, DELETE_NOT_STAGED_SYMBOL ] );
	const renamed = findFiles( [ RENAMED_STAGED_SYMBOL ] );
	const unmerged = findFiles( UNMERGED_SYMBOLS );
	const untracked = findFiles( [ UNTRACKED_SYMBOL ] );
	const staged = findFiles( [
		ADDED_STAGED_SYMBOL,
		DELETE_STAGED_SYMBOL,
		MODIFIED_STAGED_SYMBOL,
		MODIFIED_STAGED_AND_NOT_STAGED_SYMBOL,
		RENAMED_STAGED_SYMBOL
	] );

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
		staged
	};

	function findFiles( prefixes ) {
		return responseAsArray
			.filter( line => prefixes.some( prefix => prefix === line.substring( 0, 2 ) ) )
			.map( line => line.slice( 2 ).trim() );
	}
};
