/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import chalk from 'chalk';

export const DEPRECATION_NOTICE = [
	'mrgit is no longer maintained. There will be no further releases, bug fixes, or security patches.',
	'See https://github.com/cksource/mrgit for details.',
	'Set MRGIT_NO_DEPRECATION_WARNING=1 to hide this message.'
].join( '\n' );

/**
 * Prints the deprecation notice to stderr, so it does not interfere with the output parsed by scripts.
 *
 * The notice is not printed when the `MRGIT_NO_DEPRECATION_WARNING` environment variable is set.
 *
 * @param {Object} [env=process.env] Environment variables.
 */
export function printDeprecationNotice( env = process.env ) {
	if ( env.MRGIT_NO_DEPRECATION_WARNING ) {
		return;
	}

	console.error( chalk.yellow( DEPRECATION_NOTICE ) + '\n' );
}
