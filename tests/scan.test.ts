import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanProject } from '../src/index.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fixtures = path.join(repoRoot, 'tests', 'fixtures');

describe('scanProject', () => {
  it('returns a clean summary for locked dependencies without risky specs', async () => {
    const result = await scanProject(path.join(fixtures, 'clean'));

    assert.equal(result.snapshot.rootName, 'clean-project');
    assert.equal(result.summary.dependencyCount, 1);
    assert.equal(result.summary.lockedPackageCount, 1);
    assert.deepEqual(result.findings, []);
  });

  it('reports risky specs, missing lock entries, install scripts, and transitive packages', async () => {
    const result = await scanProject(path.join(fixtures, 'risky'));
    const ids = result.findings.map((finding) => finding.id);

    assert.equal(result.summary.dependencyCount, 5);
    assert.equal(result.summary.lockedPackageCount, 4);
    assert.equal(result.summary.high, 2);
    assert.equal(result.summary.medium, 5);
    assert.equal(result.summary.low, 1);
    assert.deepEqual(ids, [
      'remote-source',
      'unpinned-latest',
      'dependency-not-locked',
      'dependency-not-locked',
      'install-script',
      'local-path',
      'wildcard-range',
      'transitive-package'
    ]);
  });

  it('reports projects with dependencies and no lockfile', async () => {
    const result = await scanProject(path.join(fixtures, 'no-lock'));

    assert.equal(result.snapshot.lockfile.kind, 'none');
    assert.equal(result.summary.high, 1);
    assert.equal(result.findings[0]?.id, 'missing-lockfile');
  });
});
