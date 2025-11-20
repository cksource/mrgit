#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs-extra';
import { Listr } from 'listr2';
import { ListrInquirerPromptAdapter } from '@listr2/prompt-adapter-inquirer';
import { confirm } from '@inquirer/prompts';
import * as releaseTools from '@ckeditor/ckeditor5-dev-release-tools';
import parseArguments from './utils/parsearguments.mjs';
import getListrOptions from './utils/getlistroptions.mjs';
import { RELEASE_DIRECTORY } from './utils/constants.mjs';

const cliArguments = parseArguments( process.argv.slice( 2 ) );
const latestVersion = releaseTools.getLastFromChangelog();
const versionChangelog = releaseTools.getChangesForVersion( latestVersion );

const tasks = new Listr( [
	{
		title: 'Verifying the repository.',
		task: async () => {
			const errors = await releaseTools.validateRepositoryToRelease( {
				version: latestVersion,
				changes: versionChangelog,
				branch: cliArguments.branch
			} );

			if ( !errors.length ) {
				return;
			}

			return Promise.reject( 'Aborted due to errors.\n' + errors.map( message => `* ${ message }` ).join( '\n' ) );
		},
		skip: () => {
			// When compiling the packages only, do not validate the release.
			if ( cliArguments.compileOnly ) {
				return true;
			}

			return false;
		}
	},
	{
		title: 'Check the release directory.',
		task: async ( ctx, task ) => {
			const isAvailable = await fs.exists( RELEASE_DIRECTORY );

			if ( !isAvailable ) {
				return fs.ensureDir( RELEASE_DIRECTORY );
			}

			const isEmpty = ( await fs.readdir( RELEASE_DIRECTORY ) ).length === 0;

			if ( isEmpty ) {
				return Promise.resolve();
			}

			// Do not ask when running on CI.
			if ( cliArguments.ci ) {
				return fs.emptyDir( RELEASE_DIRECTORY );
			}

			const shouldContinue = await task.prompt( ListrInquirerPromptAdapter )
				.run( confirm, {
					message: 'The release directory must be empty. Continue and remove all files?'
				} );

			if ( !shouldContinue ) {
				return Promise.reject( 'Aborting as requested.' );
			}

			return fs.emptyDir( RELEASE_DIRECTORY );
		}
	},
	{
		title: 'Updating the `#version` field.',
		task: () => {
			return releaseTools.updateVersions( {
				version: latestVersion
			} );
		},
		skip: () => {
			// When compiling the packages only, do not validate the release.
			if ( cliArguments.compileOnly ) {
				return true;
			}

			return false;
		}
	},
	{
		title: 'Creating the `mrgit2` package in the release directory.',
		task: async () => {
			return releaseTools.prepareRepository( {
				outputDirectory: RELEASE_DIRECTORY,
				// `cwd` points to the repository root directory.
				rootPackageJson: await fs.readJson( './package.json' )
			} );
		}
	},
	{
		title: 'Cleaning-up.',
		task: () => {
			return releaseTools.cleanUpPackages( {
				packagesDirectory: RELEASE_DIRECTORY,
				packageJsonFieldsToRemove: defaults => [ ...defaults, 'engines.yarn', 'engines.pnpm' ]
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
		},
		skip: () => {
			// When compiling the packages only, do not validate the release.
			if ( cliArguments.compileOnly ) {
				return true;
			}

			return false;
		}
	}
], getListrOptions( cliArguments ) );

tasks.run()
	.catch( err => {
		process.exitCode = 1;

		console.log( '' );
		console.error( err );
	} );
