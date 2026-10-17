import assert from 'node:assert/strict';
import test from 'node:test';
import { GitHubClient } from '../src/discovery/github-client.mjs';

test('release discovery includes previews but excludes drafts', async () => {
  const client = new GitHubClient();
  client.json = async () => [
    { id: 1, prerelease: true, draft: false },
    { id: 2, prerelease: false, draft: false },
    { id: 3, prerelease: true, draft: true },
  ];
  const releases = [];
  for await (const release of client.releases({ fullName: 'owner/module' }))
    releases.push(release.id);
  assert.deepEqual(releases, [1, 2]);
});
