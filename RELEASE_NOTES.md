# Release Notes

## 0.1.0

Initial public build of `depscreen`.

### Added

- Local dependency snapshot generation.
- Scan, diff, report, and snapshot CLI commands.
- npm and pnpm lockfile support for MVP fixtures.
- Text, JSON, and Markdown report output.
- Heuristic findings for broad ranges, URL specs, install scripts, missing
  license metadata, package churn, new dependencies, and changed specs.
- Fixture-backed tests and smoke coverage.

### Notes

- `depscreen` is a local review assistant, not a vulnerability scanner.
- Core commands do not make network calls.
