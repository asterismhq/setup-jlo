---
label: "docs"
implementation_ready: true
---

## Goal

Ensure `README.md` treats `docs/README.md` as the single authoritative index for documentation, routing all documentation references through it rather than linking to individual subpages directly.

## Problem

`README.md` bypasses `docs/README.md` as the sole index for documentation by linking directly to `docs/usage.md` and `docs/architecture.md`. While these paths are technically correct, this violates the principle of `docs/README.md` being the sole index. If users go directly to the subpages from `README.md`, the index is bypassed.

## Evidence

- source_event: "documentation_links_drift_consistency.md"
  path: "README.md"
  loc: "19-20"
  note: "Links directly to `[docs/usage.md](docs/usage.md)`."
- source_event: "documentation_links_drift_consistency.md"
  path: "README.md"
  loc: "25-26"
  note: "Links directly to `[docs/architecture.md](docs/architecture.md)`."
- source_event: "documentation_links_drift_consistency.md"
  path: "README.md"
  loc: "31-32"
  note: "Links to `[docs/README.md](docs/README.md)` only for Configuration."

## Change Scope

- `README.md`

## Constraints

- No subpage documentation links may exist inside `README.md`.

## Acceptance Criteria

- All external routing into `docs/*` routes exactly once through `docs/README.md`.
