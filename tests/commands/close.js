/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, beforeEach, describe, it, expect } from 'vitest';
import execCommand from '../../lib/commands/exec.js';
import closeCommand from '../../lib/commands/close.js';

vi.mock( '../../lib/commands/exec.js' );

describe( 'commands/close', () => {
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
			expect( typeof closeCommand.helpMessage ).toEqual( 'string' );
		} );
	} );

	describe( 'beforeExecute()', () => {
		it( 'throws an error if command to execute is not specified', () => {
			expect( () => {
				closeCommand.beforeExecute( [ 'merge' ] );
			} ).to.throw( Error, 'Missing branch to merge. Use: mrgit close [branch].' );
		} );

		it( 'does nothing if branch to merge is specified', () => {
			expect( () => {
				closeCommand.beforeExecute( [ 'merge', 'develop' ] );
			} ).to.not.throw( Error );
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

			return closeCommand.execute( commandData )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).toEqual( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'merges specified branch and remove it from local and remote', () => {
			commandData.arguments.push( 'develop' );

			execCommand.execute
				.mockResolvedValueOnce( { logs: {
					info: [
						'* develop'
					],
					error: []
				} } )
				.mockResolvedValueOnce( { logs: {
					info: [
						'develop'
					],
					error: []
				} } )
				.mockResolvedValueOnce( { logs: {
					info: [
						'Merge made by the \'recursive\' strategy.'
					],
					error: []
				} } )
				.mockResolvedValueOnce( { logs: {
					info: [
						'Deleted branch develop (was e6bda2e9).'
					],
					error: []
				} } )
				.mockResolvedValueOnce( { logs: {
					info: [
						'To github.com:foo/bar.git\n' +
						' - [deleted]         develop'
					],
					error: []
				} } );

			return closeCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 5 );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --list develop' ],
						toolOptions
					} );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 2, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --show-current' ],
						toolOptions
					} );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 3, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git merge develop --no-ff -m "Merge branch \'develop\'"' ],
						toolOptions
					} );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 4, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch -d develop' ],
						toolOptions
					} );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 5, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git push origin :develop' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).toEqual( [
						'Merge made by the \'recursive\' strategy.',

						'Removing "develop" branch from the local registry.',

						'Deleted branch develop (was e6bda2e9).',

						'Removing "develop" branch from the remote.',

						'To github.com:foo/bar.git\n' +
						' - [deleted]         develop'
					] );
				} );
		} );

		// mrgit close develop -- --message "Test."
		it( 'merges specified branch using specified message', () => {
			commandData.arguments.push( 'develop' );
			commandData.arguments.push( '--message' );
			commandData.arguments.push( 'Test.' );

			execCommand.execute
				.mockResolvedValueOnce( { logs: {
					info: [
						'* develop'
					],
					error: []
				} } )
				.mockResolvedValueOnce( { logs: {
					info: [
						'develop'
					],
					error: []
				} } )
				.mockResolvedValueOnce( { logs: {
					info: [
						'Merge made by the \'recursive\' strategy.'
					],
					error: []
				} } )
				.mockResolvedValueOnce( { logs: {
					info: [
						'Deleted branch develop (was e6bda2e9).'
					],
					error: []
				} } )
				.mockResolvedValueOnce( { logs: {
					info: [
						'To github.com:foo/bar.git\n' +
						' - [deleted]         develop'
					],
					error: []
				} } );

			return closeCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 5 );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --list develop' ],
						toolOptions
					} );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 2, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --show-current' ],
						toolOptions
					} );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 3, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git merge develop --no-ff -m "Merge branch \'develop\'" -m "Test."' ],
						toolOptions
					} );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 4, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch -d develop' ],
						toolOptions
					} );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 5, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git push origin :develop' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).toEqual( [
						'Merge made by the \'recursive\' strategy.',

						'Removing "develop" branch from the local registry.',

						'Deleted branch develop (was e6bda2e9).',

						'Removing "develop" branch from the remote.',

						'To github.com:foo/bar.git\n' +
						' - [deleted]         develop'
					] );
				} );
		} );

		// mrgit close develop --message "Test."
		it( 'merges specified branch using specified message when specified as a param of mrgit', () => {
			commandData.arguments.push( 'develop' );

			toolOptions.message = 'Test.';

			execCommand.execute
				.mockResolvedValueOnce( { logs: {
					info: [
						'* develop'
					],
					error: []
				} } )
				.mockResolvedValueOnce( { logs: {
					info: [
						'develop'
					],
					error: []
				} } )
				.mockResolvedValueOnce( { logs: {
					info: [
						'Merge made by the \'recursive\' strategy.'
					],
					error: []
				} } )
				.mockResolvedValueOnce( { logs: {
					info: [
						'Deleted branch develop (was e6bda2e9).'
					],
					error: []
				} } )
				.mockResolvedValueOnce( { logs: {
					info: [
						'To github.com:foo/bar.git\n' +
						' - [deleted]         develop'
					],
					error: []
				} } );

			return closeCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 5 );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --list develop' ],
						toolOptions
					} );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 2, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --show-current' ],
						toolOptions
					} );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 3, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git merge develop --no-ff -m "Merge branch \'develop\'" -m "Test."' ],
						toolOptions
					} );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 4, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch -d develop' ],
						toolOptions
					} );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 5, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git push origin :develop' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).toEqual( [
						'Merge made by the \'recursive\' strategy.',

						'Removing "develop" branch from the local registry.',

						'Deleted branch develop (was e6bda2e9).',

						'Removing "develop" branch from the remote.',

						'To github.com:foo/bar.git\n' +
						' - [deleted]         develop'
					] );
				} );
		} );

		it( 'does not merge branch if it does not exist', () => {
			commandData.arguments.push( 'develop' );
			commandData.arguments.push( '--message' );
			commandData.arguments.push( 'Test.' );

			execCommand.execute.mockResolvedValueOnce( {
				logs: {
					info: [
						''
					],
					error: []
				}
			} );

			return closeCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 1 );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --list develop' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).toEqual( [
						'Branch does not exist.'
					] );
				} );
		} );

		it( 'does not merge branch if in detached head mode', () => {
			commandData.arguments.push( 'develop' );

			execCommand.execute
				.mockResolvedValueOnce( { logs: {
					info: [
						'* develop'
					],
					error: []
				} } )
				.mockResolvedValueOnce( { logs: {
					info: [
						''
					],
					error: []
				} } );

			return closeCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 2 );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --list develop' ],
						toolOptions
					} );

					expect( execCommand.execute ).toHaveBeenNthCalledWith( 2, {
						repository: {
							branch: 'master'
						},
						arguments: [ 'git branch --show-current' ],
						toolOptions
					} );

					expect( commandResponse.logs.info ).toEqual( [
						'This repository is currently in detached head mode - skipping.'
					] );
				} );
		} );
	} );
} );
