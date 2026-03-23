---
label: "tests"
implementation_ready: false
---

## Goal

Improve application orchestration testing by reducing excessive mocking, adding coverage for uncovered primary orchestrators, and ensuring critical happy paths and dependency checks are fully covered.

## Problem

Orchestration tests are over-coupled to implementation details (mocking up to 18 dependencies), making them brittle. Concurrently, critical paths are completely untested: the main entry point (`src/index.ts`) has 0% coverage, dependency checks for `cargo` and `git` are uncovered, and the happy path for finalizing a newly downloaded release version is missed. This creates a high risk of undetected regressions in core action workflows.

## Context

The `src/index.ts` file acts as the primary orchestrator for the setup action, routing requests between release and main source builds. Being completely untested poses a high regression risk for the end-user action flow. Within those specific workflows, `installMainSource` expects `cargo` and `git` to be available but misses testing for their error boundaries, while `installReleaseVersion` misses coverage for the critical lines that finalize a successful new download. Concurrently, the existing tests mock a large number of `node:fs`, `node:os`, and adapter functions, coupling tests tightly to internal implementation details, breaking easily on minor refactors, and inflating maintenance overhead.

## Evidence

- source_event: "action_entry_point_uncovered_cov.md"
  path: "src/index.ts"
  loc: "1-48"
  note: "The entirety of the file is uncovered, leaving the primary routing and error handling untested."

- source_event: "install_main_dependency_checks_uncovered_cov.md"
  path: "src/app/install-main-source.ts"
  loc: "28-31"
  note: "The check for `cargo` and its associated thrown error are uncovered."

- source_event: "install_main_dependency_checks_uncovered_cov.md"
  path: "src/app/install-main-source.ts"
  loc: "33-34"
  note: "The check for `git` and its associated thrown error are uncovered."

- source_event: "install_release_happy_path_uncovered_cov.md"
  path: "src/app/install-release.ts"
  loc: "76-79"
  note: "The final steps of the `installReleaseVersion` function (`pruneSiblingInstallDirectories`, `installBinaryOnPath`, and logging) are completely uncovered."

- source_event: "over_coupled_orchestration_tests_qa.md"
  path: "tests/app/install-main-source.test.ts"
  loc: "line 4"
  note: "Mocks 18 internal dependencies including standard library functions (`existsSync`, `mkdtempSync`) and custom adapters (`cloneGitHubBranch`, `detectPlatformTuple`, etc.)"

- source_event: "over_coupled_orchestration_tests_qa.md"
  path: "tests/app/install-release.test.ts"
  loc: "line 4"
  note: "Mocks 17 internal dependencies, heavily coupling the test to the implementation details instead of testing external behavior."

## Change Scope

- `src/index.ts`
- `tests/index.test.ts`
- `src/app/install-main-source.ts`
- `tests/app/install-main-source.test.ts`
- `src/app/install-release.ts`
- `tests/app/install-release.test.ts`

## Constraints

- Refactored tests must reduce the number of internal implementation mocks.
- Tests should validate externally visible behavior using fakes or by observing side effects (I/O, network, process execution).

## Acceptance Criteria

- `src/index.ts` is covered by tests that verify inputs interpretation, request routing, and error handling.
- Dependency checks for `cargo` and `git` in `installMainSource` are covered by tests.
- The happy path for completing `installReleaseVersion` (new download, extraction, path installation) is fully covered.
- Orchestration tests (`install-main-source.test.ts` and `install-release.test.ts`) use significantly fewer mocks and rely more on observable behaviors and fakes.
