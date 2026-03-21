---
label: "tests"
created_at: "2023-10-25"
author_role: "qa"
confidence: "high"
---

## Problem

Tests for process execution adapters use highly brittle mocks of `child_process.spawnSync`, asserting against exact array arguments and internal configurations rather than validating the pure logic around the boundaries.

## Goal

Reduce the coupling to `spawnSync` arguments in tests by either testing the observable side effects or extracting the command construction logic into pure functions that can be tested independently of the Node.js process API.

## Context

Testing process execution by mocking `spawnSync` and asserting on the exact argument array (e.g., `['build', '--release', '--manifest-path', '/src/Cargo.toml']`) is an anti-pattern. It ties the test to the implementation detail of how the command string is formed. If the CLI options change order or new options are added, the test breaks even if the observable behavior remains correct, violating the principle: "Behavior Over Internals: validate externally visible behavior, not implementation details".

## Evidence

- path: "tests/adapters/process/cargo-build.test.ts"
  loc: "line 45-53"
  note: "Asserts on exact internal arguments of `childProcess.spawnSync` like `['build', '--release', '--manifest-path', '/src/Cargo.toml']`."

- path: "tests/adapters/process/github-source-git.test.ts"
  loc: "line 65-76"
  note: "Asserts on exact internal arguments of `childProcess.spawnSync` like `['clone', '--quiet', '--depth=1', '--branch', 'main', '--', ...]`."

## Change Scope

- `tests/adapters/process/cargo-build.test.ts`
- `tests/adapters/process/github-source-git.test.ts`
