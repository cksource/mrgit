/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi } from 'vitest';

vi.mock( 'chalk', () => {
	const chalkFunctions = [
		'blue',
		'bold',
		'cyan',
		'gray',
		'green',
		'inverse',
		'italic',
		'magenta',
		'red',
		'underline',
		'yellow'
	];

	const chalk = chalkFunctions.reduce( ( obj, key ) => {
		obj[ key ] = vi.fn( string => string );

		return obj;
	}, {} );

	// To enable `chalk.bold.yellow.underline()`.
	for ( const rootKey of Object.keys( chalk ) ) {
		for ( const nestedKey of Object.keys( chalk ) ) {
			chalk[ rootKey ][ nestedKey ] = chalk[ nestedKey ];
		}
	}

	return { default: chalk };
} );
