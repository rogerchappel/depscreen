#!/usr/bin/env node
import path from 'node:path';
import { diffSnapshotFiles } from './diff.js';
import { readJsonFile, writeTextFile } from './fs.js';
import { renderReport } from './report.js';
import { reachesSeverity, scanProject } from './scan.js';
import { createSnapshot } from './snapshot.js';
import type { OutputFormat, Severity } from './types.js';

interface CliOptions {
  root: string;
  output?: string;
  format: OutputFormat;
  failOn?: Severity;
}

async function main(argv: string[]): Promise<number> {
  const [command, ...args] = argv;

  try {
    if (!command || command === '--help' || command === '-h') {
      printHelp();
      return command ? 0 : 1;
    }

    if (command === '--version' || command === '-v') {
      const packageJson = await readJsonFile<{ version: string }>(new URL('../../package.json', import.meta.url).pathname);
      process.stdout.write(`${packageJson.version}\n`);
      return 0;
    }

    if (command === 'snapshot') {
      const options = parseOptions(args);
      const snapshot = await createSnapshot(options.root);
      await emit(renderReport(snapshot, 'json'), options.output);
      return 0;
    }

    if (command === 'scan') {
      const options = parseOptions(args);
      const result = await scanProject(options.root);
      await emit(renderReport(result, options.format), options.output);
      return options.failOn && reachesSeverity(result.findings, options.failOn) ? 2 : 0;
    }

    if (command === 'diff') {
      const options = parseOptions(args, 2);
      const positional = getPositionals(args);
      const result = await diffSnapshotFiles(positional[0], positional[1]);
      await emit(renderReport(result, options.format), options.output);
      return options.failOn && reachesSeverity(result.findings, options.failOn) ? 2 : 0;
    }

    if (command === 'report') {
      const options = parseOptions(args, 1);
      const [input] = getPositionals(args);
      const value = await readJsonFile<unknown>(input);
      await emit(renderReport(value as never, options.format), options.output);
      return 0;
    }

    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`depscreen: ${message}\n`);
    return 1;
  }
}

function parseOptions(args: string[], requiredPositionals = 0): CliOptions {
  const options: CliOptions = {
    root: process.cwd(),
    format: 'text'
  };
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--root') {
      options.root = requireValue(args, (index += 1), arg);
    } else if (arg === '--output' || arg === '-o') {
      options.output = requireValue(args, (index += 1), arg);
    } else if (arg === '--format') {
      options.format = parseFormat(requireValue(args, (index += 1), arg));
    } else if (arg === '--fail-on') {
      options.failOn = parseSeverity(requireValue(args, (index += 1), arg));
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positionals.push(arg);
    }
  }

  if (positionals.length < requiredPositionals) {
    throw new Error(`Expected ${requiredPositionals} positional argument(s), got ${positionals.length}`);
  }

  return options;
}

function getPositionals(args: string[]): string[] {
  const positionals: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--root' || arg === '--output' || arg === '-o' || arg === '--format' || arg === '--fail-on') {
      index += 1;
    } else if (!arg.startsWith('-')) {
      positionals.push(arg);
    }
  }
  return positionals;
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index];
  if (!value) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function parseFormat(value: string): OutputFormat {
  if (value === 'text' || value === 'json' || value === 'markdown') {
    return value;
  }
  throw new Error(`Invalid format: ${value}`);
}

function parseSeverity(value: string): Severity {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }
  throw new Error(`Invalid severity: ${value}`);
}

async function emit(value: string, output?: string): Promise<void> {
  if (output) {
    await writeTextFile(path.resolve(output), value);
    return;
  }
  process.stdout.write(value);
}

function printHelp(): void {
  process.stdout.write(`depscreen

Usage:
  depscreen snapshot [--root .] [--output depscreen.lock.json]
  depscreen scan [--root .] [--format text|json|markdown] [--output depscreen.json] [--fail-on low|medium|high]
  depscreen diff baseline.json current.json [--format text|json|markdown] [--output depscreen.diff.json] [--fail-on low|medium|high]
  depscreen report depscreen.json [--format text|json|markdown] [--output DEPENDENCIES.md]

depscreen is local-only and uses heuristic findings as review prompts.
`);
}

process.exitCode = await main(process.argv.slice(2));
