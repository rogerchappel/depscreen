#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

node dist/src/cli.js snapshot --root tests/fixtures/npm-risky --output "$tmp_dir/snapshot.json"
node dist/src/cli.js scan --root tests/fixtures/npm-risky --format json --output "$tmp_dir/scan.json"
node dist/src/cli.js report "$tmp_dir/scan.json" --format markdown --output "$tmp_dir/DEPENDENCIES.md"

if node dist/src/cli.js scan --root tests/fixtures/npm-risky --fail-on high >"$tmp_dir/fail-on.txt"; then
  echo "Expected fail-on high to return non-zero" >&2
  exit 1
fi

grep -q '"lockfile"' "$tmp_dir/snapshot.json"
grep -q '"findings"' "$tmp_dir/scan.json"
grep -q 'Dependency Review' "$tmp_dir/DEPENDENCIES.md"
grep -q 'depscreen scan' "$tmp_dir/fail-on.txt"

printf 'Smoke passed: snapshot, scan, report, and fail-on high flow completed.\n'
