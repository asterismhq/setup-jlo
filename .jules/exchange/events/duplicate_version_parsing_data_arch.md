---
label: "refacts"
created_at: "2024-03-23"
author_role: "data_arch"
confidence: "high"
---

## Problem

The logic for extracting semantic versions from string output is duplicated across `src/domain/version-token.ts` and `src/adapters/cache/binary-install-cache.ts`. The `binary-install-cache` has its own local `extractFirstSemverTriplet` function that calls `extractSemver` internally.

## Goal

Unify the extraction and parsing of semver strings under the domain logic (`version-token.ts`), rather than leaving a pseudo-parsing utility inside the caching adapter.

## Context

The `binary-install-cache.ts` acts as an adapter, but it includes domain-level logic to extract versions by splitting strings (`extractFirstSemverTriplet`). This violates "Single Source of Truth", as the caching adapter is taking on the responsibility of identifying a valid version string format.

## Evidence

- path: "src/domain/version-token.ts"
  loc: "line 15-21"
  note: "`extractSemver` performs string normalization and regex matching to detect a semver core."

- path: "src/adapters/cache/binary-install-cache.ts"
  loc: "line 84-92"
  note: "`extractFirstSemverTriplet` loops over string tokens and uses `extractSemver` to find the first valid version, an action that belongs in the domain boundary rather than an adapter."

## Change Scope

- `src/domain/version-token.ts`
- `src/adapters/cache/binary-install-cache.ts`
