---
label: "tests"
implementation_ready: false
---

## Goal

Refactor `install-main-source.test.ts` and `install-release.test.ts` to assert observable state changes/boundaries instead of over-coupling to internal mock calls, and ensure robust coverage for core flows like cache hits/misses and error conditions.

## Context

Consolidated context from source events.

## Problem

Application orchestration tests over-couple to adapter mock internals (e.g. tracking specific `toHaveBeenCalledWith` arguments across multiple internal dependencies). In addition, crucial execution paths within `install-release.ts` and `install-main-source.ts` lack coverage, especially around error conditions (e.g. missing submodule tokens, temp dir cleanup, download sizes).

## Evidence

- source_event: "app_install_cov.md"
  path: "src/app/install-release.ts"
  loc: "lines 48-59, 67-81"
  note: "Uncovered error branches regarding empty download sizes, and temp dir cleanup logic on failures."

- source_event: "app_install_cov.md"
  path: "src/app/install-main-source.ts"
  loc: "lines 30-33, 93-96"
  note: "Uncovered error paths for when submodule tokens are absent, or when git submodule updates fail."

- source_event: "test_granularity_app_orchestration_qa.md"
  path: "tests/app/install-main-source.test.ts"
  loc: "lines 8-46, 75-92"
  note: "Massive mocking of adapters and assertions tightly bound to internal dependency arguments."

- source_event: "test_granularity_app_orchestration_qa.md"
  path: "tests/app/install-release.test.ts"
  loc: "lines 4-31, 56-65"
  note: "Similar heavy mocking and strict assertion on internal adapter calls."

## Change Scope

- `src/app/install-release.ts`
- `tests/app/install-release.test.ts`
- `src/app/install-main-source.ts`
- `tests/app/install-main-source.test.ts`

## Constraints

- Do not test the implementation details (e.g., exactly which internal adapter function is called) but focus on the external outcomes (e.g., the correct final output or explicit errors).
- Preserve the existing test frameworks and styles used in the project.

## Acceptance Criteria

- Mocking in orchestration tests is simplified and decoupled from internal calls.
- `install-release.ts` handles uncovered error branches (empty downloads, temp dir cleanup) and these paths are tested.
- `install-main-source.ts` handles uncovered error paths (missing tokens, git update failures) and these paths are tested.
