/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @param {Object} summary
 * @param {String|null} [currentTag=null]
 * @returns {Object}
 */
export function gitStatusParser( summary, currentTag = null ) {
	return {
		get anythingToCommit() {
			return (
				summary.created.length > 0 ||
				summary.modified.length > 0 ||
				summary.deleted.length > 0 ||
				summary.conflicted.length > 0 ||
				summary.staged.length > 0
			);
		},

		branch: summary.current,
		tag: currentTag,
		detachedHead: summary.detached,
		behind: summary.behind,
		ahead: summary.ahead,
		added: summary.created,
		modified: summary.modified,
		deleted: summary.deleted,
		unmerged: summary.conflicted,
		untracked: summary.not_added,
		staged: summary.staged
	};
}
