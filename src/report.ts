import type { DiffResult, Finding, OutputFormat, ScanResult, Severity } from './types.js';

export type Reportable = ScanResult | DiffResult;

export function formatReport(result: Reportable, format: OutputFormat): string {
  if (format === 'json') {
    return `${JSON.stringify(result, null, 2)}\n`;
  }
  if (format === 'markdown') {
    return formatMarkdown(result);
  }
  return formatText(result);
}

export function shouldFail(findings: Finding[], failOn?: Severity): boolean {
  if (!failOn) {
    return false;
  }
  const threshold = severityRank(failOn);
  return findings.some((finding) => severityRank(finding.severity) >= threshold);
}

function formatText(result: Reportable): string {
  if ('summary' in result) {
    const lines = [
      'depscreen scan report',
      `dependencies: ${result.summary.dependencyCount}`,
      `locked packages: ${result.summary.lockedPackageCount}`,
      `findings: ${result.findings.length} (${result.summary.high} high, ${result.summary.medium} medium, ${result.summary.low} low)`,
      ''
    ];
    return `${lines.join('\n')}${formatFindingText(result.findings)}`;
  }

  const lines = [
    'depscreen diff report',
    `dependencies: ${result.baseline.dependencyCount} -> ${result.current.dependencyCount}`,
    `locked packages: ${result.baseline.lockedPackageCount} -> ${result.current.lockedPackageCount}`,
    `added dependencies: ${result.addedDependencies.length}`,
    `removed dependencies: ${result.removedDependencies.length}`,
    `changed dependencies: ${result.changedDependencies.length}`,
    `package churn: ${result.packageChurn}`,
    `findings: ${result.findings.length}`,
    ''
  ];
  return `${lines.join('\n')}${formatFindingText(result.findings)}`;
}

function formatFindingText(findings: Finding[]): string {
  if (findings.length === 0) {
    return 'No deterministic dependency review warnings found.\n';
  }
  return findings.map((finding) => [
    `[${finding.severity}] ${finding.title}${finding.packageName ? `: ${finding.packageName}` : ''}`,
    `  ${finding.detail}`,
    `  Recommendation: ${finding.recommendation}`
  ].join('\n')).join('\n\n') + '\n';
}

function formatMarkdown(result: Reportable): string {
  const lines = ['# depscreen report', ''];
  if ('summary' in result) {
    lines.push(
      '## Summary',
      '',
      `- Dependencies: ${result.summary.dependencyCount}`,
      `- Locked packages: ${result.summary.lockedPackageCount}`,
      `- Findings: ${result.findings.length} (${result.summary.high} high, ${result.summary.medium} medium, ${result.summary.low} low)`,
      ''
    );
  } else {
    lines.push(
      '## Summary',
      '',
      `- Dependencies: ${result.baseline.dependencyCount} -> ${result.current.dependencyCount}`,
      `- Locked packages: ${result.baseline.lockedPackageCount} -> ${result.current.lockedPackageCount}`,
      `- Added dependencies: ${result.addedDependencies.length}`,
      `- Removed dependencies: ${result.removedDependencies.length}`,
      `- Changed dependencies: ${result.changedDependencies.length}`,
      `- Package churn: ${result.packageChurn}`,
      ''
    );
  }

  lines.push('## Findings', '');
  if (result.findings.length === 0) {
    lines.push('No deterministic dependency review warnings found.', '');
    return lines.join('\n');
  }

  for (const finding of result.findings) {
    lines.push(
      `### ${finding.severity.toUpperCase()}: ${finding.title}${finding.packageName ? ` (${finding.packageName})` : ''}`,
      '',
      finding.detail,
      '',
      `Recommendation: ${finding.recommendation}`,
      ''
    );
  }
  return lines.join('\n');
}

function severityRank(severity: Severity): number {
  return severity === 'high' ? 3 : severity === 'medium' ? 2 : 1;
}
