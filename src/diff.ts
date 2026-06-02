import { readJsonFile } from './fs.js';
import { sortFindings } from './scan.js';
import type { DependencySpec, DiffResult, Finding, ProjectSnapshot } from './types.js';

export async function diffSnapshotFiles(baselinePath: string, currentPath: string): Promise<DiffResult> {
  const baseline = await readJsonFile<ProjectSnapshot>(baselinePath);
  const current = await readJsonFile<ProjectSnapshot>(currentPath);
  return diffSnapshots(baseline, current);
}

export function diffSnapshots(baseline: ProjectSnapshot, current: ProjectSnapshot): DiffResult {
  const baselineDeps = dependencyMap(baseline.dependencies);
  const currentDeps = dependencyMap(current.dependencies);
  const findings: Finding[] = [];

  const addedDependencies = current.dependencies.filter((dependency) => !baselineDeps.has(dependencyKey(dependency)));
  const removedDependencies = baseline.dependencies.filter((dependency) => !currentDeps.has(dependencyKey(dependency)));
  const changedDependencies = current.dependencies
    .flatMap((dependency) => {
      const before = baselineDeps.get(dependencyKey(dependency));
      if (!before || before.spec === dependency.spec) {
        return [];
      }
      return [{ name: dependency.name, section: dependency.section, before: before.spec, after: dependency.spec }];
    })
    .sort((left, right) => `${left.section}:${left.name}`.localeCompare(`${right.section}:${right.name}`));

  for (const dependency of addedDependencies) {
    findings.push({
      id: `added-dependency:${dependency.section}:${dependency.name}`,
      title: 'Added dependency',
      severity: 'medium',
      packageName: dependency.name,
      section: dependency.section,
      detail: `${dependency.name} was added to ${dependency.section} with spec ${dependency.spec}.`,
      recommendation: 'Review why this package is needed and whether the spec should be pinned.'
    });
  }

  const packageChurn = Math.abs(current.lockfile.packageCount - baseline.lockfile.packageCount);
  if (packageChurn >= 10) {
    findings.push({
      id: 'large-lockfile-churn',
      title: 'Large lockfile churn',
      severity: 'high',
      detail: `Locked package count changed by ${packageChurn} packages.`,
      recommendation: 'Inspect the lockfile diff carefully and confirm this amount of churn is expected.'
    });
  } else if (packageChurn >= 3) {
    findings.push({
      id: 'moderate-lockfile-churn',
      title: 'Moderate lockfile churn',
      severity: 'medium',
      detail: `Locked package count changed by ${packageChurn} packages.`,
      recommendation: 'Check that transitive dependency changes match the intended package change.'
    });
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    baseline: {
      dependencyCount: baseline.dependencies.length,
      lockedPackageCount: baseline.lockfile.packageCount
    },
    current: {
      dependencyCount: current.dependencies.length,
      lockedPackageCount: current.lockfile.packageCount
    },
    addedDependencies: addedDependencies.sort(compareDependency),
    removedDependencies: removedDependencies.sort(compareDependency),
    changedDependencies,
    packageChurn,
    findings: sortFindings(findings)
  };
}

function dependencyMap(dependencies: DependencySpec[]): Map<string, DependencySpec> {
  return new Map(dependencies.map((dependency) => [dependencyKey(dependency), dependency]));
}

function dependencyKey(dependency: DependencySpec): string {
  return `${dependency.section}:${dependency.name}`;
}

function compareDependency(left: DependencySpec, right: DependencySpec): number {
  return dependencyKey(left).localeCompare(dependencyKey(right));
}
