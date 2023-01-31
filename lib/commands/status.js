/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const Table = require( 'cli-table' );
const gitStatusParser = require( '../utils/gitstatusparser' );

module.exports = {
	name: 'status',

	get helpMessage() {
		const {
			underline: u
		} = chalk;

		return `
    ${ u( 'Description:' ) }
        Prints a useful table that contains status of every repository. It displays:

            * current branch,
            * whether current branch is equal to specified in "mrgit.json" file,
            * whether current branch is behind or ahead with the remote,
            * current commit short hash,
            * how many files is staged, modified and untracked.
		`;
	},

	beforeExecute() {
		console.log( chalk.blue( 'Collecting statuses...' ) );
	},

	/**
	 * @param {CommandData} data
	 * @returns {Promise}
	 */
	async execute( data ) {
		const execCommand = require( './exec' );

		let latestTag = null;
		let currentTag = null;
		let packageName = data.packageName;

		const hashResponse = await execCommand.execute( getExecData( 'git rev-parse HEAD' ) );
		const currentBranchStatusResponse = await execCommand.execute( getExecData( 'git status --branch --porcelain' ) );
		const latestTagStatusResponse = await execCommand.execute( getExecData( 'git log --tags --simplify-by-decoration --pretty="%S"' ) );

		if ( latestTagStatusResponse.logs.info.length ) {
			const currentTagStatusResponse = await execCommand.execute( getExecData( 'git describe --abbrev=0 --tags' ) );

			latestTag = latestTagStatusResponse.logs.info[ 0 ].trim().split( '\n' ).shift();
			currentTag = currentTagStatusResponse.logs.info[ 0 ];
		}

		for ( const packagePrefix of data.toolOptions.packagesPrefix ) {
			packageName = packageName.replace( new RegExp( '^' + packagePrefix ), '' );
		}

		const commandResponse = {
			packageName,
			status: gitStatusParser( currentBranchStatusResponse.logs.info[ 0 ], currentTag ),
			commit: hashResponse.logs.info[ 0 ].slice( 0, 7 ), // Short version of the commit hash.
			mrgitBranch: data.repository.branch,
			mrgitTag: data.repository.tag,
			latestTag
		};

		return { response: commandResponse };

		function getExecData( command ) {
			return Object.assign( {}, data, {
				arguments: [ command ]
			} );
		}
	},

	/**
	 * Saves collected hashes to configuration file.
	 *
	 * @param {Set} processedPackages Collection of processed packages.
	 * @param {Set} commandResponses Results of executed command for each package.
	 */
	afterExecute( processedPackages, commandResponses ) {
		if ( !processedPackages.size || !commandResponses.size ) {
			return;
		}

		let shouldDisplayLatestHint = false;
		let shouldDisplaySyncHint = false;

		const table = new Table( {
			head: [ 'Package', 'Branch/Tag', 'Commit', 'Status' ],
			style: {
				compact: true
			}
		} );

		const packagesResponses = Array.from( commandResponses.values() )
			.sort( ( a, b ) => {
				/* istanbul ignore else */
				if ( a.packageName < b.packageName ) {
					return -1;
				} else if ( a.packageName > b.packageName ) {
					return 1;
				}

				/* istanbul ignore next */
				return 0;
			} );

		for ( const singleResponse of packagesResponses ) {
			table.push( createSingleRow( singleResponse ) );
		}

		console.log( table.toString() );
		displayLegend();
		displayHints( shouldDisplayLatestHint, shouldDisplaySyncHint );

		function createSingleRow( data ) {
			const { packageName, status, commit, mrgitBranch, mrgitTag, latestTag } = data;
			const statusColumn = [];

			const shouldUseTag = mrgitTag !== undefined;
			const shouldUseLatestTag = mrgitTag === 'latest';
			let branchOrTag = !status.detachedHead ? status.branch : status.tag;

			// Unmerged files are also modified so we should print the number of them out.
			const modifiedFiles = [ status.modified, status.unmerged ]
				.reduce( ( sum, item ) => sum + item.length, 0 );

			if ( shouldUseTag && shouldUseLatestTag && status.detachedHead && status.tag === latestTag ) {
				branchOrTag = `${ chalk.green( 'L' ) } ${ branchOrTag }`;
				shouldDisplayLatestHint = true;
			}

			if ( shouldUseTag && shouldUseLatestTag && ( !status.detachedHead || status.tag !== latestTag ) ) {
				branchOrTag = `${ chalk.cyan( '!' ) } ${ branchOrTag }`;
				shouldDisplaySyncHint = true;
			}

			if ( shouldUseTag && !shouldUseLatestTag && status.tag !== mrgitTag ) {
				branchOrTag = `${ chalk.cyan( '!' ) } ${ branchOrTag }`;
				shouldDisplaySyncHint = true;
			}

			if ( !shouldUseTag && status.branch !== mrgitBranch && commit !== mrgitBranch ) {
				branchOrTag = `${ chalk.cyan( '!' ) } ${ branchOrTag }`;
				shouldDisplaySyncHint = true;
			}

			if ( !shouldUseTag && mrgitBranch === commit ) {
				branchOrTag = 'Using saved commit →';
			}

			if ( status.ahead ) {
				branchOrTag += chalk.yellow( ` ↑${ status.ahead }` );
			}

			if ( status.behind ) {
				branchOrTag += chalk.yellow( ` ↓${ status.behind }` );
			}

			if ( status.staged.length ) {
				statusColumn.push( chalk.green( `+${ status.staged.length }` ) );
			}

			if ( modifiedFiles ) {
				statusColumn.push( chalk.red( `M${ modifiedFiles }` ) );
			}

			if ( status.untracked.length ) {
				statusColumn.push( chalk.blue( `?${ status.untracked.length }` ) );
			}

			return [
				packageName,
				branchOrTag,
				commit,
				statusColumn.join( ' ' )
			];
		}

		function displayLegend() {
			const legend = [
				`${ chalk.yellow( '↑' ) } branch is ahead ${ chalk.yellow( '↓' ) } or behind`,
				`${ chalk.green( '+' ) } staged files`,
				`${ chalk.red( 'M' ) } modified files`,
				`${ chalk.blue( '?' ) } untracked files`,
				`\n${ chalk.green( 'L' ) } latest tag`,
				`${ chalk.cyan( '!' ) } not on a branch or a tag specified in "mrgit.json"`
			];

			console.log( `${ chalk.bold( 'Legend:' ) }\n${ legend.join( ', ' ) }.` );
		}

		function displayHints( shouldDisplayLatestHint, shouldDisplaySyncHint ) {
			const hints = [];

			if ( shouldDisplayLatestHint ) {
				hints.push( [
					chalk.green( 'L' ),
					'This is the latest local tag. To ensure having latest remote tag, execute',
					chalk.blue( 'mrgit fetch' ),
					'before checking status.'
				].join( ' ' ) );
			}

			if ( shouldDisplaySyncHint ) {
				hints.push( [
					chalk.cyan( '!' ),
					'In order to bring your repositories up to date, execute',
					chalk.blue( 'mrgit sync' )
				].join( ' ' ) + '.' );
			}

			if ( !hints.length ) {
				return;
			}

			console.log( `\n${ chalk.bold( 'Hints:' ) }\n${ hints.join( '\n' ) }` );
		}
	}
};
