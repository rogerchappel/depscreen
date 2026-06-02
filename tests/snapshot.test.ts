import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSnapshot, diffSnapshots, scanSnapshot } from '../src/index.js';

test('creates deterministic npm snapshot and risk findings', async () => {
  const snapshot = await createSnapshot('tests/fixtures/npm-risky');
  assert.equal(snapshot.rootName, 'npm-risky');
  assert.equal(snapshot.lockfile.kind, 'npm');
  assert.equal(snapshot.dependencies.map((dependency) => dependency.name).join(','), 'left-pad,remote-tool,wide');
  assert.equal(snapshot.lockfile.packageCount, 2);

  const result = scanSnapshot(snapshot, 'tests/fixtures/npm-risky');
  assert.equal(result.summary.high, 3);
  assert.equal(result.summary.medium, 1);
  assert.equal(result.summary.low, 1);
  assert.deepEqual(
    result.findings.map((finding) => finding.id),
    [
      'install-script:lockfile:native-risk',
      'url-spec:dependencies:remote-tool',
      'broad-range:devDependencies:wide',
      'broad-range:dependencies:left-pad',
      'missing-license:lockfile:native-risk'
    ]
  );
});

test('parses pnpm lockfile packages and requiresBuild hooks', async () => {
  const snapshot = await createSnapshot('tests/fixtures/pnpm-basic');
  assert.equal(snapshot.lockfile.kind, 'pnpm');
  assert.deepEqual(snapshot.lockfile.packages.map((packageEntry) => packageEntry.name), ['@scope/pkg', 'plain']);
  assert.equal(snapshot.lockfile.packages.find((packageEntry) => packageEntry.name === 'plain')?.hasInstallScript, true);
});

test('diff reports added and changed dependencies plus churn', async () => {
  const baseline = await createSnapshot('tests/fixtures/pnpm-basic');
  const current = await createSnapshot('tests/fixtures/npm-risky');
  const diff = diffSnapshots(baseline, current);
  assert.equal(diff.addedDependencies.length, 3);
  assert.equal(diff.removedDependencies.length, 2);
  assert.equal(diff.packageChurn, 0);
  assert.equal(diff.findings.length, 3);
});
