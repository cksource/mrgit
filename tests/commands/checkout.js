/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
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

			execCommand.executeGit.mockRejectedValue( {
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
			execCommand.executeGit.mockResolvedValue( {
				logs: {
					info: [
						'Already on \'master\'',
						'Already on \'master\'\nYour branch is up-to-date with \'origin/master\'.'
					]
				}
			} );

			return checkoutCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.executeGit ).toHaveBeenCalledTimes( 1 );
					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 1,
						commandData,
						[ 'checkout', 'master' ]
					);

					expect( commandResponse.logs.info ).toEqual( [
						'Already on \'master\'',
						'Already on \'master\'\nYour branch is up-to-date with \'origin/master\'.'
					] );
				} );
		} );

		it( 'checkouts to specified branch', () => {
			commandData.arguments.push( 'develop' );

			execCommand.executeGit.mockResolvedValue( {
				logs: {
					info: [
						'Switched to branch \'develop\'',
						'Your branch is up to date with \'origin/develop\'.'
					]
				}
			} );

			return checkoutCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.executeGit ).toHaveBeenCalledTimes( 1 );
					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 1,
						commandData,
						[ 'checkout', 'develop' ]
					);

					expect( commandResponse.logs.info ).toEqual( [
						'Switched to branch \'develop\'',
						'Your branch is up to date with \'origin/develop\'.'
					] );
				} );
		} );

		it( 'creates a new branch if a repository has changes that could be committed and specified --branch option', () => {
			toolOptions.branch = 'develop';

			execCommand.executeGit
				.mockResolvedValueOnce( {
					logs: {
						info: [
							'Response returned by "git status" command.'
						]
					}
				} )
				.mockResolvedValueOnce( {
					logs: {
						info: [
							'Switched to a new branch \'develop\''
						]
					}
				} );

			gitStatusParser.mockReturnValue( { anythingToCommit: true } );

			return checkoutCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.executeGit ).toHaveBeenCalledTimes( 2 );

					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 1,
						commandData,
						[ 'status', '--branch', '--porcelain' ]
					);

					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 2,
						commandData,
						[ 'checkout', '-b', 'develop' ]
					);

					expect( commandResponse.logs.info ).toEqual( [
						'Switched to a new branch \'develop\''
					] );
				} );
		} );

		it( 'does not create a branch if a repository has no-changes that could be committed when specified --branch option', () => {
			toolOptions.branch = 'develop';

			execCommand.executeGit.mockResolvedValueOnce( {
				logs: {
					info: [
						'Response returned by "git status" command.'
					]
				}
			} );

			gitStatusParser.mockReturnValue( { anythingToCommit: false } );

			return checkoutCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.executeGit ).toHaveBeenCalledTimes( 1 );

					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 1,
						commandData,
						[ 'status', '--branch', '--porcelain' ]
					);

					expect( commandResponse.logs.info ).toEqual( [
						'Repository does not contain changes to commit. New branch was not created.'
					] );
				} );
		} );

		it( 'passes branch with special characters as a literal checkout argument', () => {
			commandData.arguments.push( 'feature; touch HACKED; #' );
			execCommand.executeGit.mockResolvedValue( { logs: { info: [ 'ok' ] } } );

			return checkoutCommand.execute( commandData )
				.then( () => {
					expect( execCommand.executeGit ).toHaveBeenCalledWith(
						commandData,
						[ 'checkout', 'feature; touch HACKED; #' ]
					);
				} );
		} );
	} );
} );
