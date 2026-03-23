---
label: "refacts"
implementation_ready: true
---

## Goal

Consolidate all semantic version extraction and string parsing logic into a single domain location (`version-token.ts`), rather than leaving a pseudo-parsing utility inside an adapter.

## Problem

The logic for extracting semantic versions from unstructured string output is duplicated across domain (`src/domain/version-token.ts`) and adapter (`src/adapters/cache/binary-install-cache.ts`) layers. The `binary-install-cache` maintains a local `extractFirstSemverTriplet` function that calls the domain `extractSemver` internally, violating the "Single Source of Truth" and leaking domain parsing responsibilities into an adapter.

## Context

The `binary-install-cache.ts` acts as an adapter, but it includes domain-level logic to extract versions by splitting strings (`extractFirstSemverTriplet`). This violates "Single Source of Truth" and the principle of separation of concerns, as the caching adapter is taking on the responsibility of identifying a valid version string format.

## Evidence

- source_event: "duplicate_version_parsing_data_arch.md"
  path: "src/domain/version-token.ts"
  loc: "line 15-21"
  note: "`extractSemver` performs string normalization and regex matching to detect a semver core."

- source_event: "duplicate_version_parsing_data_arch.md"
  path: "src/adapters/cache/binary-install-cache.ts"
  loc: "line 84-92"
  note: "`extractFirstSemverTriplet` loops over string tokens and uses `extractSemver` to find the first valid version, an action that belongs in the domain boundary rather than an adapter."

## Change Scope

- `src/domain/version-token.ts`
- `src/adapters/cache/binary-install-cache.ts`

## Constraints

- Version extraction logic (e.g. splitting text to find valid version patterns) must solely reside in the domain layer.

## Acceptance Criteria

- `extractFirstSemverTriplet` or its equivalent is moved entirely to `src/domain/version-token.ts` and correctly exported.
- `binary-install-cache.ts` solely depends on the domain export to extract versions from text output.
