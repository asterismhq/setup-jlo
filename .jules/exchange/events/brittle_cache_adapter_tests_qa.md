---
label: "tests"
created_at: "2024-05-24"
author_role: "qa"
confidence: "medium"
---

## Problem

The cache adapter tests mock `node:fs` and `node:child_process` heavily to verify cache directory structures and binary version output, tightly coupling to system paths and spawn signatures.

## Goal

To test caching behavior effectively without high maintenance cost, we should use an in-memory or actual temporary filesystem for testing the cache adapter. Mocks should only be used for strict process execution boundaries (`spawnSync` of the binary) rather than all generic filesystem operations.

## Context

Mocking `node:fs` globally can lead to tests that pass but fail in reality due to subtle API mismatches. Using actual temporary directories (like `node:os` tempdir) and `fs` operations allows validating the correct creation, deletion, and permission assignments of files.

## Evidence

- path: "tests/adapters/cache/binary-install-cache.test.ts"
  loc: "line 15"
  note: "Uses `vi.mock('node:fs')` which mocks all filesystem operations, missing real integration bugs."

## Change Scope

- `tests/adapters/cache/binary-install-cache.test.ts`
