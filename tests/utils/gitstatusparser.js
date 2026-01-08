/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { gitStatusParser } from '../../lib/utils/gitstatusparser.js';

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
		describe( '#anythingToCommit', () => {
			it( 'returns false for untracked files', () => {
				const gitStatusResponse = [
					'## master...origin/master',
					'?? README.md',
					'?? .eslintrc.js'
				].join( '\n' );

				const status = gitStatusParser( gitStatusResponse );

				expect( status.anythingToCommit ).toEqual( false );
			} );

			it( 'returns true for any tracked file', () => {
				const gitStatusResponse = [
					'## master...origin/master',
					' M lib/index.js'
				].join( '\n' );

				const status = gitStatusParser( gitStatusResponse );

				expect( status.anythingToCommit ).toEqual( true );
			} );

			it( 'returns true for any tracked file and some untracked', () => {
				const gitStatusResponse = [
					'## master...origin/master',
					' M lib/index.js',
					'?? README.md'
				].join( '\n' );

				const status = gitStatusParser( gitStatusResponse );

				expect( status.anythingToCommit ).toEqual( true );
			} );
		} );

		it( 'returns branch name for freshly created', () => {
			const status = gitStatusParser( '## master' );

			expect( status.branch ).toEqual( 'master' );
		} );

		it( 'returns branch name even if the upstream is set', () => {
			const status = gitStatusParser( '## master...origin/master' );

			expect( status.branch ).toEqual( 'master' );
		} );

		it( 'returns tag name if its available and the repository is in detached head mode', () => {
			const status = gitStatusParser( '## HEAD (no branch)', 'v30.0.0' );

			expect( status.tag ).toEqual( 'v30.0.0' );
		} );

		it( 'returns number of commits being behind the remote branch', () => {
			const status = gitStatusParser( '## master [behind 3 ahead 6]' );

			expect( status.behind ).toEqual( 3 );
		} );

		it( 'returns number of commits being ahead the remote branch', () => {
			const status = gitStatusParser( '## master [behind 3 ahead 6]' );

			expect( status.ahead ).toEqual( 6 );
		} );

		it( 'returns a list with modified files', () => {
			const status = gitStatusParser( gitStatusResponse );

			expect( status.modified ).toEqual( [
				'README.txt',
				'lib/index.js',
				'lib/tasks/logger.js',
				'lib/tasks/.gitkeep'
			] );
		} );

		it( 'returns a list with deleted files', () => {
			const status = gitStatusParser( gitStatusResponse );

			expect( status.deleted ).toEqual( [
				'README.txt',
				'lib/tasks/.gitkeep',
				'tests/tasks/.gitkeep'
			] );
		} );

		it( 'returns a list with renamed files', () => {
			const status = gitStatusParser( gitStatusResponse );

			expect( status.renamed ).toEqual( [
				'CHANGELOG.txt -> CHANGELOG.md'
			] );
		} );

		it( 'returns a list with unmerged files (conflicts)', () => {
			const status = gitStatusParser( gitStatusResponse );

			expect( status.unmerged ).toEqual( [
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

			expect( status.added ).toEqual( [
				'.eslintrc.js'
			] );
		} );

		it( 'returns a list with untracked files', () => {
			const status = gitStatusParser( gitStatusResponse );

			expect( status.untracked ).toEqual( [
				'README.md',
				'lib/utils/helper.js',
				'tests/utils/helper.js'
			] );
		} );

		it( 'returns a list with modified files (staged and not staged)', () => {
			const gitStatusResponse = [
				'## master...origin/master',
				' M lib/index.js', // modified, not staged
				'MM lib/tasks/logger.js', // modified, a part of the changes is staged
				'M  tests/index.js' // modified, the whole file is staged
			].join( '\n' );

			const status = gitStatusParser( gitStatusResponse );

			expect( status.staged ).toEqual( [
				'lib/tasks/logger.js',
				'tests/index.js'
			] );

			expect( status.modified ).toEqual( [
				'lib/index.js',
				'lib/tasks/logger.js'
			] );
		} );
	} );
} );
