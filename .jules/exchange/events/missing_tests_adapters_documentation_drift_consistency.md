---
label: "docs"
created_at: "2024-03-20"
author_role: "consistency"
confidence: "high"
---

## Problem

The documentation in `docs/architecture.md` incorrectly omits the `tests/adapters` directory from its list of repository-owned boundary tests, despite the implementation containing a `tests/adapters` directory with tests.

## Goal

Update the documentation to accurately reflect the current testing boundaries, including `tests/adapters`.

## Context

`docs/architecture.md` outlines the test directories as `tests/action`, `tests/app`, and `tests/domain`. However, a `tests/adapters` directory exists in the codebase and contains boundary tests (e.g., `tests/adapters/github-git-http-username.test.ts`). The documentation should serve as a source of truth for the codebase's current structure.

## Evidence

- path: "docs/architecture.md"
  loc: "12, 80"
  note: "Mentions `tests/` contains boundary tests under `tests/action`, `tests/app`, and `tests/domain`, omitting `tests/adapters`."

- path: "tests/adapters"
  loc: "directory"
  note: "Directory exists and contains tests such as `github-git-http-username.test.ts`."

## Change Scope

- `docs/architecture.md`
