---
label: "tests"
created_at: "2023-10-25"
author_role: "qa"
confidence: "high"
---

## Problem

Test files for adapter modules are misplaced in the root `tests/adapters/` directory instead of their respective domain-specific subdirectories (e.g., `tests/adapters/github/`), resulting in duplicated test coverage and architectural misalignment.

## Goal

Consolidate the duplicated test files and move the misplaced adapter tests to their correct subdirectories to ensure clear ownership and avoid redundancy.

## Context

The codebase groups tests by boundary (`tests/adapters/cache`, `tests/adapters/github`, `tests/adapters/process`). However, some tests like `github-git-http-username.test.ts` and `release-asset-api.test.ts` exist in the root of `tests/adapters/`. Specifically, `release-asset-api.test.ts` exists both in the root and in the `github/` subdirectory, leading to redundancy. This violates the principle of single specific responsibilities and clear boundary mapping.

## Evidence

- path: "tests/adapters/release-asset-api.test.ts"
  loc: "Entire file"
  note: "This file tests `src/adapters/github/release-asset-api.ts` but is placed in the root of `tests/adapters/`. It is also redundant with `tests/adapters/github/release-asset-api.test.ts`."

- path: "tests/adapters/github-git-http-username.test.ts"
  loc: "Entire file"
  note: "This file tests `src/adapters/github/github-git-http-username.ts` but is missing from the `github/` test directory."

## Change Scope

- `tests/adapters/release-asset-api.test.ts`
- `tests/adapters/github-git-http-username.test.ts`
- `tests/adapters/github/release-asset-api.test.ts`
