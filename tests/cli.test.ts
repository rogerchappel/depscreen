import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fixtures = path.join(repoRoot, 'tests', 'fixtures');
const cliPath = path.join(repoRoot, 'dist', 'src', 'cli.js');

describe('depscreen CLI', () => {
  it('prints JSON scan results', async () => {
    const { stdout } = await execFileAsync(process.execPath, [cliPath, 'scan', path.join(fixtures, 'clean'), '--format', 'json']);
    const result = JSON.parse(stdout);

    assert.equal(result.snapshot.rootName, 'clean-project');
    assert.equal(result.findings.length, 0);
  });

  it('can fail when findings meet the configured threshold', async () => {
    await assert.rejects(
      execFileAsync(process.execPath, [cliPath, 'scan', path.join(fixtures, 'risky'), '--fail-on', 'high']),
      (error: unknown) => {
        assert(error && typeof error === 'object' && 'code' in error);
        const execError = error as { code: number; stdout: string };
        assert.equal(execError.code, 1);
        assert.match(execError.stdout, /Dependency uses latest tag/);
        return true;
      }
    );
  });
});
