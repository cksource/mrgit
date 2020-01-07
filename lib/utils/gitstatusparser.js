/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
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
 * @returns {Boolean} data.anythingToCommit Returns true if any changed file could be committed using command `git commit -a`.
 * @returns {String} data.branch Current branch.
 * @returns {Number|null} data.behind Number of commits that branch is behind the remote upstream.
 * @returns {Number|null} data.ahead Number of commits that branch is ahead the remote upstream.
 * @returns {Array.<String>} data.added List of files created files (untracked files are tracked now).
 * @returns {Array.<String>} data.modified List of tracked files that have changed.
 * @returns {Array.<String>} data.deleted List of tracked files that have deleted.
 * @returns {Array.<String>} data.renamed List of tracked files that have moved (or renamed).
 * @returns {Array.<String>} data.unmerged List of tracked files that contain (unresolved) conflicts.
 * @returns {Array.<String>} data.untracked List of untracked files which won't be committed using command `git commit -a`.
 * @returns {Array.<String>} data.staged List of files that their changes are ready to commit.
 */
module.exports = function gitStatusParser( response ) {
	const responseAsArray = response.split( '\n' );
	const branchData = responseAsArray.shift();

	const branch = branchData.split( '...' )[ 0 ].match( /## (.*)$/ )[ 1 ];
	const added = filterFiles( [ ADDED_STAGED_SYMBOL ] );
	const modified = filterFiles( [ MODIFIED_NOT_STAGED_SYMBOL, MODIFIED_STAGED_AND_NOT_STAGED_SYMBOL, DELETE_NOT_STAGED_SYMBOL ] );
	const deleted = filterFiles( [ DELETE_STAGED_SYMBOL, DELETE_NOT_STAGED_SYMBOL ] );
	const renamed = filterFiles( [ RENAMED_STAGED_SYMBOL ] );
	const unmerged = filterFiles( UNMERGED_SYMBOLS );
	const untracked = filterFiles( [ UNTRACKED_SYMBOL ] );
	const staged = filterFiles( [
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
		get anythingToCommit() {
			return [ added, modified, deleted, renamed, unmerged, staged ].some( collection => collection.length );
		},

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

	function filterFiles( prefixes ) {
		return responseAsArray
			.filter( line => prefixes.some( prefix => prefix === line.substring( 0, 2 ) ) )
			.map( line => line.slice( 2 ).trim() );
	}
};
