---
label: "tests"
implementation_ready: false
---

## Goal

Add isolated unit tests for the adapters handling filesystem operations, process spawning, and network I/O, ensuring that failure modes (e.g., 401/403 errors, non-OK statuses) are adequately tested.

## Context

Consolidated context from source events.

## Problem

Key adapters containing I/O side effects (`binary-install-cache.ts`, `cargo-build.ts`, `github-source-git.ts`, `release-asset-api.ts`) are completely untested. Additionally, the existing tests for `github-git-http-username.ts` fail to cover critical error paths (e.g. 401, 403, and JSON parsing failures).

## Evidence

- source_event: "test_structure_missing_adapters_qa.md"
  path: "tests/adapters"
  loc: "directory contents"
  note: "Only `github-git-http-username.test.ts` exists. Tests for other I/O adapters are missing."

- source_event: "test_structure_missing_adapters_qa.md"
  path: "src/adapters/cache/binary-install-cache.ts"
  loc: "entire file"
  note: "Extensive filesystem operations and process spawning without unit tests."

- source_event: "test_structure_missing_adapters_qa.md"
  path: "src/adapters/process/cargo-build.ts"
  loc: "entire file"
  note: "Spawns child processes using `spawnSync` without unit tests."

- source_event: "test_structure_missing_adapters_qa.md"
  path: "src/adapters/process/github-source-git.ts"
  loc: "entire file"
  note: "Spawns child processes using `spawnSync` without unit tests."

- source_event: "test_structure_missing_adapters_qa.md"
  path: "src/adapters/github/release-asset-api.ts"
  loc: "entire file"
  note: "Performs network requests using `fetch` without unit tests."

- source_event: "github_git_http_username_cov.md"
  path: "src/adapters/github/github-git-http-username.ts"
  loc: "lines 21-24, 27-30, 41-44"
  note: "Uncovered error blocks for 401/403 responses, non-ok HTTP statuses, and missing login fields."

## Change Scope

- `tests/adapters/cache/binary-install-cache.test.ts`
- `tests/adapters/process/cargo-build.test.ts`
- `tests/adapters/process/github-source-git.test.ts`
- `tests/adapters/github/release-asset-api.test.ts`
- `src/adapters/github/github-git-http-username.ts`
- `tests/adapters/github-git-http-username.test.ts`

## Constraints

- Use appropriate mocking for filesystem and process modules (`fs`, `child_process`) in adapter tests to avoid actual I/O.
- Ensure error behaviors bubble up correctly when mocked network calls fail.

## Acceptance Criteria

- Unit tests exist for `binary-install-cache.ts`, `cargo-build.ts`, `github-source-git.ts`, and `release-asset-api.ts`.
- `github-git-http-username.test.ts` validates handling of 401/403 errors, non-ok statuses, and invalid JSON structures.
