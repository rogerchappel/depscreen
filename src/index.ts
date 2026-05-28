export { createSnapshot } from './snapshot.js';
export { diffSnapshots, scanSnapshot } from './rules.js';
export { formatReport, shouldFail } from './report.js';
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
