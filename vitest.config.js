/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig( {
	test: {
		testTimeout: 10000,
		restoreMocks: true,
		mockReset: true,
		include: [
			'tests/**/*.js'
		],
		setupFiles: [
			'./scripts/testsSetup/chalk.js'
		],
		watch: false,
		coverage: {
			provider: 'v8',
			exclude: [ './lib/utils/shell.js' ],
			reporter: [ 'text', 'json', 'html', 'lcov' ]
		}
	}
} );
