---
label: "refacts"
---

## Goal

Improve boundary type integrity by implementing robust validation for external inputs (GitHub API responses) and add test coverage to ensure unexpected data structures are correctly rejected.

## Current State

The GitHub API responses use type predicates with excessive `unknown` casting and loose type checks, leaving them vulnerable to unexpected API payload changes. The current type predicates are prone to maintenance drift and fail to thoroughly validate arrays or specific properties. Additionally, there are coverage gaps where unexpected API structures (like non-objects or unexpectedly typed primitives) are not correctly tested.
- `src/adapters/github/github-git-http-username.ts`: Manual type predicate `isGitHubUser` casts to `Record<string, unknown>` and checks properties loosely.
- `src/adapters/github/release-asset-api.ts`: Manual type predicate `isReleaseMetadata` casts to `Record<string, unknown>` and iterates arrays with loose runtime checks.

## Plan

1. Update `isGitHubUser` type predicate in `src/adapters/github/github-git-http-username.ts` to replace `Record<string, unknown>` casting with safer property checks (e.g. checking `in` operator after verifying object type).
2. Update `isReleaseMetadata` type predicate in `src/adapters/github/release-asset-api.ts` to replace `Record<string, unknown>` casting with safer checks using `typeof` and `in` operator. Ensure each element in the array is safely typed and correctly checked.
3. Add missing test coverage in `tests/adapters/github/github-git-http-username.test.ts` to verify that `resolveGitHubHttpUsername` handles invalid types and unexpected payload formats correctly.
4. Add missing test coverage in `tests/adapters/github/release-asset-api.test.ts` to verify that `fetchReleaseAsset` handles invalid types and unexpected array properties correctly.

## Acceptance Criteria

- Ensure all payloads validate properly with accurate constraints.
- Unexpected strings, types, or missing parameters fail type validation in a controlled manner.
- Line coverage on type assertion paths is brought up to 100%.

## Risks

- Stricter validation might break in case GitHub API payload contains unexpected properties or null values if not carefully tested. Testing across various edge cases mitigates this.