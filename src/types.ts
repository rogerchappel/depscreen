export type DependencySection =
  | 'dependencies'
  | 'devDependencies'
  | 'peerDependencies'
  | 'optionalDependencies';

export type LockfileKind = 'npm' | 'pnpm' | 'none';

export type Severity = 'low' | 'medium' | 'high';

export type OutputFormat = 'text' | 'json' | 'markdown';

export interface DependencySpec {
  name: string;
  spec: string;
  section: DependencySection;
}

export interface LockedPackage {
  name: string;
  version?: string;
  path?: string;
  resolved?: string;
  license?: string;
  hasInstallScript?: boolean;
}

export interface ProjectSnapshot {
  schemaVersion: 1;
  generatedAt: string;
  rootName?: string;
  packageManager?: string;
  dependencies: DependencySpec[];
  lockfile: {
    kind: LockfileKind;
    path?: string;
    packageCount: number;
    packages: LockedPackage[];
  };
}

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  packageName?: string;
  section?: DependencySection;
  detail: string;
  recommendation: string;
}

export interface ScanResult {
  schemaVersion: 1;
  generatedAt: string;
  root: string;
  summary: {
    dependencyCount: number;
    lockedPackageCount: number;
    high: number;
    medium: number;
    low: number;
  };
  snapshot: ProjectSnapshot;
  findings: Finding[];
}

export interface DiffResult {
  schemaVersion: 1;
  generatedAt: string;
  baseline: {
    dependencyCount: number;
    lockedPackageCount: number;
  };
  current: {
    dependencyCount: number;
    lockedPackageCount: number;
  };
  addedDependencies: DependencySpec[];
  removedDependencies: DependencySpec[];
  changedDependencies: Array<{
    name: string;
    section: DependencySection;
    before: string;
    after: string;
  }>;
  packageChurn: number;
  findings: Finding[];
}
