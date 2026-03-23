---
label: "tests"
implementation_ready: false
---

## Goal

Refactor the binary cache adapter tests to use a real temporary filesystem instead of globally mocking `node:fs`, ensuring robust validation of cache structures and behaviors.

## Problem

The cache adapter tests are heavily mocked, stubbing all of `node:fs` globally using `vi.mock('node:fs')`. This tightly couples the tests to specific system path calls and avoids true integration testing of the filesystem state (e.g., file creation, directory permissions, pruning). Such global mocking can result in tests that falsely pass despite subtle API mismatches in filesystem usage.

## Context

Mocking `node:fs` globally can lead to tests that pass but fail in reality due to subtle API mismatches. Using actual temporary directories (like `node:os` tempdir) and `fs` operations allows validating the correct creation, deletion, and permission assignments of files.

## Evidence

- source_event: "brittle_cache_adapter_tests_qa.md"
  path: "tests/adapters/cache/binary-install-cache.test.ts"
  loc: "line 15"
  note: "Uses `vi.mock('node:fs')` which mocks all filesystem operations, missing real integration bugs."

## Change Scope

- `tests/adapters/cache/binary-install-cache.test.ts`

## Constraints

- Only boundaries representing external command execution (like `spawnSync`) may continue to be mocked.
- Tests must use an actual temporary directory created and tore down around test cases for verifying cache state.

## Acceptance Criteria

- The cache adapter tests are completely free of `vi.mock('node:fs')` and successfully manipulate actual files and folders inside an isolated temporary directory.
