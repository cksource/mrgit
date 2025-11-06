/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import globals from 'globals';
import { defineConfig } from 'eslint/config';
import ckeditor5Rules from 'eslint-plugin-ckeditor5-rules';
import ckeditor5Config from 'eslint-config-ckeditor5';
import * as eslintPluginImport from 'eslint-plugin-import';

export default defineConfig( [
	{
		ignores: [
			'build/**',
			'external/**',
			'coverage/**',
			'release/**'
		]
	},
	{
		extends: ckeditor5Config,
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.node
			}
		},

		linterOptions: {
			reportUnusedDisableDirectives: 'warn',
			reportUnusedInlineConfigs: 'warn'
		},

		plugins: {
			'ckeditor5-rules': ckeditor5Rules,
			'import': eslintPluginImport
		},

		rules: {
			'ckeditor5-rules/license-header': [ 'error', { headerLines: [
				'/**',
				' * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.',
				' * For licensing, see LICENSE.md.',
				' */'
			] } ],
			'import/extensions': [ 'error', {
				js: 'always',
				json: 'always'
			} ]
		}
	}
] );
