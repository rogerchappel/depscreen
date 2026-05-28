# Local-First Safety Notes

`depscreen` is designed for local review before package publication.

## Guarantees

- Core snapshot, scan, diff, and report commands do not call the network.
- The CLI reads project files and writes only when `--output` is provided.
- JSON outputs are structured for archival and reproducible review.

## Limits

- Findings are heuristics.
- A clean report does not prove a dependency is safe.
- Lockfile metadata can be incomplete or stale.
- The tool does not perform CVE, malware, provenance, or maintainer reputation
  lookups.

## Recommended Use

- Run it before reviewing agent-generated dependency changes.
- Pair it with lockfile review and ecosystem scanners.
- Treat high findings as blockers until a maintainer has explicitly reviewed
  and accepted the risk.
