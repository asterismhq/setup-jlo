---
label: "tests"
created_at: "2024-03-20"
author_role: "qa"
confidence: "high"
---

## Problem

Missing tests for key adapters containing I/O side effects (`binary-install-cache.ts`, `cargo-build.ts`, `github-source-git.ts`, `release-asset-api.ts`).

## Goal

Add isolated unit tests for the adapters handling filesystem operations, process spawning, and network I/O to ensure boundary behavior is verified.

## Context

The `tests/adapters` directory only contains a test for `github-git-http-username.ts`. Other adapters like `binary-install-cache.ts` (filesystem/process), `cargo-build.ts` (process), `github-source-git.ts` (process), and `release-asset-api.ts` (network) are completely untested. This leaves the system vulnerable to regressions in side-effect boundaries and prevents fast feedback during development.

## Evidence

- path: "tests/adapters"
  loc: "directory contents"
  note: "Only `github-git-http-username.test.ts` exists. Tests for other adapters are missing."
- path: "src/adapters/cache/binary-install-cache.ts"
  loc: "entire file"
  note: "Contains extensive filesystem operations (fs module) and process spawning (child_process module) without unit tests."
- path: "src/adapters/process/cargo-build.ts"
  loc: "entire file"
  note: "Spawns child processes using `spawnSync` without unit tests."
- path: "src/adapters/process/github-source-git.ts"
  loc: "entire file"
  note: "Spawns child processes using `spawnSync` without unit tests."
- path: "src/adapters/github/release-asset-api.ts"
  loc: "entire file"
  note: "Performs network requests using `fetch` without unit tests."

## Change Scope

- `tests/adapters/cache/binary-install-cache.test.ts`
- `tests/adapters/process/cargo-build.test.ts`
- `tests/adapters/process/github-source-git.test.ts`
- `tests/adapters/github/release-asset-api.test.ts`
