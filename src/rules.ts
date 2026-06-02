import type {
  DependencySection,
  DependencySpec,
  DiffResult,
  Finding,
  LockedPackage,
  ProjectSnapshot,
  ScanResult,
  Severity
} from './types.js';

const broadRangePattern = /(^\*$)|(^x$)|(^latest$)|(^[~^])|([*xX]$)|(\|\|)|([<>]=?)/;
const urlSpecPattern = /^(git\+|git:|https?:|ssh:|file:|github:|gitlab:|bitbucket:)/;
const missingLicenseValues = new Set(['', 'unknown', 'unlicensed']);
const dependencyChurnMedium = 25;
const dependencyChurnHigh = 75;

export function scanSnapshot(snapshot: ProjectSnapshot, root: string): ScanResult {
  const findings = [
    ...dependencySpecFindings(snapshot.dependencies),
    ...lockfileFindings(snapshot.lockfile.packages)
  ].sort(compareFindings);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    root,
    summary: summarize(snapshot, findings),
    snapshot,
    findings
  };
}

export function diffSnapshots(baseline: ProjectSnapshot, current: ProjectSnapshot): DiffResult {
  const baselineDeps = indexDependencies(baseline.dependencies);
  const currentDeps = indexDependencies(current.dependencies);
  const addedDependencies: DependencySpec[] = [];
  const removedDependencies: DependencySpec[] = [];
  const changedDependencies: DiffResult['changedDependencies'] = [];

  for (const [key, currentDep] of currentDeps) {
    const baselineDep = baselineDeps.get(key);
    if (!baselineDep) {
      addedDependencies.push(currentDep);
      continue;
    }
    if (baselineDep.spec !== currentDep.spec) {
      changedDependencies.push({
        name: currentDep.name,
        section: currentDep.section,
        before: baselineDep.spec,
        after: currentDep.spec
      });
    }
  }

  for (const [key, baselineDep] of baselineDeps) {
    if (!currentDeps.has(key)) {
      removedDependencies.push(baselineDep);
    }
  }

  const packageChurn = Math.abs(current.lockfile.packageCount - baseline.lockfile.packageCount);
  const findings: Finding[] = [
    ...addedDependencies.map((dependency) => ({
      id: findingId('new-dependency', dependency.section, dependency.name),
      title: 'New direct dependency',
      severity: 'medium' as const,
      packageName: dependency.name,
      section: dependency.section,
      detail: `${dependency.name} was added to ${dependency.section} with spec ${dependency.spec}.`,
      recommendation: 'Review the package source, maintainer reputation, license, and install behavior before release.'
    })),
    ...changedDependencies.map((dependency) => ({
      id: findingId('changed-dependency', dependency.section, dependency.name),
      title: 'Changed direct dependency spec',
      severity: 'low' as const,
      packageName: dependency.name,
      section: dependency.section,
      detail: `${dependency.name} changed from ${dependency.before} to ${dependency.after}.`,
      recommendation: 'Confirm the new range is intentional and regenerate the lockfile from a trusted environment.'
    })),
    ...churnFindings(packageChurn)
  ].sort(compareFindings);

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
    addedDependencies,
    removedDependencies,
    changedDependencies,
    packageChurn,
    findings
  };
}

function dependencySpecFindings(dependencies: DependencySpec[]): Finding[] {
  const findings: Finding[] = [];
  for (const dependency of dependencies) {
    if (broadRangePattern.test(dependency.spec)) {
      findings.push({
        id: findingId('broad-range', dependency.section, dependency.name),
        title: 'Broad dependency range',
        severity: dependency.spec === 'latest' || dependency.spec === '*' ? 'high' : 'medium',
        packageName: dependency.name,
        section: dependency.section,
        detail: `${dependency.name} in ${dependency.section} uses ${dependency.spec}.`,
        recommendation: 'Prefer an exact version or a narrow reviewed range committed with a lockfile.'
      });
    }

    if (urlSpecPattern.test(dependency.spec)) {
      findings.push({
        id: findingId('url-spec', dependency.section, dependency.name),
        title: 'Git, URL, or local dependency spec',
        severity: 'high',
        packageName: dependency.name,
        section: dependency.section,
        detail: `${dependency.name} resolves from ${dependency.spec}.`,
        recommendation: 'Pin to a reviewed registry release or inspect the referenced source and commit before publishing.'
      });
    }
  }
  return findings;
}

function lockfileFindings(packages: LockedPackage[]): Finding[] {
  const findings: Finding[] = [];
  for (const packageEntry of packages) {
    if (packageEntry.hasInstallScript) {
      findings.push({
        id: findingId('install-script', 'lockfile', packageEntry.name),
        title: 'Install script or build hook',
        severity: 'high',
        packageName: packageEntry.name,
        detail: `${packageEntry.name} is marked as requiring an install/build script in the lockfile.`,
        recommendation: 'Inspect the package install scripts and confirm they are expected before running installs in trusted environments.'
      });
    }

    if (packageEntry.license !== undefined && missingLicenseValues.has(packageEntry.license.trim().toLowerCase())) {
      findings.push({
        id: findingId('missing-license', 'lockfile', packageEntry.name),
        title: 'Missing or unknown package license',
        severity: 'low',
        packageName: packageEntry.name,
        detail: `${packageEntry.name} has license value ${JSON.stringify(packageEntry.license)} in the lockfile.`,
        recommendation: 'Check the package metadata manually if license compliance matters for this release.'
      });
    }
  }
  return findings;
}

function churnFindings(packageChurn: number): Finding[] {
  if (packageChurn >= dependencyChurnHigh) {
    return [{
      id: 'large-lockfile-churn',
      title: 'Large lockfile package churn',
      severity: 'high',
      detail: `The lockfile package count changed by ${packageChurn}.`,
      recommendation: 'Review the dependency tree diff carefully and consider splitting dependency changes from feature changes.'
    }];
  }
  if (packageChurn >= dependencyChurnMedium) {
    return [{
      id: 'moderate-lockfile-churn',
      title: 'Moderate lockfile package churn',
      severity: 'medium',
      detail: `The lockfile package count changed by ${packageChurn}.`,
      recommendation: 'Check that the lockfile churn matches the intended dependency change.'
    }];
  }
  return [];
}

function summarize(snapshot: ProjectSnapshot, findings: Finding[]): ScanResult['summary'] {
  return {
    dependencyCount: snapshot.dependencies.length,
    lockedPackageCount: snapshot.lockfile.packageCount,
    high: countSeverity(findings, 'high'),
    medium: countSeverity(findings, 'medium'),
    low: countSeverity(findings, 'low')
  };
}

function countSeverity(findings: Finding[], severity: Severity): number {
  return findings.filter((finding) => finding.severity === severity).length;
}

function indexDependencies(dependencies: DependencySpec[]): Map<string, DependencySpec> {
  return new Map(dependencies.map((dependency) => [`${dependency.section}:${dependency.name}`, dependency]));
}

function findingId(kind: string, section: DependencySection | 'lockfile', name: string): string {
  return `${kind}:${section}:${name}`;
}

function compareFindings(left: Finding, right: Finding): number {
  return severityRank(right.severity) - severityRank(left.severity)
    || (left.packageName ?? '').localeCompare(right.packageName ?? '')
    || left.id.localeCompare(right.id);
}

function severityRank(severity: Severity): number {
  return severity === 'high' ? 3 : severity === 'medium' ? 2 : 1;
}
