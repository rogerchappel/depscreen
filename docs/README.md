# depscreen Documentation

This directory tracks the release plan and operating docs for `depscreen`.

## Contents

- [Product requirements](PRD.md)
- [Task checklist](TASKS.md)
- [Orchestration plan](ORCHESTRATION.md)
- [Machine-readable orchestration plan](orchestration.json)
- [Contributing guide](../CONTRIBUTING.md)
- [Security policy](../SECURITY.md)
- [Agent instructions](../AGENTS.md)

## Release Gate

Before release, run:

```sh
npm run release:check
```

Use `depscreen` output as a review prompt. It does not prove package safety.
