# depscreen

Local dependency review CLI for agent-built JavaScript projects.

## Status

This repository is early-stage. Confirm the current support, release, and
security posture before using it in production.

## Install

```sh
npm install
npm run build
```

## Use

```sh
depscreen scan .
depscreen scan tests/fixtures/risky --format json
depscreen scan tests/fixtures/risky --fail-on high
```

`scan` reviews local package manifests and lockfiles for risky dependency
patterns such as unpinned ranges, `latest` tags, lifecycle scripts, and package
manager mismatches. Passing `--fail-on <severity>` exits non-zero when findings
at that severity or higher are present.

## Verify

Run the local validation script before opening a pull request:

```sh
bash scripts/validate.sh
```

`scripts/validate.sh` runs the repository's standard local checks when they are defined and will also run `agent-qc ready` when `agent-qc` is installed. Missing `agent-qc` is treated as a skip, not a failure.

For release readiness, run:

```sh
npm run release:check
```

`release:check` type-checks, runs tests, exercises the CLI smoke test, and
performs an npm pack dry run.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations. Changes
should be small, reviewable, and verified before review.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance. Replace
the default security policy before publishing the generated repository.

These links assume this README has been copied to the generated repository root.

## License

MIT
