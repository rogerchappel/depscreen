import type { DiffResult, Finding, OutputFormat, ProjectSnapshot, ScanResult } from './types.js';

type Reportable = ProjectSnapshot | ScanResult | DiffResult;

export function renderReport(value: Reportable, format: OutputFormat): string {
  if (format === 'json') {
    return `${JSON.stringify(value, null, 2)}\n`;
  }

  if (isScanResult(value)) {
    return format === 'markdown' ? renderScanMarkdown(value) : renderScanText(value);
  }

  if (isDiffResult(value)) {
    return format === 'markdown' ? renderDiffMarkdown(value) : renderDiffText(value);
  }

  return format === 'markdown' ? renderSnapshotMarkdown(value) : renderSnapshotText(value);
}

function renderScanText(result: ScanResult): string {
  const lines = [
    'depscreen scan',
    `Root: ${result.root}`,
    `Dependencies: ${result.summary.dependencyCount}`,
    `Locked packages: ${result.summary.lockedPackageCount}`,
    `Findings: ${result.findings.length} (${result.summary.high} high, ${result.summary.medium} medium, ${result.summary.low} low)`,
    ''
  ];
  appendTextFindings(lines, result.findings);
  return `${lines.join('\n')}\n`;
}

function renderDiffText(result: DiffResult): string {
  const lines = [
    'depscreen diff',
    `Dependencies: ${result.baseline.dependencyCount} -> ${result.current.dependencyCount}`,
    `Locked packages: ${result.baseline.lockedPackageCount} -> ${result.current.lockedPackageCount}`,
    `Added dependencies: ${result.addedDependencies.length}`,
    `Removed dependencies: ${result.removedDependencies.length}`,
    `Changed dependencies: ${result.changedDependencies.length}`,
    `Package churn: ${result.packageChurn}`,
    ''
  ];
  appendTextFindings(lines, result.findings);
  return `${lines.join('\n')}\n`;
}

function renderSnapshotText(snapshot: ProjectSnapshot): string {
  return [
    'depscreen snapshot',
    `Project: ${snapshot.rootName ?? 'unknown'}`,
    `Package manager: ${snapshot.packageManager ?? 'unknown'}`,
    `Dependencies: ${snapshot.dependencies.length}`,
    `Lockfile: ${snapshot.lockfile.kind}`,
    `Locked packages: ${snapshot.lockfile.packageCount}`,
    ''
  ].join('\n');
}

function renderScanMarkdown(result: ScanResult): string {
  const lines = [
    '# Dependency Review',
    '',
    `- Root: \`${result.root}\``,
    `- Dependencies: ${result.summary.dependencyCount}`,
    `- Locked packages: ${result.summary.lockedPackageCount}`,
    `- Findings: ${result.findings.length} (${result.summary.high} high, ${result.summary.medium} medium, ${result.summary.low} low)`,
    '',
    '## Findings',
    ''
  ];
  appendMarkdownFindings(lines, result.findings);
  return `${lines.join('\n')}\n`;
}

function renderDiffMarkdown(result: DiffResult): string {
  const lines = [
    '# Dependency Diff',
    '',
    `- Dependencies: ${result.baseline.dependencyCount} -> ${result.current.dependencyCount}`,
    `- Locked packages: ${result.baseline.lockedPackageCount} -> ${result.current.lockedPackageCount}`,
    `- Added dependencies: ${result.addedDependencies.length}`,
    `- Removed dependencies: ${result.removedDependencies.length}`,
    `- Changed dependencies: ${result.changedDependencies.length}`,
    `- Package churn: ${result.packageChurn}`,
    '',
    '## Findings',
    ''
  ];
  appendMarkdownFindings(lines, result.findings);
  return `${lines.join('\n')}\n`;
}

function renderSnapshotMarkdown(snapshot: ProjectSnapshot): string {
  return [
    '# Dependency Snapshot',
    '',
    `- Project: ${snapshot.rootName ?? 'unknown'}`,
    `- Package manager: ${snapshot.packageManager ?? 'unknown'}`,
    `- Dependencies: ${snapshot.dependencies.length}`,
    `- Lockfile: ${snapshot.lockfile.kind}`,
    `- Locked packages: ${snapshot.lockfile.packageCount}`,
    ''
  ].join('\n');
}

function appendTextFindings(lines: string[], findings: Finding[]): void {
  if (findings.length === 0) {
    lines.push('No findings.');
    return;
  }

  for (const finding of findings) {
    lines.push(`[${finding.severity}] ${finding.title}`);
    lines.push(`  Detail: ${finding.detail}`);
    lines.push(`  Recommendation: ${finding.recommendation}`);
  }
}

function appendMarkdownFindings(lines: string[], findings: Finding[]): void {
  if (findings.length === 0) {
    lines.push('No findings.');
    return;
  }

  for (const finding of findings) {
    lines.push(`### ${finding.title}`);
    lines.push('');
    lines.push(`- Severity: ${finding.severity}`);
    if (finding.packageName) {
      lines.push(`- Package: \`${finding.packageName}\``);
    }
    lines.push(`- Detail: ${finding.detail}`);
    lines.push(`- Recommendation: ${finding.recommendation}`);
    lines.push('');
  }
}

function isScanResult(value: Reportable): value is ScanResult {
  return 'summary' in value && 'snapshot' in value;
}

function isDiffResult(value: Reportable): value is DiffResult {
  return 'addedDependencies' in value && 'packageChurn' in value;
}
