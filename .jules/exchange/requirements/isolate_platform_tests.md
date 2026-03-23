---
label: "tests"
implementation_ready: true
---

## Goal

Refactor the platform detection logic and its tests to eliminate global mutation of the `process` object.

## Problem

The domain platform tests mutate global variables `process.platform` and `process.arch` to test various OS combinations. Although attempting cleanup via `beforeEach`/`afterEach`, this global mutation is an anti-pattern that creates brittle, non-deterministic test suites, especially when executed in parallel or when tests fail midway and miss teardown hooks.

## Context

Modifying global state in tests is a known anti-pattern ("Isolation By Design: avoid shared mutable state"). While `beforeEach` and `afterEach` try to clean it up, this can still cause non-determinism and flakiness if tests run in parallel or if a test fails unexpectedly and doesn't reach the teardown phase correctly in certain testing frameworks.

## Evidence

- source_event: "global_mutation_in_platform_tests_qa.md"
  path: "tests/domain/platform.test.ts"
  loc: "line 26"
  note: "The `mockProcess` function explicitly redefines `process.platform` and `process.arch` properties."

## Change Scope

- `src/domain/platform.ts`
- `tests/domain/platform.test.ts`

## Constraints

- Refactor `detectPlatformTuple` to accept platform dependencies as explicit parameters (e.g., dependency injection) rather than directly reading globals, or utilize an officially supported framework feature (like `vi.stubEnv`) that guarantees thread-safe/isolated overrides.

## Acceptance Criteria

- All manual overrides to `Object.defineProperty(process, ...)` are removed from `platform.test.ts`.
- The tests run deterministically without modifying the global node process state for sibling tests.
