---
label: "tests"
---

## Goal

Refactor the binary cache adapter tests to use a real temporary filesystem instead of globally mocking `node:fs`, ensuring robust validation of cache structures and behaviors.

## Current State

The cache adapter tests are heavily mocked, stubbing all of `node:fs` globally. This tightly couples the tests to specific system path calls and avoids true integration testing of the filesystem state.
- `tests/adapters/cache/binary-install-cache.test.ts`: Uses `vi.mock('node:fs')` which globally mocks all filesystem operations, missing real integration bugs and potentially causing tests to pass despite subtle API mismatches in filesystem usage.

## Plan

1. Remove `vi.mock('node:fs')` from `tests/adapters/cache/binary-install-cache.test.ts`.
2. Update the test suite to use a real temporary directory (e.g., via `node:fs` `mkdtempSync` and `node:os` `tmpdir()`) created before test cases and torn down after.
3. Update tests to verify actual filesystem outcomes (e.g., verifying directories and files are created, verifying correct permissions) instead of asserting on mocked `node:fs` function calls.
4. Continue to mock external boundaries such as `node:child_process` and `@actions/core` to prevent unintended side effects and external command execution.

## Acceptance Criteria

- `tests/adapters/cache/binary-install-cache.test.ts` is completely free of `vi.mock('node:fs')`.
- Tests successfully manipulate actual files and folders inside an isolated temporary directory.
- The state of the filesystem (e.g., file creation, permissions, pruning) is correctly asserted in tests.
- Execution boundaries like `node:child_process` and `@actions/core` remain mocked.

## Risks

- Flaky tests if the temporary directory is not properly isolated or cleaned up between runs.
- Cross-platform differences in filesystem behaviors (e.g., permissions on Windows vs Linux/macOS) could cause tests to fail on specific environments if not handled carefully.
