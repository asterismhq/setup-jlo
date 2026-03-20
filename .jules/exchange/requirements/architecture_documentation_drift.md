---
label: "docs"
implementation_ready: false
---

## Goal

Update the documentation in `docs/architecture.md` to accurately reflect the actual import relationships between the runtime boundaries and outline the correct test boundaries.

## Context

Consolidated context from source events.

## Problem

The documentation in `docs/architecture.md` incorrectly documents the dependency direction (`action -> domain` instead of `app -> action`) and incorrectly omits the `tests/adapters` directory from its list of repository-owned boundary tests.

## Evidence

- source_event: "dependency_direction_drift_consistency.md"
  path: "docs/architecture.md"
  loc: "line 32"
  note: "Documents `action -> domain`, which is incorrect based on `src/action` imports."

- source_event: "dependency_direction_drift_consistency.md"
  path: "src/action"
  loc: "directory"
  note: "Files inside `src/action/` do not import anything from `src/domain/`."

- source_event: "dependency_direction_drift_consistency.md"
  path: "src/app/install-main-source.ts"
  loc: "line 4"
  note: "Imports `InstallRequest` from `../action/install-request.ts`, which indicates an `app -> action` dependency."

- source_event: "dependency_direction_drift_consistency.md"
  path: "src/app/install-release.ts"
  loc: "line 8"
  note: "Imports `InstallRequest` from `../action/install-request.ts`, supporting the `app -> action` dependency."

- source_event: "missing_tests_adapters_documentation_drift_consistency.md"
  path: "docs/architecture.md"
  loc: "lines 12, 80"
  note: "Mentions `tests/` contains boundary tests under `tests/action`, `tests/app`, and `tests/domain`, omitting `tests/adapters`."

- source_event: "missing_tests_adapters_documentation_drift_consistency.md"
  path: "tests/adapters"
  loc: "directory"
  note: "Directory exists and contains tests such as `github-git-http-username.test.ts`."

## Change Scope

- `docs/architecture.md`

## Constraints

- Modifications must be purely declarative.
- Avoid changelog-style language.

## Acceptance Criteria

- `docs/architecture.md` lists the dependency directions matching the actual import graph (e.g. `app -> action` rather than `action -> domain`).
- `docs/architecture.md` documents `tests/adapters` as a recognized directory for tests boundary tests.
