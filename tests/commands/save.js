/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, beforeEach, describe, it, expect } from 'vitest';
import { gitStatusParser } from '../../lib/utils/gitstatusparser.js';
import { updateJsonFile } from '../../lib/utils/updatejsonfile.js';
import execCommand from '../../lib/commands/exec.js';
import saveCommand from '../../lib/commands/save.js';

vi.mock( '../../lib/utils/gitstatusparser.js' );
vi.mock( '../../lib/utils/updatejsonfile.js' );
vi.mock( '../../lib/commands/exec.js' );

describe( 'commands/save', () => {
	let commandData, toolOptions, mrgitJsonPath, updateFunction;

	const normalizedDirname = import.meta.dirname.replace( /\\/g, '/' );

	beforeEach( () => {
		toolOptions = {
			config: normalizedDirname + '/mrgit.json'
		};

		commandData = {
			packageName: 'test-package',
			arguments: [],
			toolOptions
		};

		vi.mocked( updateJsonFile ).mockImplementation( ( pathToFile, callback ) => {
			mrgitJsonPath = pathToFile;
			updateFunction = callback;
		} );
	} );

	describe( '#helpMessage', () => {
		it( 'defines help screen', () => {
			expect( saveCommand.helpMessage ).is.a( 'string' );
		} );
	} );

	describe( 'beforeExecute()', () => {
		it( 'defined which type of data should be saved', () => {
			saveCommand.beforeExecute( [], toolOptions );
			expect( toolOptions.hash ).toEqual( true );
		} );

		it( 'throws an error if used both options', () => {
			const errorMessage = 'Cannot use "hash" and "branch" options at the same time.';

			toolOptions.branch = true;
			toolOptions.hash = true;

			expect( () => {
				saveCommand.beforeExecute( [], toolOptions );
			} ).to.throw( Error, errorMessage );
		} );
	} );

	describe( 'execute()', () => {
		it( 'rejects promise if called command returned an error', () => {
			toolOptions.hash = true;

			const error = new Error( 'Unexpected error.' );

			execCommand.execute.mockImplementation( () => Promise.reject( {
				logs: {
					error: [ error.stack ]
				}
			} ) );

			return saveCommand.execute( commandData )
				.then(
					() => {
						throw new Error( 'Supposed to be rejected.' );
					},
					response => {
						expect( response.logs.error[ 0 ].split( '\n' )[ 0 ] ).toEqual( `Error: ${ error.message }` );
					}
				);
		} );

		it( 'resolves promise with last commit id', () => {
			toolOptions.hash = true;

			const execCommandResponse = {
				logs: {
					info: [ '584f341' ]
				}
			};

			execCommand.execute.mockReturnValue( Promise.resolve( execCommandResponse ) );

			return saveCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 1 );
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, {
						packageName: commandData.packageName,
						arguments: [ 'git rev-parse HEAD' ],
						toolOptions: {
							hash: true,
							config: normalizedDirname + '/mrgit.json'
						}
					} );

					expect( commandResponse.response ).toEqual( {
						packageName: commandData.packageName,
						data: '584f341',
						hash: true,
						branch: undefined
					} );

					expect( commandResponse.logs.info[ 0 ] ).toEqual( 'Commit: "584f341".' );
				} );
		} );

		it( 'resolves promise with a name of current branch if called with --branch option', () => {
			const execCommandResponse = {
				logs: {
					info: [ '## master...origin/master' ]
				}
			};

			toolOptions.branch = true;

			gitStatusParser.mockReturnValue( { branch: 'master' } );
			execCommand.execute.mockReturnValue( Promise.resolve( execCommandResponse ) );

			return saveCommand.execute( commandData )
				.then( commandResponse => {
					expect( execCommand.execute ).toHaveBeenCalledTimes( 1 );
					expect( execCommand.execute ).toHaveBeenNthCalledWith( 1, {
						packageName: commandData.packageName,
						arguments: [ 'git status --branch --porcelain' ],
						toolOptions: {
							branch: true,
							config: normalizedDirname + '/mrgit.json'
						}
					} );

					expect( commandResponse.response ).toEqual( {
						packageName: commandData.packageName,
						data: 'master',
						branch: true,
						hash: undefined
					} );

					expect( commandResponse.logs.info[ 0 ] ).toEqual( 'Branch: "master".' );
				} );
		} );
	} );

	describe( 'afterExecute()', () => {
		it( 'updates collected hashes in "mrgit.json" (--hash option, default behavior)', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );
			processedPackages.add( 'package-test' );

			commandResponses.add( {
				packageName: 'test-package',
				data: '584f341',
				hash: true,
				branch: false
			} );
			commandResponses.add( {
				packageName: 'package-test',
				data: '52910fe',
				hash: true,
				branch: false
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test',
					'other-package': 'organization/other-package'
				}
			};

			expect( mrgitJsonPath ).toEqual( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json.dependencies ).toEqual( {
				'test-package': 'organization/test-package#584f341',
				'package-test': 'organization/package-test#52910fe',
				'other-package': 'organization/other-package'
			} );
		} );

		it( 'updates collected branches in "mrgit.json" (--branch option)', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );
			processedPackages.add( 'package-test' );

			commandResponses.add( {
				packageName: 'test-package',
				data: 'develop',
				hash: false,
				branch: true
			} );
			commandResponses.add( {
				packageName: 'package-test',
				data: 'develop',
				hash: false,
				branch: true
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test',
					'other-package': 'organization/other-package'
				}
			};

			expect( mrgitJsonPath ).toEqual( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json.dependencies ).toEqual( {
				'test-package': 'organization/test-package#develop',
				'package-test': 'organization/package-test#develop',
				'other-package': 'organization/other-package'
			} );
		} );

		it( 'updates collected hashes in "mrgit.json" (--preset option)', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );
			processedPackages.add( 'package-test' );

			commandResponses.add( {
				packageName: 'test-package',
				data: '584f341',
				hash: true,
				branch: false
			} );
			commandResponses.add( {
				packageName: 'package-test',
				data: '52910fe',
				hash: true,
				branch: false
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test'
				},
				preset: 'development',
				presets: {
					development: {
						'test-package': 'organization/test-package#development',
						'package-test': 'organization/package-test#development'
					}
				}
			};

			toolOptions.preset = 'development';

			expect( mrgitJsonPath ).toEqual( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json ).toEqual( {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test'
				},
				preset: 'development',
				presets: {
					development: {
						'test-package': 'organization/test-package#584f341',
						'package-test': 'organization/package-test#52910fe'
					}
				}
			} );
		} );

		it( 'adds new value to the preset if its not in it, but it is in the base dependencies (--preset option)', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );
			processedPackages.add( 'package-test' );

			commandResponses.add( {
				packageName: 'test-package',
				data: '584f341',
				hash: true,
				branch: false
			} );
			commandResponses.add( {
				packageName: 'package-test',
				data: '52910fe',
				hash: true,
				branch: false
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test'
				},
				preset: 'development',
				presets: {
					development: {
						'test-package': 'organization/test-package#development'
					}
				}
			};

			toolOptions.preset = 'development';

			expect( mrgitJsonPath ).toEqual( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json ).toEqual( {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test'
				},
				preset: 'development',
				presets: {
					development: {
						'test-package': 'organization/test-package#584f341',
						'package-test': 'organization/package-test#52910fe'
					}
				}
			} );
		} );

		it( 'updates base dependencies if specified preset is not defined (--preset option)', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );
			processedPackages.add( 'package-test' );

			commandResponses.add( {
				packageName: 'test-package',
				data: '584f341',
				hash: true,
				branch: false
			} );
			commandResponses.add( {
				packageName: 'package-test',
				data: '52910fe',
				hash: true,
				branch: false
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test'
				},
				preset: 'development',
				presets: {}
			};

			toolOptions.preset = 'development';

			expect( mrgitJsonPath ).toEqual( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json ).toEqual( {
				dependencies: {
					'test-package': 'organization/test-package#584f341',
					'package-test': 'organization/package-test#52910fe'
				},
				preset: 'development',
				presets: {}
			} );
		} );

		it( 'updates base dependencies if specified presets are not defined (--preset option)', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );
			processedPackages.add( 'package-test' );

			commandResponses.add( {
				packageName: 'test-package',
				data: '584f341',
				hash: true,
				branch: false
			} );
			commandResponses.add( {
				packageName: 'package-test',
				data: '52910fe',
				hash: true,
				branch: false
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package',
					'package-test': 'organization/package-test'
				},
				preset: 'development'
			};

			toolOptions.preset = 'development';

			expect( mrgitJsonPath ).toEqual( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json ).toEqual( {
				dependencies: {
					'test-package': 'organization/test-package#584f341',
					'package-test': 'organization/package-test#52910fe'
				},
				preset: 'development'
			} );
		} );

		it( 'does not save "#master" branch because it is default branch', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );

			commandResponses.add( {
				packageName: 'test-package',
				data: 'master',
				hash: false,
				branch: true
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package#some-branch'
				}
			};

			expect( mrgitJsonPath ).toEqual( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json.dependencies ).toEqual( {
				'test-package': 'organization/test-package'
			} );
		} );

		it( 'overwrites tags defined in "mrgit.json"', () => {
			const processedPackages = new Set();
			const commandResponses = new Set();

			processedPackages.add( 'test-package' );
			processedPackages.add( 'package-test' );

			commandResponses.add( {
				packageName: 'test-package',
				data: 'develop',
				hash: false,
				branch: true
			} );
			commandResponses.add( {
				packageName: 'package-test',
				data: 'develop',
				hash: false,
				branch: true
			} );

			saveCommand.afterExecute( processedPackages, commandResponses, toolOptions );

			let json = {
				dependencies: {
					'test-package': 'organization/test-package@v30.0.0',
					'package-test': 'organization/package-test@latest'
				}
			};

			expect( mrgitJsonPath ).toEqual( normalizedDirname + '/mrgit.json' );
			expect( updateFunction ).to.be.a( 'function' );

			json = updateFunction( json );

			expect( json.dependencies ).toEqual( {
				'test-package': 'organization/test-package#develop',
				'package-test': 'organization/package-test#develop'
			} );
		} );
	} );
} );
