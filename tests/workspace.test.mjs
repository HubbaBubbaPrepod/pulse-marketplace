import * as workspaceRules from '../apps/web/lib/workspace.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRepository, restoreDrafts, decideRevision } from '../apps/web/lib/workspace.mjs';

test('repository input becomes a canonical GitHub repository without a trailing git suffix', () => {
  assert.equal(
    parseRepository(' https://github.com/Pulse-Team/docker.git/ ').url,
    'https://github.com/Pulse-Team/docker',
  );
  assert.equal(parseRepository('Pulse-Team/docker').key, 'pulse-team/docker');
});
test('repository input rejects credentials, alternate hosts and non-repository paths', () => {
  for (const input of [
    'https://github.com.evil.test/a/b',
    'https://user@github.com/a/b',
    'http://github.com/a/b',
    'https://github.com:8080/a/b',
    'https://github.com/a/b/tree/main',
    'https://github.com/a/b?token=secret',
    'https://github.com/a/b#readme',
    'javascript:alert(1)',
  ]) {
    assert.equal(parseRepository(input), null, input);
  }
});
test('restoring local drafts validates the storage version and drops unsafe records', () => {
  assert.deepEqual(restoreDrafts('{broken'), []);
  assert.deepEqual(
    restoreDrafts(JSON.stringify({ version: 2, drafts: [{ url: 'https://github.com/a/b' }] })),
    [],
  );
  assert.deepEqual(
    restoreDrafts(
      JSON.stringify({
        version: 1,
        drafts: [
          { url: 'https://github.com/a/b' },
          { url: 'https://evil.test/a/b' },
          { url: 'https://github.com/A/B.git' },
        ],
      }),
    ),
    [{ key: 'a/b', name: 'a/b', url: 'https://github.com/a/b' }],
  );
});
const revision = {
  id: 'docker:example-1',
  status: 'pending',
  checks: [{ passed: true }, { passed: true }],
  history: [],
};
test('a preview decision needs a comment and cannot bypass failed checks', () => {
  assert.equal(decideRevision(revision, 'approved', ' ').error, 'comment');
  assert.equal(
    decideRevision({ ...revision, checks: [{ passed: false }] }, 'approved', 'Review').error,
    'checks',
  );
  assert.equal(decideRevision({ ...revision, checks: [] }, 'approved', 'Review').error, 'checks');
});
test('preview approval is immutable and scoped to the selected revision', () => {
  const result = decideRevision(revision, 'approved', ' Example review ');
  assert.equal(result.revision.status, 'approved');
  assert.equal(result.revision.id, revision.id);
  assert.equal(result.revision.history[0].comment, 'Example review');
  assert.equal(revision.status, 'pending');
  assert.equal(revision.history.length, 0);
  assert.equal(decideRevision(result.revision, 'approved', 'Again').error, 'transition');
});
test('withdrawal requires an approved revision and rejection does not bypass state rules', () => {
  assert.equal(decideRevision(revision, 'withdrawn', 'Remove').error, 'transition');
  assert.equal(decideRevision(revision, 'rejected', 'Fix package').revision.status, 'rejected');
  const approved = decideRevision(revision, 'approved', 'Reviewed').revision;
  assert.equal(
    decideRevision(approved, 'withdrawn', 'Source changed').revision.status,
    'withdrawn',
  );
  assert.equal(decideRevision(revision, 'unknown', 'Comment').error, 'transition');
});

test('approval controls match server rules for administrators and non-author moderators', () => {
  const row = { validation_passed: true, status: 'pending', source_owner_id: '101' };
  assert.equal(
    workspaceRules.canApproveRevision?.({ role: 'administrator', githubId: null }, row),
    true,
  );
  assert.equal(
    workspaceRules.canApproveRevision?.({ role: 'moderator', githubId: '102' }, row),
    true,
  );
  assert.equal(
    workspaceRules.canApproveRevision?.({ role: 'moderator', githubId: '101' }, row),
    false,
  );
  assert.equal(
    workspaceRules.canApproveRevision?.({ role: 'author', githubId: '102' }, row),
    false,
  );
  assert.equal(
    workspaceRules.canApproveRevision?.(
      { role: 'administrator' },
      { ...row, validation_passed: false },
    ),
    false,
  );
});
