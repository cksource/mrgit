/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const Table = require( 'cli-table' );
const gitStatusParser = require( '../utils/gitstatusparser' );

module.exports = {
	beforeExecute() {
		console.log( chalk.blue( 'Collecting package statuses...' ) );
	},

	/**
	 * @param {Object} data
	 * @param {Options} data.options Mgit options.
	 * @param {String} data.packageName Name of current package to process.
	 * @param {Object} data.repository
	 * @param {String} data.repository.branch Name of branch (or commit hash) saved in `mgit.json` file.
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

				if ( data.options.packagesPrefix ) {
					packageName = packageName.replace( data.options.packagesPrefix, '' );
				}

				const commandResponse = {
					packageName,
					status: gitStatusParser( statusResponse.logs.info[ 0 ] ),
					commit: hashResponse.logs.info[ 0 ].slice( 0, 7 ), // Short version of the commit hash.
					mgitBranch: data.repository.branch
				};

				return Promise.resolve( {
					response: commandResponse
				} );
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

		for ( const singleResponse of commandResponses.values() ) {
			table.push( createSingleRow( singleResponse ) );
		}

		console.log( table.toString() );
		console.log( getLegend() );

		function createSingleRow( { packageName, status, mgitBranch, commit } ) {
			const wholeRow = [];
			const statusColumn = [];

			const wholeRowColor = status.branch !== 'master' ? 'magenta' : null;
			let branch = status.branch;

			if ( mgitBranch !== status.branch ) {
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

			if ( status.modified.length ) {
				statusColumn.push( color( 'red', `M${ status.modified.length }` ) );
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
				`\n${ color( 'cyan', '!' ) } current branch is other than specified in "mgit.json"`,
				'highlighted row means the branch is other than "master"'
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
