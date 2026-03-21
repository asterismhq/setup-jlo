---
label: "tests"
created_at: "2023-10-25"
author_role: "qa"
confidence: "high"
---

## Problem

Orchestration tests in the `app` boundary are over-coupled to private implementation details and internal function calls via heavy mocking, rather than validating externally visible behavior.

## Goal

Refactor the `app` tests to validate observable outcomes (like filesystem changes or process execution) rather than asserting on internal function spy calls.

## Context

The guiding principles state: "Behavior Over Internals: validate externally visible behavior, not implementation details" and "Tests assert externally observable behavior at the owning boundary, never duplicated knowledge of internal implementation". Currently, `install-main-source.test.ts` mocks almost every internal function and asserts on whether functions like `updateGitHubSubmodules` or `buildCargoRelease` were called, which makes refactoring brittle and fails to test the actual orchestration outcome.

## Evidence

- path: "tests/app/install-main-source.test.ts"
  loc: "line 84, line 98"
  note: "Asserts on internal function calls like `updateGitHubSubmodules.not.toHaveBeenCalled()` and `buildCargoRelease.not.toHaveBeenCalled()` instead of observable behavior."

- path: "tests/app/install-release.test.ts"
  loc: "line 87"
  note: "Asserts on `fetchReleaseAsset.not.toHaveBeenCalled()` which is an internal implementation detail of the adapter layer."

## Change Scope

- `tests/app/install-main-source.test.ts`
- `tests/app/install-release.test.ts`
