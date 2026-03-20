---
label: "refacts"
created_at: "2024-03-20"
author_role: "data_arch"
confidence: "high"
---

## Problem

Duplicate semver parsing logic across different modules. Both `src/domain/version-token.ts` and `src/adapters/cache/binary-install-cache.ts` implement custom regex-based semver parsing logic to extract version strings without the 'v' prefix.

## Goal

Centralize semver parsing logic into a single Source of Truth (SSOT) domain module to eliminate duplicate definitions and ensure consistent version validation and parsing behavior.

## Context

The repository has multiple places where version strings are extracted and normalized (removing 'v' prefix and matching against standard `\d+\.\d+\.\d+` format). This violates the "Single Source of Truth" first principle of data architecture where each concept should have one canonical representation and owner.

## Evidence

- path: "src/domain/version-token.ts"
  loc: "5-17"
  note: "Defines `SEMVER_PATTERN = /^\\d+\\.\\d+\\.\\d+$/` and implements `semverCore = normalized.replace(/^v/, '')` followed by pattern test."
- path: "src/adapters/cache/binary-install-cache.ts"
  loc: "110-117"
  note: "Implements `extractFirstSemverTriplet` with identical logic: `normalized = token.replace(/^v/, '')` and `/^\\d+\\.\\d+\\.\\d+$/.test(normalized)`."

## Change Scope

- `src/domain/version-token.ts`
- `src/adapters/cache/binary-install-cache.ts`
