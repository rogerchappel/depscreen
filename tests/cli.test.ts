import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { test } from 'node:test';

const execFileAsync = promisify(execFile);

test('cli writes scan json and exits non-zero for high threshold', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'depscreen-'));
  const output = path.join(dir, 'scan.json');

  await assert.rejects(
    execFileAsync(process.execPath, [
      'dist/src/cli.js',
      'scan',
      '--root',
      'tests/fixtures/npm-risky',
      '--format',
      'json',
      '--output',
      output,
      '--fail-on',
      'high'
    ]),
    /Command failed/
  );

  const report = JSON.parse(await readFile(output, 'utf8')) as { findings: unknown[] };
  assert.equal(report.findings.length, 5);
});
