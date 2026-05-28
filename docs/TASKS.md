# depscreen Release Tasks

Use this checklist for every release candidate before tagging or publishing.

## Required Checks

- Install dependencies with `npm install` or `npm ci`.
- Run `npm run release:check`.
- Run `releasebox check .` when ReleaseBox is available.
- Refresh `RELEASE_NOTES.md` with `releasebox notes .`.
- Review `npm pack --dry-run` output for package contents.

## Manual Review

- Confirm clean and risky fixture scans still match the README examples.
- Confirm `--fail-on` exits non-zero at the selected severity threshold.
- Confirm package metadata points to built `dist/src` entrypoints.
- Confirm dependency findings avoid network access and remain deterministic.

## Tagging

- Do not tag until all required checks pass.
- Push the factory branch for review before creating a release.
- Update release links after the first version tag exists.
