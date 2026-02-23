/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, beforeEach, describe, it, expect } from 'vitest';
import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';
import { runGitCommand } from '../../lib/utils/rungitcommand.js';

vi.mock( 'node:child_process' );

describe( 'utils', () => {
	describe( 'runGitCommand()', () => {
		let child;

		beforeEach( () => {
			child = createMockChildProcess();
			spawn.mockReturnValue( child );
		} );

		it( 'executes git command with shell interpolation disabled', async () => {
			const commandPromise = runGitCommand( [ 'status', '-s' ], { cwd: '/tmp/packages/test-package' } );

			expect( spawn ).toHaveBeenCalledTimes( 1 );
			expect( spawn ).toHaveBeenNthCalledWith( 1,
				'git',
				[ 'status', '-s' ],
				{ cwd: '/tmp/packages/test-package', shell: false }
			);

			child.stdout.emit( 'data', Buffer.from( 'On branch master\n' ) );
			child.emit( 'close', 0 );

			await expect( commandPromise ).resolves.toEqual( 'On branch master' );
		} );

		it( 'resolves with stderr and stdout output', async () => {
			const commandPromise = runGitCommand( [ 'fetch' ] );

			child.stderr.emit( 'data', Buffer.from( 'warning\n' ) );
			child.stdout.emit( 'data', Buffer.from( 'done\n' ) );
			child.emit( 'close', 0 );

			await expect( commandPromise ).resolves.toEqual( 'warning\ndone' );
		} );

		it( 'rejects with output for failed command', async () => {
			const commandPromise = runGitCommand( [ 'checkout', 'unknown-branch' ] );

			child.stderr.emit( 'data', Buffer.from( 'error: pathspec did not match\n' ) );
			child.emit( 'close', 1 );

			await expect( commandPromise ).rejects.toEqual( 'error: pathspec did not match' );
		} );

		it( 'rejects with fallback message when failed command has no output', async () => {
			const commandPromise = runGitCommand( [ 'checkout', 'unknown-branch' ] );

			child.emit( 'close', 2 );

			await expect( commandPromise ).rejects.toEqual( 'Git command exited with code 2.' );
		} );

		it( 'rejects when spawn emits an error', async () => {
			const error = new Error( 'spawn failed' );
			const commandPromise = runGitCommand( [ 'status' ] );

			child.emit( 'error', error );

			await expect( commandPromise ).rejects.toBe( error );
		} );
	} );
} );

function createMockChildProcess() {
	const child = new EventEmitter();

	child.stderr = new EventEmitter();
	child.stdout = new EventEmitter();

	return child;
}
