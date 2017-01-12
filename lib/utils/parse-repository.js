/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Returns object with repository details
 *
 * @returns {Object} data
 * @returns {String} data.host
 * @returns {String} data.repository
 * @returns {String} data.branch
 * @returns {String} data.user
 * @returns {String} data.name
 */
module.exports = function parseRepository( repositoryName ) {
	const regexp = /^((?:git@|(?:http[s]?|git):\/\/)(git)?@?([^\:]+)(?:\/|:))?(([\w-]+)\/([\w-]+(?:\.git)?))(?:#([\w-\/\.]+))?$/;
	const match = repositoryName.match( regexp );

	if ( !match ) {
		return null;
	}

	let name = match[ 6 ];
	name = /\.git$/.test( name ) ? name.slice( 0, -4 ) : name;

	return {
		host: match[ 3 ] || 'github.com',
		repository: match[ 4 ],
		branch: match[ 7 ] || 'master',
		user: match[ 5 ],
		name
	};
};
