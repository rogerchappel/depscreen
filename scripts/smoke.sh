#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

npm run build >/dev/null
node dist/src/cli.js --help >/dev/null
node dist/src/cli.js scan tests/fixtures/clean --format json >/dev/null
node dist/src/cli.js scan tests/fixtures/risky --fail-on high >/tmp/depscreen-smoke.txt && {
  printf 'Expected risky fixture to fail with --fail-on high.\n' >&2
  exit 1
}

grep -q "Dependency uses latest tag" /tmp/depscreen-smoke.txt
