#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

node dist/src/cli.js snapshot --root tests/fixtures/npm-risky --output "$tmp_dir/snapshot.json"
node dist/src/cli.js scan --root tests/fixtures/npm-risky --format markdown --output "$tmp_dir/report.md"
node dist/src/cli.js diff "$tmp_dir/snapshot.json" "$tmp_dir/snapshot.json" --format text --output "$tmp_dir/diff.txt"
node dist/src/cli.js report "$tmp_dir/report.md" >/dev/null 2>&1 && {
  echo "Expected report command to reject non-JSON input" >&2
  exit 1
}

grep -q "depscreen report" "$tmp_dir/report.md"
grep -q "package churn: 0" "$tmp_dir/diff.txt"
