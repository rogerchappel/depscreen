import path from 'node:path';
import { readLockfile } from './lockfiles.js';
import { readPackageManifest } from './package.js';
import type { ProjectSnapshot } from './types.js';

export async function createSnapshot(root: string): Promise<ProjectSnapshot> {
  const absoluteRoot = path.resolve(root);
  const manifest = await readPackageManifest(absoluteRoot);
  const lockfile = await readLockfile(absoluteRoot);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    rootName: manifest.name,
    packageManager: manifest.packageManager,
    dependencies: manifest.dependencies,
    lockfile
  };
}
