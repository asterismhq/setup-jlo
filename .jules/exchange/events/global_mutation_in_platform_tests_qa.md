---
label: "tests"
created_at: "2024-05-24"
author_role: "qa"
confidence: "high"
---

## Problem

The test file `tests/domain/platform.test.ts` mutates global `process` properties (`process.platform` and `process.arch`) during tests without complete isolation guarantees across async/parallel executions.

## Goal

Ensure isolated testing without mutating global state. Use dependency injection to pass the `platform` and `arch` as parameters to `detectPlatformTuple`, or use a dedicated mocking strategy that completely isolates the environment per test execution.

## Context

Modifying global state in tests is a known anti-pattern ("Isolation By Design: avoid shared mutable state"). While `beforeEach` and `afterEach` try to clean it up, this can still cause non-determinism and flakiness if tests run in parallel or if a test fails unexpectedly and doesn't reach the teardown phase correctly in certain testing frameworks.

## Evidence

- path: "tests/domain/platform.test.ts"
  loc: "line 26"
  note: "The `mockProcess` function explicitly redefines `process.platform` and `process.arch` properties."

## Change Scope

- `src/domain/platform.ts`
- `tests/domain/platform.test.ts`
