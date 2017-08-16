/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const gitStatusParser = require( '../../lib/utils/gitstatusparser' );

const gitStatusResponse = [
	'## master...origin/master',
	'R  CHANGELOG.txt -> CHANGELOG.md',
	' D README.txt',
	'?? README.md',
	'A  .eslintrc.js',
	'?? lib/utils/helper.js',
	' M lib/index.js',
	' M lib/tasks/logger.js',
	' D lib/tasks/.gitkeep',
	'?? tests/utils/helper.js',
	'M  tests/index.js',
	'M  tests/tasks/logger.js',
	'D  tests/tasks/.gitkeep',
	'DU bin/unmerged_deleted-by-us',
	'AU bin/unmerged_added-by-us',
	'UD bin/unmerged_deleted-by-them',
	'UA bin/unmerged_added-by-them',
	'DD bin/unmerged_both-deleted',
	'AA bin/unmerged_both-added',
	'UU bin/unmerged_both-modified'
].join( '\n' );

describe( 'utils', () => {
	describe( 'gitStatusParser()', () => {
		it( 'returns branch name for freshly created', () => {
			const status = gitStatusParser( '## master' );

			expect( status.branch ).to.equal( 'master' );
		} );

		it( 'returns branch name even if the upstream is set', () => {
			const status = gitStatusParser( '## master...origin/master' );

			expect( status.branch ).to.equal( 'master' );
		} );

		it( 'returns number of commits being behind the remote branch', () => {
			const status = gitStatusParser( '## master [behind 3 ahead 6]' );

			expect( status.behind ).to.equal( 3 );
		} );

		it( 'returns number of commits being ahead the remote branch', () => {
			const status = gitStatusParser( '## master [behind 3 ahead 6]' );

			expect( status.ahead ).to.equal( 6 );
		} );

		it( 'returns a list with modified files', () => {
			const status = gitStatusParser( gitStatusResponse );

			expect( status.modified ).to.deep.equal( [
				'lib/index.js',
				'lib/tasks/logger.js'
			] );
		} );

		it( 'returns a list with deleted files', () => {
			const status = gitStatusParser( gitStatusResponse );

			expect( status.deleted ).to.deep.equal( [
				'README.txt',
				'lib/tasks/.gitkeep',
				'tests/tasks/.gitkeep',
			] );
		} );

		it( 'returns a list with renamed files', () => {
			const status = gitStatusParser( gitStatusResponse );

			expect( status.renamed ).to.deep.equal( [
				'CHANGELOG.txt -> CHANGELOG.md',
			] );
		} );

		it( 'returns a list with unmerged files (conflicts)', () => {
			const status = gitStatusParser( gitStatusResponse );

			expect( status.unmerged ).to.deep.equal( [
				'bin/unmerged_deleted-by-us',
				'bin/unmerged_added-by-us',
				'bin/unmerged_deleted-by-them',
				'bin/unmerged_added-by-them',
				'bin/unmerged_both-deleted',
				'bin/unmerged_both-added',
				'bin/unmerged_both-modified'
			] );
		} );

		it( 'returns a list with added files', () => {
			const status = gitStatusParser( gitStatusResponse );

			expect( status.added ).to.deep.equal( [
				'.eslintrc.js',
			] );
		} );

		it( 'returns a list with untracked files', () => {
			const status = gitStatusParser( gitStatusResponse );

			expect( status.untracked ).to.deep.equal( [
				'README.md',
				'lib/utils/helper.js',
				'tests/utils/helper.js',
			] );
		} );

		it( 'returns a list with modified files (staged and not staged)', () => {
			const gitStatusResponse = [
				'## master...origin/master',
				' M lib/index.js', // modified, not staged
				'MM lib/tasks/logger.js', // modified, a part of the changes is staged
				'M  tests/index.js', // modified, the whole file is staged
			].join( '\n' );

			const status = gitStatusParser( gitStatusResponse );

			expect( status.staged ).to.deep.equal( [
				'lib/tasks/logger.js',
				'tests/index.js'
			] );

			expect( status.modified ).to.deep.equal( [
				'lib/index.js',
				'lib/tasks/logger.js'
			] );
		} );
	} );
} );
