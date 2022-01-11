/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
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
	execute( data ) {
		const execCommand = require( './exec' );

		const promises = [
			execCommand.execute( getExecData( 'git rev-parse HEAD' ) ),
			execCommand.execute( getExecData( 'git status --branch --porcelain' ) )
		];

		return Promise.all( promises )
			.then( ( [ hashResponse, statusResponse ] ) => {
				let packageName = data.packageName;

				for ( const packagePrefix of data.toolOptions.packagesPrefix ) {
					packageName = packageName.replace( new RegExp( '^' + packagePrefix ), '' );
				}

				const commandResponse = {
					packageName,
					status: gitStatusParser( statusResponse.logs.info[ 0 ] ),
					commit: hashResponse.logs.info[ 0 ].slice( 0, 7 ), // Short version of the commit hash.
					mrgitBranch: data.repository.branch
				};

				return { response: commandResponse };
			} );

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

		const table = new Table( {
			head: [ 'Package', 'Branch', 'Commit', 'Status' ],
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
		console.log( getLegend() );

		function createSingleRow( { packageName, status, mrgitBranch, commit } ) {
			const wholeRow = [];
			const statusColumn = [];

			const wholeRowColor = status.branch !== 'master' ? 'magenta' : null;
			let branch = status.branch;

			// Unmerged files are also modified so we should print the number of them out.
			const modifiedFiles = [ status.modified, status.unmerged ]
				.reduce( ( sum, item ) => sum + item.length, 0 );

			if ( mrgitBranch !== status.branch ) {
				branch = `${ color( 'cyan', '!' ) } ${ branch }`;
			}

			if ( status.ahead ) {
				branch += color( 'yellow', ` ↑${ status.ahead }` );
			}

			if ( status.behind ) {
				branch += color( 'yellow', ` ↓${ status.behind }` );
			}

			if ( status.staged.length ) {
				statusColumn.push( color( 'green', `+${ status.staged.length }` ) );
			}

			if ( modifiedFiles ) {
				statusColumn.push( color( 'red', `M${ modifiedFiles }` ) );
			}

			if ( status.untracked.length ) {
				statusColumn.push( color( 'blue', `?${ status.untracked.length }` ) );
			}

			wholeRow.push( color( wholeRowColor, packageName ) );
			wholeRow.push( color( wholeRowColor, branch ) );
			wholeRow.push( color( wholeRowColor, commit ) );
			wholeRow.push( statusColumn.join( ' ' ) );

			return wholeRow;
		}

		function getLegend() {
			const legend = [
				`${ color( 'yellow', '↑' ) } branch is ahead ${ color( 'yellow', '↓' ) } or behind`,
				`${ color( 'green', '+' ) } staged files`,
				`${ color( 'red', 'M' ) } modified files`,
				`${ color( 'blue', '?' ) } untracked files`,
				`\n${ color( 'cyan', '!' ) } not on a branch specified in "mrgit.json"`
			];

			return `${ chalk.bold( 'Legend:' ) }\n${ legend.join( ', ' ) }.`;
		}

		function color( colorName, value ) {
			if ( !colorName ) {
				return value;
			}

			return chalk[ colorName ]( value );
		}
	}
};
