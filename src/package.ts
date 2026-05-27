import path from 'node:path';
import { readJsonFile } from './fs.js';
import type { DependencySection, DependencySpec } from './types.js';

const dependencySections: DependencySection[] = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies'
];

interface PackageJson {
  name?: string;
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface PackageManifest {
  path: string;
  name?: string;
  packageManager?: string;
  dependencies: DependencySpec[];
}

export async function readPackageManifest(root: string): Promise<PackageManifest> {
  const manifestPath = path.join(root, 'package.json');
  const manifest = await readJsonFile<PackageJson>(manifestPath);
  const dependencies = dependencySections.flatMap((section) =>
    Object.entries(manifest[section] ?? {})
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, spec]) => ({ name, spec, section }))
  );

  return {
    path: manifestPath,
    name: manifest.name,
    packageManager: manifest.packageManager,
    dependencies
  };
}
