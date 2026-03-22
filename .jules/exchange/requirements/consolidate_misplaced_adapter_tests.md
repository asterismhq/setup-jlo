---
label: "tests"
implementation_ready: false
---

## Goal

Consolidate duplicated test files and move the misplaced adapter tests to their correct subdirectories to ensure clear ownership and avoid redundancy.

## Problem

Test files for adapter modules are misplaced in the root `tests/adapters/` directory instead of their respective domain-specific subdirectories (e.g., `tests/adapters/github/`), resulting in duplicated test coverage and architectural misalignment. Specifically, `release-asset-api.test.ts` exists both in the root and in the `github/` subdirectory, leading to redundancy.

## Evidence

- source_event: "misplaced_and_redundant_adapter_tests_qa.md"
  path: "tests/adapters/release-asset-api.test.ts"
  loc: "Entire file"
  note: "This file tests `src/adapters/github/release-asset-api.ts` but is placed in the root of `tests/adapters/`. It is also redundant with `tests/adapters/github/release-asset-api.test.ts`."
- source_event: "misplaced_and_redundant_adapter_tests_qa.md"
  path: "tests/adapters/github-git-http-username.test.ts"
  loc: "Entire file"
  note: "This file tests `src/adapters/github/github-git-http-username.ts` but is missing from the `github/` test directory."
- source_event: "misplaced_and_redundant_adapter_tests_qa.md"
  path: "tests/adapters/github/release-asset-api.test.ts"
  loc: "Entire file"
  note: "This file tests `src/adapters/github/release-asset-api.ts`."

## Change Scope

- `tests/adapters/release-asset-api.test.ts`
- `tests/adapters/github-git-http-username.test.ts`
- `tests/adapters/github/release-asset-api.test.ts`

## Constraints

- Ensure the consolidated tests retain the union of all valid assertions without failing any boundaries.

## Acceptance Criteria

- All GitHub adapter tests reside exclusively in the `tests/adapters/github/` directory.
- Duplicated files are deleted.
- Total test pass count remains stable or validly increases without regression.
