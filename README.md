# depscreen

Local dependency review CLI for agent-built JavaScript projects.

`depscreen` creates deterministic dependency snapshots, scans package metadata
and lockfiles for review prompts, compares snapshots, and renders review notes
in text, JSON, or Markdown. It is intentionally local-first: no registry calls,
no telemetry, and no network dependency for the core checks.

## Status

Early public build. The current rules are heuristic review prompts, not proof
that a dependency is safe and not a replacement for `npm audit`, Socket, Snyk,
or manual maintainer review.

## Install

```sh
npm install --save-dev depscreen
```

For local development in this repository:

```sh
npm install
npm run build
```

## Use

Create a dependency snapshot:

```sh
npx depscreen snapshot --root . --output depscreen.lock.json
```

Scan the current project:

```sh
npx depscreen scan --root . --format markdown --output DEPENDENCIES.md
```

Fail CI when high-risk findings are present:

```sh
npx depscreen scan --root . --fail-on high
```

Compare two snapshots:

```sh
npx depscreen diff baseline.json current.json --format markdown
```

Render a saved JSON result:

```sh
npx depscreen report depscreen-result.json --output DEPENDENCY_REVIEW.md
```

## Commands

- `snapshot`: writes a deterministic local dependency snapshot.
- `scan`: scans `package.json` and supported lockfiles for review warnings.
- `diff`: compares two dependency snapshots.
- `report`: renders a saved JSON scan or diff result.

## Supported Inputs

- `package.json`
- `package-lock.json`
- `pnpm-lock.yaml`

## Findings

The first release flags:

- broad dependency ranges such as `latest`, `*`, `^`, `~`, and comparator ranges
- git, URL, local file, and hosted-source dependency specs
- lockfile packages marked with install/build scripts
- missing or unknown license metadata when lockfile data exposes it
- moderate or large lockfile package churn between snapshots
- newly added and changed direct dependency specs

## Verify

Run the release check before opening a pull request:

```sh
npm run release:check
npm run package:smoke
```

`release:check` runs typecheck, tests, smoke coverage, and the package dry run.
Run `package:smoke` directly when you only changed npm package contents.

## Documentation

- [Product requirements](docs/PRD.md)
- [Task checklist](docs/TASKS.md)
- [Orchestration plan](docs/ORCHESTRATION.md)
- [Local-first safety notes](safety/LOCAL_FIRST.md)
- [Release notes](RELEASE_NOTES.md)

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## License

MIT
