/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Listr } from 'listr2';
import * as releaseTools from '@ckeditor/ckeditor5-dev-release-tools';

vi.mock( 'listr2', () => ( {
	Listr: vi.fn( function FakeListr() {
		this.run = vi.fn().mockResolvedValue();
	} )
} ) );

vi.mock( '@ckeditor/ckeditor5-dev-release-tools', () => ( {
	getLastFromChangelog: vi.fn().mockReturnValue( '5.0.0' ),
	getChangesForVersion: vi.fn().mockReturnValue( 'Changes.' ),
	getNpmTagFromVersion: vi.fn().mockReturnValue( 'latest' ),
	publishPackages: vi.fn().mockResolvedValue()
} ) );

describe( 'scripts/publishpackages', () => {
	let listrTasks;

	beforeEach( async () => {
		vi.resetModules();
		vi.stubEnv( 'CKE5_RELEASE_TOKEN', 'github-token' );

		await import( '../scripts/publishpackages.mjs' );

		listrTasks = vi.mocked( Listr ).mock.calls[ 0 ][ 0 ];
	} );

	it( 'publishes packages using OIDC', async () => {
		const publishTask = listrTasks.find( ( { title } ) => title === 'Publishing packages.' ).task;

		await publishTask( {}, {} );

		expect( vi.mocked( releaseTools.publishPackages ) ).toHaveBeenCalledOnce();

		const [ options ] = vi.mocked( releaseTools.publishPackages ).mock.calls[ 0 ];

		expect( options ).toHaveProperty( 'useOidc', true );
		expect( options ).not.toHaveProperty( 'npmOwner' );
	} );
} );
