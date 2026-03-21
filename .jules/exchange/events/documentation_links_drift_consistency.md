---
label: "docs"
created_at: "2024-05-24"
author_role: "consistency"
confidence: "high"
---

## Problem

`README.md` bypasses `docs/README.md` as the sole index for documentation by linking directly to `docs/usage.md` and `docs/architecture.md`.

## Goal

Ensure `README.md` treats `docs/README.md` as the single authoritative index for documentation, routing all documentation references through it rather than linking to individual subpages directly.

## Context

The repository memory explicitly states: "The documentation structure requires `./README.md` as the public front door, `./CONTRIBUTING.md` for workflows, and `docs/README.md` as the sole index for `docs/`." Currently, `README.md` links to `docs/usage.md` and `docs/architecture.md` directly. While these paths are technically correct, this violates the principle of `docs/README.md` being the sole index. If users go directly to the subpages from `README.md`, the index is bypassed.

## Evidence

- path: "README.md"
  loc: "19-20"
  note: "Links directly to `[docs/usage.md](docs/usage.md)`."

- path: "README.md"
  loc: "25-26"
  note: "Links directly to `[docs/architecture.md](docs/architecture.md)`."

- path: "README.md"
  loc: "31-32"
  note: "Links to `[docs/README.md](docs/README.md)` only for Configuration."

## Change Scope

- `README.md`
