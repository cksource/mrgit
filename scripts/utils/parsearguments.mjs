/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

import minimist from 'minimist';

/**
 * @param {Array.<String>} cliArguments
 * @returns {ReleaseOptions} options
 */
export default function parseArguments( cliArguments ) {
	const config = {
		boolean: [
			'verbose',
			'compile-only',
			'ci'
		],

		string: [
			'branch',
			'from',
			'npm-tag'
		],

		default: {
			ci: false,
			verbose: false,
			'compile-only': false,
			branch: 'master',
			'npm-tag': null
		}
	};

	const options = minimist( cliArguments, config );

	options.npmTag = options[ 'npm-tag' ];
	delete options[ 'npm-tag' ];

	options.compileOnly = options[ 'compile-only' ];
	delete options[ 'compile-only' ];

	if ( process.env.CI ) {
		options.ci = true;
	}

	return options;
}

/**
 * @typedef {Object} ReleaseOptions
 *
 * @property {String|null} [npmTag=null]
 *
 * @property {String} [from]
 *
 * @property {String} [branch='master']
 *
 * @property {Boolean} [compileOnly=false]
 *
 * @property {Boolean} [verbose=false]
 *
 * @property {Boolean} [ci=false]
 */
