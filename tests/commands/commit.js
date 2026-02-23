/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, beforeEach, describe, it, expect } from 'vitest';
import { gitStatusParser } from '../../lib/utils/gitstatusparser.js';
import execCommand from '../../lib/commands/exec.js';
import commitCommand from '../../lib/commands/commit.js';

vi.mock( '../../lib/utils/gitstatusparser.js' );
vi.mock( '../../lib/commands/exec.js' );

describe( 'commands/commit', () => {
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
			expect( typeof commitCommand.helpMessage ).toEqual( 'string' );
		} );
	} );

	describe( '#name', () => {
		it( 'returns a full name of executed command', () => {
			expect( commitCommand.name ).is.a( 'string' );
		} );
	} );

	describe( 'beforeExecute()', () => {
		it( 'throws an error if merge message is missing', () => {
			vi.spyOn( commitCommand, '_parseArguments' ).mockImplementation( () => ( {} ) );

			expect( () => {
				commitCommand.beforeExecute( [ 'commit' ], {} );
			} ).to.throw( Error, 'Missing --message (-m) option. Call "mrgit commit -h" in order to read more.' );
		} );

		it( 'does nothing if specified message for commit (as git option)', () => {
			expect( () => {
				commitCommand.beforeExecute( [ 'commit', '--message', 'Test' ], {} );
			} ).to.not.throw( Error );
		} );

		it( 'does nothing if specified message for commit (as mrgit option)', () => {
			expect( () => {
				commitCommand.beforeExecute( [ 'commit' ], { message: 'Test.' } );
			} ).to.not.throw( Error );
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

			return commitCommand.execute( commandData )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).toEqual( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'commits all changes', () => {
			toolOptions.message = 'Test.';

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
							'[master a89f9ee] Test.'
						]
					}
				} );

			gitStatusParser.mockReturnValue( { anythingToCommit: true } );

			return commitCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.executeGit ).toHaveBeenCalledTimes( 2 );

					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 1,
						commandData,
						[ 'status', '--branch', '--porcelain' ]
					);

					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 2,
						commandData,
						[ 'commit', '-a', '-m', 'Test.' ]
					);

					expect( commandResponse.logs.info ).toEqual( [
						'[master a89f9ee] Test.'
					] );
				} );
		} );

		it( 'commits all changes (message was specified as a git option)', () => {
			commandData.arguments.push( '--message' );
			commandData.arguments.push( 'Test.' );

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
							'[master a89f9ee] Test.'
						]
					}
				} );

			gitStatusParser.mockReturnValue( { anythingToCommit: true } );

			return commitCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.executeGit ).toHaveBeenCalledTimes( 2 );

					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 1,
						commandData,
						[ 'status', '--branch', '--porcelain' ]
					);

					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 2,
						commandData,
						[ 'commit', '-a', '-m', 'Test.' ]
					);

					expect( commandResponse.logs.info ).toEqual( [
						'[master a89f9ee] Test.'
					] );
				} );
		} );

		it( 'accepts `--no-verify` option', () => {
			commandData.arguments.push( '-n' );
			commandData.arguments.push( '--message' );
			commandData.arguments.push( 'Test' );

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
							'[master a89f9ee] Test'
						]
					}
				} );

			gitStatusParser.mockReturnValue( { anythingToCommit: true } );

			return commitCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.executeGit ).toHaveBeenCalledTimes( 2 );

					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 1,
						commandData,
						[ 'status', '--branch', '--porcelain' ]
					);

					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 2,
						commandData,
						[ 'commit', '-a', '-m', 'Test', '-n' ]
					);

					expect( commandResponse.logs.info ).toEqual( [
						'[master a89f9ee] Test'
					] );
				} );
		} );

		it( 'accepts duplicated `--message` option', () => {
			toolOptions.message = [
				'Test.',
				'Foo.'
			];

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
							'[master a89f9ee] Test.'
						]
					}
				} );

			gitStatusParser.mockReturnValue( { anythingToCommit: true } );

			return commitCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.executeGit ).toHaveBeenCalledTimes( 2 );

					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 1,
						commandData,
						[ 'status', '--branch', '--porcelain' ]
					);

					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 2,
						commandData,
						[ 'commit', '-a', '-m', 'Test.', '-m', 'Foo.' ]
					);

					expect( commandResponse.logs.info ).toEqual( [
						'[master a89f9ee] Test.'
					] );
				} );
		} );

		it( 'accepts duplicated `--message` option (messages were specified as a git option)', () => {
			commandData.arguments.push( '--message' );
			commandData.arguments.push( 'Test.' );
			commandData.arguments.push( '-m' );
			commandData.arguments.push( 'Foo.' );

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
							'[master a89f9ee] Test.'
						]
					}
				} );

			gitStatusParser.mockReturnValue( { anythingToCommit: true } );

			return commitCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.executeGit ).toHaveBeenCalledTimes( 2 );

					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 1,
						commandData,
						[ 'status', '--branch', '--porcelain' ]
					);

					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 2,
						commandData,
						[ 'commit', '-a', '-m', 'Test.', '-m', 'Foo.' ]
					);

					expect( commandResponse.logs.info ).toEqual( [
						'[master a89f9ee] Test.'
					] );
				} );
		} );

		it( 'does not commit if there is no changes', () => {
			commandData.arguments.push( '--message' );
			commandData.arguments.push( 'Test.' );

			execCommand.executeGit.mockResolvedValueOnce( {
				logs: {
					info: [
						'Response returned by "git status" command.'
					]
				}
			} );

			gitStatusParser.mockReturnValue( { anythingToCommit: false } );

			return commitCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.executeGit ).toHaveBeenCalledTimes( 1 );

					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 1,
						commandData,
						[ 'status', '--branch', '--porcelain' ]
					);

					expect( commandResponse.logs.info ).toEqual( [
						'Nothing to commit.'
					] );
				} );
		} );

		it( 'does not commit if repository is in detached head mode', () => {
			toolOptions.message = 'Test.';

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
							'[master a89f9ee] Test.'
						]
					}
				} );

			gitStatusParser.mockReturnValue( { anythingToCommit: true, detachedHead: true } );

			return commitCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.executeGit ).toHaveBeenCalledTimes( 1 );

					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 1,
						commandData,
						[ 'status', '--branch', '--porcelain' ]
					);

					expect( commandResponse.logs.info ).toEqual( [
						'This repository is currently in detached head mode - skipping.'
					] );
				} );
		} );

		it( 'passes message with shell-like content as a literal argument', () => {
			commandData.arguments.push( '--message' );
			commandData.arguments.push( 'Test; touch HACKED; #' );

			execCommand.executeGit
				.mockResolvedValueOnce( {
					logs: {
						info: [ 'Response returned by "git status" command.' ]
					}
				} )
				.mockResolvedValueOnce( {
					logs: {
						info: [ '[master a89f9ee] Test; touch HACKED; #' ]
					}
				} );

			gitStatusParser.mockReturnValue( { anythingToCommit: true } );

			return commitCommand.execute( commandData )
				.then( () => {
					expect( execCommand.executeGit ).toHaveBeenNthCalledWith( 2,
						commandData,
						[ 'commit', '-a', '-m', 'Test; touch HACKED; #' ]
					);
				} );
		} );
	} );
} );
