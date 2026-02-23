/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { spawn } from 'node:child_process';

/**
 * Executes a git command using argument vectors (no shell interpolation).
 *
 * @param {Array.<String>} argumentsList Git command arguments without the leading "git".
 * @param {Object} [options]
 * @param {String} [options.cwd] Working directory where command should be executed.
 * @returns {Promise.<String>} Resolves with command output (stderr + stdout).
 */
export function runGitCommand( argumentsList, options = {} ) {
	return new Promise( ( resolve, reject ) => {
		const child = spawn( 'git', argumentsList, {
			cwd: options.cwd,
			shell: false
		} );

		let stderr = '';
		let stdout = '';

		child.stderr.on( 'data', chunk => {
			stderr += chunk.toString();
		} );

		child.stdout.on( 'data', chunk => {
			stdout += chunk.toString();
		} );

		child.on( 'error', error => {
			reject( error );
		} );

		child.on( 'close', code => {
			const output = ( stderr + stdout ).trim();

			if ( code === 0 ) {
				return resolve( output );
			}

			return reject( output || `Git command exited with code ${ code }.` );
		} );
	} );
}
