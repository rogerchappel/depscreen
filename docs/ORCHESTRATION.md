# depscreen Orchestration

This project is safe to run as a local preflight in agentic build pipelines.

## Agent Flow

1. Build the package with `npm run build`.
2. Create a baseline snapshot before dependency edits.
3. Apply the intended dependency change.
4. Create a current snapshot.
5. Run `depscreen diff baseline.json current.json --format markdown`.
6. Attach the Markdown report to the pull request or release checklist.
7. Run `depscreen scan --root . --fail-on high` as a blocking local gate.

## Release Flow

1. Run `npm run release:check`.
2. Review `npm pack --dry-run` output.
3. Confirm no generated reports or local snapshots are committed by accident.
4. Open a pull request using the repository template.
5. Merge only after maintainer review.

## Safety Properties

- Core commands do not make network calls.
- Outputs are deterministic except for report timestamps.
- Findings are prompts for review, not authoritative vulnerability verdicts.
- Commands can be run against fixtures or temporary directories without
  modifying the target project unless `--output` points inside it.
