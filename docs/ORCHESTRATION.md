# depscreen Orchestration Plan

`depscreen` is a local-first dependency review CLI. Release automation should
validate deterministic local scans without requiring network access in the CLI
runtime path.

## Local Maintainer Flow

1. Install dependencies with `npm install` or `npm ci`.
2. Keep commits focused and reviewable.
3. Run `npm run release:check`.
4. Run `releasebox check .`.
5. Refresh `RELEASE_NOTES.md` with `releasebox notes .`.
6. Push the branch for review.

## CI Flow

- `CI` runs build and test coverage for pull requests and `main`.
- `Release dry run` validates ReleaseBox readiness and package smoke checks.
- `Release` runs from reviewed version tags and publishes release artifacts.

## Operating Boundaries

- The CLI reads local package manifests and lockfiles.
- Scans should stay deterministic and avoid registry lookups.
- Findings are advisory unless callers opt into failing with `--fail-on`.
