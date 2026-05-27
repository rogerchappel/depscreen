import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathExists, readJsonFile } from './fs.js';
import type { LockedPackage, ProjectSnapshot } from './types.js';

interface PackageLock {
  packages?: Record<string, {
    version?: string;
    resolved?: string;
    license?: string;
    hasInstallScript?: boolean;
  }>;
}

export async function readLockfile(root: string): Promise<ProjectSnapshot['lockfile']> {
  const npmLockPath = path.join(root, 'package-lock.json');
  if (await pathExists(npmLockPath)) {
    return readPackageLock(npmLockPath);
  }

  const pnpmLockPath = path.join(root, 'pnpm-lock.yaml');
  if (await pathExists(pnpmLockPath)) {
    return readPnpmLock(pnpmLockPath);
  }

  return {
    kind: 'none',
    packageCount: 0,
    packages: []
  };
}

async function readPackageLock(lockPath: string): Promise<ProjectSnapshot['lockfile']> {
  const lock = await readJsonFile<PackageLock>(lockPath);
  const packages = Object.entries(lock.packages ?? {})
    .filter(([packagePath]) => packagePath.startsWith('node_modules/'))
    .map(([packagePath, entry]) => ({
      name: packagePath.replace(/^node_modules\//, ''),
      path: packagePath,
      version: entry.version,
      resolved: entry.resolved,
      license: entry.license,
      hasInstallScript: entry.hasInstallScript
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    kind: 'npm',
    path: lockPath,
    packageCount: packages.length,
    packages
  };
}

async function readPnpmLock(lockPath: string): Promise<ProjectSnapshot['lockfile']> {
  const raw = await readFile(lockPath, 'utf8');
  const packages: LockedPackage[] = [];
  const lines = raw.split(/\r?\n/);
  let inPackages = false;
  let current: LockedPackage | undefined;

  for (const line of lines) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }

    if (inPackages && /^[a-zA-Z]/.test(line) && !line.startsWith('packages:')) {
      break;
    }

    const packageMatch = line.match(/^ {2}([/'][^:]+['"]?):\s*$/);
    if (inPackages && packageMatch) {
      if (current) {
        packages.push(current);
      }
      const key = packageMatch[1].replace(/^['"]|['"]$/g, '');
      current = parsePnpmPackageKey(key);
      continue;
    }

    if (!current) {
      continue;
    }

    const resolutionMatch = line.match(/^\s+tarball:\s*(.+)$/);
    if (resolutionMatch) {
      current.resolved = resolutionMatch[1].trim().replace(/^['"]|['"]$/g, '');
    }

    if (/^\s+requiresBuild:\s*true\s*$/.test(line)) {
      current.hasInstallScript = true;
    }
  }

  if (current) {
    packages.push(current);
  }

  packages.sort((left, right) => left.name.localeCompare(right.name));
  return {
    kind: 'pnpm',
    path: lockPath,
    packageCount: packages.length,
    packages
  };
}

function parsePnpmPackageKey(key: string): LockedPackage {
  const clean = key.replace(/^\//, '').split('(')[0];
  const segments = clean.split('/');
  const last = segments[segments.length - 1] ?? clean;
  const versionIndex = last.lastIndexOf('@');

  if (clean.startsWith('@')) {
    const scoped = segments.slice(0, 2).join('/');
    const scopedVersionIndex = scoped.lastIndexOf('@');
    return {
      name: scoped.slice(0, scopedVersionIndex),
      version: scoped.slice(scopedVersionIndex + 1),
      path: key
    };
  }

  return {
    name: last.slice(0, versionIndex),
    version: last.slice(versionIndex + 1),
    path: key
  };
}
