#!/usr/bin/env node
import path from 'node:path';
import { readReportable, readSnapshot, writeOutput } from './io.js';
import { formatReport, shouldFail } from './report.js';
import { diffSnapshots, scanSnapshot } from './rules.js';
import { createSnapshot } from './snapshot.js';
import type { OutputFormat, Severity } from './types.js';

type Command = 'snapshot' | 'scan' | 'diff' | 'report' | 'help';

interface Options {
  root: string;
  output?: string;
  format: OutputFormat;
  failOn?: Severity;
}

const defaultOptions: Options = {
  root: '.',
  format: 'text'
};

async function main(argv: string[]): Promise<number> {
  const [command = 'help', ...args] = argv;
  if (command === 'help' || command === '--help' || command === '-h') {
    process.stdout.write(helpText());
    return 0;
  }
  if (!isCommand(command)) {
    throw new Error(`Unknown command: ${command}`);
  }

  if (command === 'snapshot') {
    const options = parseOptions(args, { ...defaultOptions, format: 'json' });
    const snapshot = await createSnapshot(options.root);
    await writeOutput(options.output, `${JSON.stringify(snapshot, null, 2)}\n`);
    return 0;
  }

  if (command === 'scan') {
    const options = parseOptions(args, defaultOptions);
    const snapshot = await createSnapshot(options.root);
    const result = scanSnapshot(snapshot, path.resolve(options.root));
    await writeOutput(options.output, formatReport(result, options.format));
    return shouldFail(result.findings, options.failOn) ? 1 : 0;
  }

  if (command === 'diff') {
    const positional = args.filter((arg) => !arg.startsWith('-'));
    if (positional.length < 2) {
      throw new Error('diff requires baseline and current snapshot paths');
    }
    const options = parseOptions(args, defaultOptions);
    const result = diffSnapshots(await readSnapshot(positional[0]), await readSnapshot(positional[1]));
    await writeOutput(options.output, formatReport(result, options.format));
    return shouldFail(result.findings, options.failOn) ? 1 : 0;
  }

  const positional = args.filter((arg) => !arg.startsWith('-'));
  if (positional.length < 1) {
    throw new Error('report requires a depscreen JSON result path');
  }
  const options = parseOptions(args, defaultOptions);
  const result = await readReportable(positional[0]);
  await writeOutput(options.output, formatReport(result, options.format));
  return shouldFail(result.findings, options.failOn) ? 1 : 0;
}

function parseOptions(args: string[], defaults: Options): Options {
  const options = { ...defaults };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('-')) {
      continue;
    }
    const value = args[index + 1];
    if (arg === '--root') {
      options.root = requireValue(arg, value);
      index += 1;
    } else if (arg === '--output' || arg === '-o') {
      options.output = requireValue(arg, value);
      index += 1;
    } else if (arg === '--format') {
      options.format = parseFormat(requireValue(arg, value));
      index += 1;
    } else if (arg === '--fail-on') {
      options.failOn = parseSeverity(requireValue(arg, value));
      index += 1;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

function requireValue(flag: string, value: string | undefined): string {
  if (!value || value.startsWith('-')) {
    throw new Error(`${flag} requires a value`);
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

function isCommand(command: string): command is Command {
  return ['snapshot', 'scan', 'diff', 'report'].includes(command);
}

function helpText(): string {
  return `depscreen

Usage:
  depscreen snapshot --root . --output depscreen.lock.json
  depscreen scan --root . --format text|json|markdown [--fail-on high]
  depscreen diff baseline.json current.json --format markdown
  depscreen report depscreen.json --output DEPENDENCIES.md

Commands:
  snapshot  Write a deterministic local dependency snapshot.
  scan      Scan package.json and supported lockfiles for review warnings.
  diff      Compare two depscreen snapshots.
  report    Render a saved scan or diff JSON result.
`;
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`depscreen: ${message}\n`);
    process.exitCode = 2;
  });
