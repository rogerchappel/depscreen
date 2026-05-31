import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { diffSnapshots, renderReport, scanProject } from '../src/index.js';
import { createSnapshot } from '../src/snapshot.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fixtures = path.join(repoRoot, 'tests', 'fixtures');

test('scan flags broad ranges, git specs, install scripts, and missing licenses in npm projects', async () => {
  const result = await scanProject(path.join(fixtures, 'npm-risky'));
  const titles = result.findings.map((finding) => finding.title);

  assert.equal(result.snapshot.lockfile.kind, 'npm');
  assert.equal(result.summary.dependencyCount, 3);
  assert.ok(titles.includes('Broad dependency range'));
  assert.ok(titles.includes('Non-registry dependency spec'));
  assert.ok(titles.includes('Install script or build step'));
  assert.ok(titles.includes('Missing license metadata'));
  assert.ok(result.summary.high >= 2);
});

test('scan parses pnpm lockfiles and requiresBuild metadata', async () => {
  const result = await scanProject(path.join(fixtures, 'pnpm-build'));

  assert.equal(result.snapshot.lockfile.kind, 'pnpm');
  assert.equal(result.snapshot.lockfile.packageCount, 2);
  assert.ok(result.findings.some((finding) => finding.id === 'install-script:@scope/build-me'));
});

test('diff reports added dependencies and lockfile churn', async () => {
  const baseline = await createSnapshot(path.join(fixtures, 'baseline'));
  const current = await createSnapshot(path.join(fixtures, 'npm-risky'));
  const result = diffSnapshots(baseline, current);

  assert.equal(result.addedDependencies.length, 3);
  assert.equal(result.removedDependencies.length, 1);
  assert.equal(result.packageChurn, 2);
  assert.ok(result.findings.some((finding) => finding.title === 'Added dependency'));
});

test('report renders markdown scan output', async () => {
  const result = await scanProject(path.join(fixtures, 'npm-risky'));
  const markdown = renderReport(result, 'markdown');

  assert.match(markdown, /^# Dependency Review/);
  assert.match(markdown, /Install script or build step/);
});

test('CLI writes snapshots and exits non-zero on fail-on high', async () => {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'depscreen-test-'));
  try {
    const snapshotPath = path.join(tempDir, 'snapshot.json');
    const snapshot = spawnSync(process.execPath, ['dist/src/cli.js', 'snapshot', '--root', path.join(fixtures, 'npm-risky'), '--output', snapshotPath], {
      cwd: repoRoot,
      encoding: 'utf8'
    });
    assert.equal(snapshot.status, 0, snapshot.stderr);
    const snapshotJson = JSON.parse(await readFile(snapshotPath, 'utf8')) as { lockfile: { kind: string } };
    assert.equal(snapshotJson.lockfile.kind, 'npm');

    const scan = spawnSync(process.execPath, ['dist/src/cli.js', 'scan', '--root', path.join(fixtures, 'npm-risky'), '--fail-on', 'high'], {
      cwd: repoRoot,
      encoding: 'utf8'
    });
    assert.equal(scan.status, 2);
    assert.match(scan.stdout, /depscreen scan/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
