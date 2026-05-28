# depscreen Task Checklist

Status: release candidate

## Completed

- Scaffolded TypeScript CLI package.
- Implemented local dependency snapshots.
- Added npm and pnpm lockfile readers.
- Added scan, diff, report, and snapshot commands.
- Added text, JSON, and Markdown reports.
- Added deterministic heuristic rules for dependency review prompts.
- Added tests and smoke fixture coverage.
- Added release check scripts.

## Release Gate

- Run `npm install`.
- Run `npm run check`.
- Run `npm test`.
- Run `npm run smoke`.
- Run `npm pack --dry-run`.
- Review generated package contents before publishing.
- Confirm GitHub branch protection is enabled for `main`.

## Post-MVP

- Add workspace-aware pnpm examples.
- Add optional npm audit or registry enrichment behind an explicit network flag.
- Add baseline file conventions for CI usage.
- Add more lockfile metadata coverage as real examples appear.
