---
label: "refacts"
---

## Goal

Centralize semver parsing logic into a single Source of Truth (SSOT) domain module to eliminate duplicate definitions and ensure consistent version validation and parsing behavior.

## Current State

Duplicate semver parsing logic exists across different modules, duplicating domain knowledge and leading to potential inconsistencies.
- `src/domain/version-token.ts`: Defines `SEMVER_PATTERN = /^\d+\.\d+\.\d+$/` and implements `semverCore = normalized.replace(/^v/, '')` followed by pattern test. It tightly couples this generic semver extraction with parsing the action input.
- `src/adapters/cache/binary-install-cache.ts`: Implements `extractFirstSemverTriplet` with identical logic: `normalized = token.replace(/^v/, '')` and `/^\d+\.\d+\.\d+$/.test(normalized)` to extract versions from CLI output.
- `tests/domain/version-token.test.ts`: Only tests `parseVersionToken`. Needs an explicit test for `extractSemver` once extracted.
- `README.md` and `docs/`: Currently do not document this internal utility, and no documentation updates are needed as this does not change the external interface or vocabulary.

## Plan

1. Extract a new function `extractSemver(token: string): string | undefined` in `src/domain/version-token.ts` that applies the `v` prefix stripping and `SEMVER_PATTERN` validation to return a valid semver core string, or `undefined` if invalid.
2. Refactor `parseVersionToken` in `src/domain/version-token.ts` to utilize the new `extractSemver` function.
3. Refactor `extractFirstSemverTriplet` in `src/adapters/cache/binary-install-cache.ts` to import and iterate over tokens using the domain's `extractSemver` function instead of redefining regex and extraction logic.
4. Update `tests/domain/version-token.test.ts` to explicitly test the `extractSemver` function.

## Acceptance Criteria

- `src/adapters/cache/binary-install-cache.ts` no longer defines its own regex or string replacement for extracting semver strings.
- A single canonical semver parsing function is exported from the domain layer (`src/domain/version-token.ts`) and used consistently.
- All existing externally observable behaviors in cache retrieval and version parsing remain intact.

## Risks

- The extraction logic used in `binary-install-cache.ts` processes a stream of space-separated strings, whereas `version-token.ts` processes a single expected token with `.trim()`. If `extractSemver` does not handle inputs exactly as both call sites expect, version validation or cache hits could fail.
