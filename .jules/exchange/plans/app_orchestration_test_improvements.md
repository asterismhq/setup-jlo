---
label: "tests"
---

## Goal

Refactor `install-main-source.test.ts` and `install-release.test.ts` to assert observable state changes and external boundaries instead of over-coupling to internal mock calls, and ensure robust coverage for core flows like cache hits/misses and error conditions.

## Current State

Application orchestration tests over-couple to adapter mock internals rather than focusing on external outcomes. Crucial error paths lack test coverage.
- `tests/app/install-main-source.test.ts`: Employs massive mocking of internal adapters and asserts on their internal dependency arguments.
- `tests/app/install-release.test.ts`: Heavily mocks internal dependencies and tightly binds assertions to internal adapter calls.
- `src/app/install-main-source.ts`: Lacks test coverage for error paths when submodule tokens are missing or when git submodule updates fail.
- `src/app/install-release.ts`: Lacks test coverage for error branches handling empty download sizes and temporary directory cleanup logic on failures.

## Plan

1. Refactor `tests/app/install-release.test.ts` to assert externally observable boundaries (e.g., emitted logs, file system mutations, or specific errors thrown) rather than specific arguments passed to internal mocks.
2. Add test cases to `tests/app/install-release.test.ts` to cover error conditions: an explicit error thrown when a downloaded release asset is missing or empty, and verification that the temporary directory is properly cleaned up upon failure.
3. Refactor `tests/app/install-main-source.test.ts` to assert observable outcomes instead of tight coupling to internal adapter arguments.
4. Add test cases to `tests/app/install-main-source.test.ts` to verify error paths: exceptions correctly thrown when `installSubmoduleToken` is absent, and when the git submodule update process fails.

## Acceptance Criteria

- Mocks in orchestration tests are simplified and decoupled from internal implementation details.
- `tests/app/install-release.test.ts` includes coverage for empty download sizes and temp directory cleanup error branches.
- `tests/app/install-main-source.test.ts` includes coverage for missing submodule tokens and git submodule update failures.
- Tests assert externally observable behavior at the owning boundary.

## Risks

- Decoupling tests from internal mocks might initially reduce coverage of specific internal code paths if not replaced with sufficient outcome-based tests.
- Broadening the scope of tests to external outcomes might make tests more brittle if the system's observable boundaries are not well-defined.