/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, beforeEach, describe, it, expect } from 'vitest';
import { gitStatusParser } from '../../lib/utils/gitstatusparser.js';
import checkoutCommand from '../../lib/commands/checkout.js';
import execCommand from '../../lib/commands/exec.js';

vi.mock( '../../lib/utils/gitstatusparser.js' );
vi.mock( '../../lib/commands/exec.js' );

describe( 'commands/checkout', () => {
	let commandData, toolOptions;

	beforeEach( () => {
		toolOptions = {};

		commandData = {
			arguments: [],
			repository: {
				branch: 'master'
			},
			toolOptions
		};
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( typeof checkoutCommand.helpMessage ).toEqual( 'string' );
		} );
	} );

	describe( '#name', () => {
		it( 'returns a full name of executed command', () => {
			expect( checkoutCommand.name ).is.a( 'string' );
		} );
	} );

	describe( 'execute()', () => {
		it( 'rejects promise if called command returned an error', () => {
			const error = new Error( 'Unexpected error.' );

			execCommand.execute.mockRejectedValue( {
				logs: {
					error: [ error.stack ]
				}
			} );

			return checkoutCommand.execute( commandData )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).toEqual( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'checkouts to the correct branch', () => {
			execCommand.execute.mockResolvedValue( {
				logs: {
					info: [
						'Already on \'master\'',
						'Already on \'master\'\nYour branch is up-to-date with \'origin/master\'.'
					]
				}
			} );

			return checkoutCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 1 );
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git checkout master' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).toEqual( [
						'Already on \'master\'',
						'Already on \'master\'\nYour branch is up-to-date with \'origin/master\'.'
					] );
				} );
		} );

		it( 'checkouts to specified branch', () => {
			commandData.arguments.push( 'develop' );

			execCommand.execute.mockResolvedValue( {
				logs: {
					info: [
						'Switched to branch \'develop\'',
						'Your branch is up to date with \'origin/develop\'.'
					]
				}
			} );

			return checkoutCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 1 );
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git checkout develop' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).toEqual( [
						'Switched to branch \'develop\'',
						'Your branch is up to date with \'origin/develop\'.'
					] );
				} );
		} );

		it( 'creates a new branch if a repository has changes that could be committed and specified --branch option', () => {
			toolOptions.branch = 'develop';

			execCommand.execute
				.mockResolvedValueOnce( { logs: { info: [
					'Response returned by "git status" command.'
				] } } )
				.mockResolvedValueOnce( { logs: { info: [
					'Switched to a new branch \'develop\''
				] } } );

			gitStatusParser.mockReturnValue( { anythingToCommit: true } );

			return checkoutCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 2 );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git status --branch --porcelain' ],
						toolOptions
					} );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 2, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git checkout -b develop' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).toEqual( [
						'Switched to a new branch \'develop\''
					] );
				} );
		} );

		it( 'does not create a branch if a repository has no-changes that could be committed when specified --branch option', () => {
			toolOptions.branch = 'develop';

			execCommand.execute.mockResolvedValueOnce( {
				logs: {
					info: [
						'Response returned by "git status" command.'
					]
				}
			} );

			gitStatusParser.mockReturnValue( { anythingToCommit: false } );

			return checkoutCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 1 );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git status --branch --porcelain' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).toEqual( [
						'Repository does not contain changes to commit. New branch was not created.'
					] );
				} );
		} );
	} );
} );
