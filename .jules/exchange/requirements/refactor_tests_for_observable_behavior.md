---
label: "tests"
implementation_ready: false
---

## Goal

Refactor the orchestration tests in the `app` boundary and adapter process execution tests to validate externally visible behavior (like filesystem changes or process execution side effects) rather than asserting on internal function spy calls and exact internal configurations.

## Problem

Orchestration tests in the `app` boundary are over-coupled to private implementation details and internal function calls via heavy mocking. Tests for process execution adapters use highly brittle mocks of `child_process.spawnSync`, asserting against exact array arguments and internal configurations. This makes refactoring brittle and fails to test the actual orchestration outcome.

## Evidence

- source_event: "app_tests_coupled_to_internals_qa.md"
  path: "tests/app/install-main-source.test.ts"
  loc: "line 84, line 98"
  note: "Asserts on internal function calls like `updateGitHubSubmodules.not.toHaveBeenCalled()` and `buildCargoRelease.not.toHaveBeenCalled()` instead of observable behavior."
- source_event: "app_tests_coupled_to_internals_qa.md"
  path: "tests/app/install-release.test.ts"
  loc: "line 87"
  note: "Asserts on `fetchReleaseAsset.not.toHaveBeenCalled()` which is an internal implementation detail of the adapter layer."
- source_event: "brittle_process_spawnsync_mocks_qa.md"
  path: "tests/adapters/process/cargo-build.test.ts"
  loc: "line 45-53"
  note: "Asserts on exact internal arguments of `childProcess.spawnSync` like `['build', '--release', '--manifest-path', '/src/Cargo.toml']`."
- source_event: "brittle_process_spawnsync_mocks_qa.md"
  path: "tests/adapters/process/github-source-git.test.ts"
  loc: "line 65-76"
  note: "Asserts on exact internal arguments of `childProcess.spawnSync` like `['clone', '--quiet', '--depth=1', '--branch', 'main', '--', ...]`."

## Change Scope

- `tests/app/install-main-source.test.ts`
- `tests/app/install-release.test.ts`
- `tests/adapters/process/cargo-build.test.ts`
- `tests/adapters/process/github-source-git.test.ts`

## Constraints

- Do not use brittle `spawnSync` array argument exact matches.
- Tests must assert on externally observable outcomes or use pure function extraction for argument construction.

## Acceptance Criteria

- Mocking is reduced and primarily applied at external system boundaries (network, filesystem).
- The tests are more resilient to internal refactoring.
