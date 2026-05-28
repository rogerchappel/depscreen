import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readJsonFile } from './fs.js';
import type { DiffResult, ProjectSnapshot, ScanResult } from './types.js';

export async function writeOutput(outputPath: string | undefined, content: string): Promise<void> {
  if (!outputPath) {
    process.stdout.write(content);
    return;
  }
  await mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
  await writeFile(outputPath, content, 'utf8');
}

export async function readSnapshot(filePath: string): Promise<ProjectSnapshot> {
  const snapshot = await readJsonFile<ProjectSnapshot>(filePath);
  if (snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.dependencies) || !snapshot.lockfile) {
    throw new Error(`${filePath} is not a depscreen snapshot`);
  }
  return snapshot;
}

export async function readReportable(filePath: string): Promise<ScanResult | DiffResult> {
  const value = await readJsonFile<ScanResult | DiffResult>(filePath);
  if (value.schemaVersion !== 1 || !Array.isArray(value.findings)) {
    throw new Error(`${filePath} is not a depscreen scan or diff result`);
  }
  return value;
}
