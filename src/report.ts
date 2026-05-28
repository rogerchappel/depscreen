import type { Finding, ScanResult } from './types.js';

export function formatText(result: ScanResult): string {
  const lines = [
    `depscreen scan: ${result.snapshot.rootName ?? result.root}`,
    `Dependencies: ${result.summary.dependencyCount}`,
    `Locked packages: ${result.summary.lockedPackageCount}`,
    `Findings: ${result.findings.length} (${result.summary.high} high, ${result.summary.medium} medium, ${result.summary.low} low)`
  ];

  if (result.findings.length === 0) {
    lines.push('', 'No dependency review findings.');
    return lines.join('\n');
  }

  lines.push('');
  for (const finding of result.findings) {
    lines.push(formatFindingText(finding));
  }

  return lines.join('\n');
}

export function formatMarkdown(result: ScanResult): string {
  const lines = [
    '# depscreen scan',
    '',
    `- Project: ${result.snapshot.rootName ?? result.root}`,
    `- Dependencies: ${result.summary.dependencyCount}`,
    `- Locked packages: ${result.summary.lockedPackageCount}`,
    `- Findings: ${result.findings.length} (${result.summary.high} high, ${result.summary.medium} medium, ${result.summary.low} low)`
  ];

  if (result.findings.length === 0) {
    lines.push('', 'No dependency review findings.');
    return lines.join('\n');
  }

  lines.push('', '## Findings', '');
  for (const finding of result.findings) {
    lines.push(`### ${finding.severity.toUpperCase()}: ${finding.title}`);
    lines.push('');
    lines.push(`- Rule: \`${finding.id}\``);
    if (finding.packageName) {
      lines.push(`- Package: \`${finding.packageName}\``);
    }
    if (finding.section) {
      lines.push(`- Section: \`${finding.section}\``);
    }
    lines.push(`- Detail: ${finding.detail}`);
    lines.push(`- Recommendation: ${finding.recommendation}`);
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

function formatFindingText(finding: Finding): string {
  const target = finding.packageName ? ` (${finding.packageName})` : '';
  const section = finding.section ? ` [${finding.section}]` : '';
  return [
    `[${finding.severity.toUpperCase()}] ${finding.title}${target}${section}`,
    `  Rule: ${finding.id}`,
    `  Detail: ${finding.detail}`,
    `  Recommendation: ${finding.recommendation}`
  ].join('\n');
}
