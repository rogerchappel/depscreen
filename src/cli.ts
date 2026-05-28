#!/usr/bin/env node
import { formatMarkdown, formatText } from './report.js';
import { scanProject } from './scan.js';
import type { OutputFormat } from './types.js';

interface CliOptions {
  root: string;
  format: OutputFormat;
  failOn: 'none' | 'low' | 'medium' | 'high';
}

const usage = `depscreen

Usage:
  depscreen scan [path] [--format text|json|markdown] [--fail-on none|low|medium|high]
  depscreen --help

Examples:
  depscreen scan .
  depscreen scan ./packages/app --format json
  depscreen scan . --fail-on high
`;

async function main(argv: string[]): Promise<number> {
  const options = parseArgs(argv);

  if (!options) {
    process.stdout.write(usage);
    return 0;
  }

  const result = await scanProject(options.root);
  process.stdout.write(formatResult(result, options.format));
  process.stdout.write('\n');

  return shouldFail(result.summary, options.failOn) ? 1 : 0;
}

function parseArgs(argv: string[]): CliOptions | undefined {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    return undefined;
  }

  const [command, ...rest] = argv;
  if (command !== 'scan') {
    throw new Error(`Unknown command: ${command}`);
  }

  const options: CliOptions = {
    root: '.',
    format: 'text',
    failOn: 'none'
  };

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === '--format') {
      options.format = parseFormat(rest[++index]);
      continue;
    }

    if (arg.startsWith('--format=')) {
      options.format = parseFormat(arg.slice('--format='.length));
      continue;
    }

    if (arg === '--json') {
      options.format = 'json';
      continue;
    }

    if (arg === '--markdown') {
      options.format = 'markdown';
      continue;
    }

    if (arg === '--fail-on') {
      options.failOn = parseFailOn(rest[++index]);
      continue;
    }

    if (arg.startsWith('--fail-on=')) {
      options.failOn = parseFailOn(arg.slice('--fail-on='.length));
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    options.root = arg;
  }

  return options;
}

function parseFormat(value: string | undefined): OutputFormat {
  if (value === 'text' || value === 'json' || value === 'markdown') {
    return value;
  }
  throw new Error(`Unsupported format: ${value ?? '<missing>'}`);
}

function parseFailOn(value: string | undefined): CliOptions['failOn'] {
  if (value === 'none' || value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }
  throw new Error(`Unsupported fail threshold: ${value ?? '<missing>'}`);
}

function formatResult(result: Awaited<ReturnType<typeof scanProject>>, format: OutputFormat): string {
  if (format === 'json') {
    return JSON.stringify(result, null, 2);
  }
  if (format === 'markdown') {
    return formatMarkdown(result);
  }
  return formatText(result);
}

function shouldFail(summary: Awaited<ReturnType<typeof scanProject>>['summary'], threshold: CliOptions['failOn']): boolean {
  if (threshold === 'none') {
    return false;
  }
  if (threshold === 'low') {
    return summary.low + summary.medium + summary.high > 0;
  }
  if (threshold === 'medium') {
    return summary.medium + summary.high > 0;
  }
  return summary.high > 0;
}

main(process.argv.slice(2))
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`depscreen: ${message}\n`);
    process.stderr.write(`Run "depscreen --help" for usage.\n`);
    process.exitCode = 2;
  });
