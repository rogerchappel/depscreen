# depscreen

Local dependency review CLI for agent-built JavaScript projects.

## Status

This repository is early-stage. `depscreen` is an offline heuristic reviewer,
not a vulnerability database or proof that dependencies are safe.

## Install

From npm, once published:

```sh
npm install --save-dev depscreen
```

For local development, clone the repository and run `npm ci`.

## Use

Create a dependency snapshot:

```sh
npx depscreen snapshot --root . --output depscreen.lock.json
```

Scan the current project:

```sh
npx depscreen scan --root . --format text --fail-on high
```

Compare two snapshots:

```sh
npx depscreen diff baseline.json current.json --format markdown
```

Render a saved JSON result as Markdown:

```sh
npx depscreen report depscreen.json --format markdown --output DEPENDENCIES.md
```

Findings are review prompts. The CLI currently flags broad ranges, non-registry
dependency specs, install/build scripts in parsed lockfiles, missing lockfiles,
missing license metadata, added dependencies, and lockfile churn.

## Commands

```text
depscreen snapshot [--root .] [--output depscreen.lock.json]
depscreen scan [--root .] [--format text|json|markdown] [--output depscreen.json] [--fail-on low|medium|high]
depscreen diff baseline.json current.json [--format text|json|markdown] [--output depscreen.diff.json] [--fail-on low|medium|high]
depscreen report depscreen.json [--format text|json|markdown] [--output DEPENDENCIES.md]
```

## Verify

Run the local validation script before opening a pull request:

```sh
bash scripts/validate.sh
```

`scripts/validate.sh` runs the repository's standard local checks when they are defined and will also run `agent-qc ready` when `agent-qc` is installed. Missing `agent-qc` is treated as a skip, not a failure.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations. Changes
should be small, reviewable, and verified before review.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## License

MIT
