# depscreen PRD

Status: in-progress

## Summary

`depscreen` is a local dependency review CLI for agent-built JavaScript projects. It reads `package.json` and lockfiles, flags risky dependency patterns, detects install-script surprises, summarizes license fields when available, and emits a concise review note an agent can paste into a PR or release checklist.

## Source attribution

Inspired by 2026 security reporting around AI coding agents and dependency-vetting gaps, plus the broader need to pin and review agent-generated changes before publishing. This project is an offline heuristic reviewer, not a vulnerability database or package scanner clone.

## Problem

Agents can add dependencies quickly, and reviewers often miss install scripts, broad semver ranges, dependency churn, or package metadata that deserves a second look. Existing scanners usually need network access or focus on CVEs after install.

## Users

- OSS maintainers reviewing agent-generated Node/TypeScript changes.
- Developers who want a quick local preflight before `npm publish`.
- Agent orchestrators adding dependency safety gates.

## V1 Goals

- Parse `package.json`, `package-lock.json`, and `pnpm-lock.yaml` enough for local checks.
- Flag new dependencies, broad ranges, git/url specs, install scripts, missing license fields, and large dependency churn.
- Compare against a baseline snapshot.
- Emit text, JSON, and Markdown reports.
- Provide `snapshot`, `scan`, `diff`, and `report` commands.

## Non-Goals

- CVE lookup.
- Malware detection.
- Replacing `npm audit` or Socket/Snyk-style services.

## CLI

```bash
depscreen snapshot --output depscreen.lock.json
depscreen scan --root .
depscreen diff baseline.json current.json
depscreen report depscreen.json --output DEPENDENCIES.md
```

## Acceptance Criteria

- No network calls.
- Fixture-backed tests cover npm and pnpm examples.
- Exits non-zero on high-risk findings with `--fail-on high`.
- README explains that heuristics are review prompts, not proof of safety.
