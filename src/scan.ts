import path from 'node:path';
import { createSnapshot } from './snapshot.js';
import type { DependencySpec, Finding, LockedPackage, ProjectSnapshot, ScanResult, Severity } from './types.js';

const broadRangePattern = /(^\*$)|(^x$)|(^latest$)|(^[~^])|([<>]=?)|(\|\|)|(\s-\s)|(\*)/i;
const gitOrUrlPattern = /^(git\+|git:|https?:|ssh:|github:|gitlab:|bitbucket:|file:)/i;
const highRiskSchemePattern = /^(git\+|git:|https?:|ssh:|file:)/i;

export async function scanProject(root: string): Promise<ScanResult> {
  const absoluteRoot = path.resolve(root);
  const snapshot = await createSnapshot(absoluteRoot);
  const findings = findSnapshotRisks(snapshot);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    root: absoluteRoot,
    summary: summarize(snapshot, findings),
    snapshot,
    findings
  };
}

export function findSnapshotRisks(snapshot: ProjectSnapshot): Finding[] {
  const findings: Finding[] = [];

  for (const dependency of snapshot.dependencies) {
    if (broadRangePattern.test(dependency.spec)) {
      findings.push({
        id: `broad-range:${dependency.section}:${dependency.name}`,
        title: 'Broad dependency range',
        severity: dependency.spec === 'latest' || dependency.spec === '*' ? 'high' : 'medium',
        packageName: dependency.name,
        section: dependency.section,
        detail: `${dependency.name} uses ${dependency.spec} in ${dependency.section}.`,
        recommendation: 'Pin the dependency or use a narrow reviewed range before release.'
      });
    }

    if (gitOrUrlPattern.test(dependency.spec)) {
      findings.push({
        id: `non-registry-spec:${dependency.section}:${dependency.name}`,
        title: 'Non-registry dependency spec',
        severity: highRiskSchemePattern.test(dependency.spec) ? 'high' : 'medium',
        packageName: dependency.name,
        section: dependency.section,
        detail: `${dependency.name} is installed from ${dependency.spec}.`,
        recommendation: 'Confirm the source, commit, and reproducibility expectations.'
      });
    }
  }

  for (const lockedPackage of snapshot.lockfile.packages) {
    if (lockedPackage.hasInstallScript) {
      findings.push({
        id: `install-script:${lockedPackage.name}`,
        title: 'Install script or build step',
        severity: 'high',
        packageName: lockedPackage.name,
        detail: `${formatLockedPackage(lockedPackage)} declares an install/build step in the lockfile.`,
        recommendation: 'Review the package maintainer, scripts, and published artifact before accepting.'
      });
    }

    if (!lockedPackage.license) {
      findings.push({
        id: `missing-license:${lockedPackage.name}`,
        title: 'Missing license metadata',
        severity: 'low',
        packageName: lockedPackage.name,
        detail: `${formatLockedPackage(lockedPackage)} has no license field in the parsed lockfile metadata.`,
        recommendation: 'Check package license metadata before redistribution or release.'
      });
    }
  }

  if (snapshot.lockfile.kind === 'none') {
    findings.push({
      id: 'missing-lockfile',
      title: 'No supported lockfile found',
      severity: 'medium',
      detail: 'No package-lock.json or pnpm-lock.yaml was found.',
      recommendation: 'Commit a supported lockfile so dependency review is reproducible.'
    });
  }

  return sortFindings(findings);
}

export function summarize(snapshot: ProjectSnapshot, findings: Finding[]): ScanResult['summary'] {
  return {
    dependencyCount: snapshot.dependencies.length,
    lockedPackageCount: snapshot.lockfile.packageCount,
    high: findings.filter((finding) => finding.severity === 'high').length,
    medium: findings.filter((finding) => finding.severity === 'medium').length,
    low: findings.filter((finding) => finding.severity === 'low').length
  };
}

export function reachesSeverity(findings: Finding[], failOn: Severity): boolean {
  const order: Record<Severity, number> = { low: 1, medium: 2, high: 3 };
  return findings.some((finding) => order[finding.severity] >= order[failOn]);
}

export function sortFindings(findings: Finding[]): Finding[] {
  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  return [...findings].sort((left, right) => {
    const severity = order[left.severity] - order[right.severity];
    if (severity !== 0) {
      return severity;
    }
    return left.id.localeCompare(right.id);
  });
}

function formatLockedPackage(lockedPackage: LockedPackage): string {
  return lockedPackage.version ? `${lockedPackage.name}@${lockedPackage.version}` : lockedPackage.name;
}
