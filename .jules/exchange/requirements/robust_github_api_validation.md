---
label: "refacts"
implementation_ready: false
---

## Goal

Improve boundary type integrity by implementing robust validation for external inputs (GitHub API responses) and add test coverage to ensure unexpected data structures are correctly rejected.

## Problem

The GitHub API responses use type predicates with excessive `unknown` casting and loose type checks, leaving them vulnerable to unexpected API payload changes. The current type predicates are prone to maintenance drift and fail to thoroughly validate arrays or specific properties. Additionally, there are coverage gaps where unexpected API structures (like non-objects or unexpectedly typed primitives) are not correctly tested.

## Evidence

- source_event: "github_api_type_validation_typescripter.md"
  path: "src/adapters/github/github-git-http-username.ts"
  loc: "4-22"
  note: "Manual type predicate `isGitHubUser` casts to `Record<string, unknown>` and checks properties loosely."
- source_event: "github_api_type_validation_typescripter.md"
  path: "src/adapters/github/release-asset-api.ts"
  loc: "3-24"
  note: "Manual type predicate `isReleaseMetadata` casts to `Record<string, unknown>` and iterates arrays with loose runtime checks."
- source_event: "uncovered_github_api_metadata_cov.md"
  path: "src/adapters/github/github-git-http-username.ts"
  loc: "8-9, 18-19"
  note: "Branches handling `data === null`, `typeof data !== 'object'`, and `typeof obj.type !== 'string'` are untested."
- source_event: "uncovered_github_api_metadata_cov.md"
  path: "src/adapters/github/release-asset-api.ts"
  loc: "7-8, 13-14, 20-21"
  note: "Branches handling unexpected non-object payloads, undefined `assets`, or array elements that are not objects are not tested."

## Change Scope

- `src/adapters/github/github-git-http-username.ts`
- `src/adapters/github/release-asset-api.ts`
- `tests/adapters/github/github-git-http-username.test.ts`
- `tests/adapters/github/release-asset-api.test.ts`

## Constraints

- Replace manual generic `as Record<string, unknown>` type casting with safer checks.

## Acceptance Criteria

- Ensure all payloads validate properly with accurate constraints.
- Unexpected strings, types, or missing parameters fail type validation in a controlled manner.
- Line coverage on type assertion paths is brought up to 100%.
