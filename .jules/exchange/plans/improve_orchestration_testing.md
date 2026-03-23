---
label: "tests"
---

## Goal

Improve application orchestration testing by shifting verification to externally observable outcomes and owning boundaries, establishing coverage for the primary orchestrator (`src/index.ts`), and ensuring critical workflow paths are fully covered.

## Current State

- `src/index.ts`: Acts as the primary orchestrator mapping inputs to execution flows. It is completely uncovered, leaving input interpretation, request routing, and error handling untested.
- `src/app/install-main-source.ts`: Owns the main source installation workflow. Missing test coverage for dependency validation errors when `cargo` or `git` are unavailable.
- `src/app/install-release.ts`: Owns the release installation workflow. Missing test coverage for the successful completion boundary of a newly downloaded release version (extraction, path installation).
- `tests/app/install-main-source.test.ts`: Over-coupled tests mocking 18 internal dependencies (e.g., standard library `fs` and `os` functions), verifying internal mechanics rather than externally observable outcomes.
- `tests/app/install-release.test.ts`: Over-coupled tests mocking 17 internal dependencies, brittle to refactoring and failing to verify the component boundary.

## Plan

1. Create a workflow-level test suite for the primary orchestrator at `tests/index.test.ts`. This suite will define the owning boundary for input resolution and routing by mocking only the immediate boundary adapters (`installMainSource`, `installReleaseVersion`, inputs/outputs) to verify correct delegation and error catching without running the full installation pipelines.
2. Refactor `tests/app/install-main-source.test.ts` to verify externally observable outcomes. Replace extensive internal mocks of file system operations (`node:fs`, `node:os`) with real deterministic temporary directories. Add boundary tests asserting errors are thrown when `cargo` or `git` dependencies are missing.
3. Refactor `tests/app/install-release.test.ts` to verify externally observable outcomes. Replace file system mocks with deterministic real temporary directories. Add tests to cover the successful new download path, verifying that the binary is written, made executable, and installed on the PATH.
4. Update `tests/app/install-main-source.test.ts` and `tests/app/install-release.test.ts` to manage fixture data and temporary directories deterministically, ensuring that filesystem state is properly isolated and cleaned up per test.

## Acceptance Criteria

- `src/index.ts` is covered by tests verifying input mapping, correct invocation of `installMainSource` or `installReleaseVersion`, and top-level error capture.
- `tests/app/install-main-source.test.ts` asserts errors are correctly thrown when `cargo` and `git` commands are missing.
- `tests/app/install-release.test.ts` fully covers the successful completion path of a newly downloaded release version.
- Both orchestration test suites execute file system interactions via real, deterministic temporary directories rather than mocking internal `fs` methods.

## Risks

- State leakage across test runs if deterministic temporary directory cleanup fails during teardown.
- Flakiness in tests if external tool assumptions (e.g., test runner path) interact unpredictably with real filesystem usage.
