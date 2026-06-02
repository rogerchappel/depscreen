# Roadmap

This roadmap describes intended direction, not a binding delivery promise.
Review it regularly and update it as the project learns from users,
contributors, and implementation constraints.

## Now

- Stabilize the first public CLI release.
- Keep local-first behavior explicit and tested.
- Improve examples around PR and release checklist usage.

## Next

- Add workspace-aware pnpm examples.
- Document CI baseline patterns.
- Improve lockfile metadata coverage from real-world samples.

## Later

- Add optional registry or audit enrichment behind an explicit network flag.
- Explore SARIF output if security-review workflows need it.
- Add integrations only where they preserve local-first defaults.

## Not Planned

- Unrelated platform rewrites without a clear migration path.
- Mandatory dependencies on a single ecosystem unless the project requires it.
- Public release dates before maintainers are ready to commit to them.

## Roadmap Review

Before each major or meaningful minor release:

- Move completed user-visible work into `CHANGELOG.md`.
- Remove stale commitments.
- Promote only the next reviewable set of work into `Now`.
