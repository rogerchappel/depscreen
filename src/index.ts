export { formatMarkdown, formatText } from './report.js';
export { scanProject } from './scan.js';
export { createSnapshot } from './snapshot.js';
export type {
  DependencySection,
  DependencySpec,
  DiffResult,
  Finding,
  LockedPackage,
  LockfileKind,
  OutputFormat,
  ProjectSnapshot,
  ScanResult,
  Severity
} from './types.js';
