#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

import { createRequire } from 'module';
import { Listr } from 'listr2';
import * as releaseTools from '@ckeditor/ckeditor5-dev-release-tools';

const require = createRequire( import.meta.url );

const latestVersion = releaseTools.getLastFromChangelog();
const versionChangelog = releaseTools.getChangesForVersion( latestVersion );

const tasks = new Listr( [
	{
		title: 'Verifying the repository.',
		task: async () => {
			const errors = await releaseTools.validateRepositoryToRelease( {
				version: latestVersion,
				changes: versionChangelog,
				branch: 'master'
			} );

			if ( !errors.length ) {
				return;
			}

			return Promise.reject( 'Aborted due to errors.\n' + errors.map( message => `* ${ message }` ).join( '\n' ) );
		}
	},
	{
		title: 'Updating the `#version` field.',
		task: () => {
			return releaseTools.updateVersions( {
				version: latestVersion
			} );
		}
	},
	{
		title: 'Creating the `mrgit2` package in the release directory.',
		task: () => {
			return releaseTools.prepareRepository( {
				outputDirectory: 'release',
				rootPackageJson: require( '../package.json' )
			} );
		}
	},
	{
		title: 'Cleaning-up.',
		task: () => {
			return releaseTools.cleanUpPackages( {
				packagesDirectory: 'release'
			} );
		}
	},
	{
		title: 'Commit & tag.',
		task: () => {
			return releaseTools.commitAndTag( {
				version: latestVersion,
				files: [
					'package.json'
				]
			} );
		}
	}
] );

tasks.run()
	.catch( err => {
		process.exitCode = 1;

		console.log( '' );
		console.error( err );
	} );
