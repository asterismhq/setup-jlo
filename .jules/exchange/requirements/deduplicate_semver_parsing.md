---
label: "refacts"
implementation_ready: false
---

## Goal

Centralize semver parsing logic into a single Source of Truth (SSOT) domain module to eliminate duplicate definitions and ensure consistent version validation and parsing behavior.

## Context

Consolidated context from source events.

## Problem

Duplicate semver parsing logic exists across different modules. Both `src/domain/version-token.ts` and `src/adapters/cache/binary-install-cache.ts` implement custom regex-based semver parsing logic to extract version strings without the 'v' prefix.

## Evidence

- source_event: "duplicate_semver_parsing_data_arch.md"
  path: "src/domain/version-token.ts"
  loc: "lines 5-17"
  note: "Defines `SEMVER_PATTERN = /^\\d+\\.\\d+\\.\\d+$/` and implements `semverCore = normalized.replace(/^v/, '')` followed by pattern test."

- source_event: "duplicate_semver_parsing_data_arch.md"
  path: "src/adapters/cache/binary-install-cache.ts"
  loc: "lines 110-117"
  note: "Implements `extractFirstSemverTriplet` with identical logic: `normalized = token.replace(/^v/, '')` and `/^\\d+\\.\\d+\\.\\d+$/.test(normalized)`."

## Change Scope

- `src/domain/version-token.ts`
- `src/adapters/cache/binary-install-cache.ts`

## Constraints

- The unified logic must reside in a domain module (likely `src/domain/version-token.ts` or a new domain file).
- The adapters must import and use this domain function instead of repeating the regex matching.

## Acceptance Criteria

- `src/adapters/cache/binary-install-cache.ts` no longer defines its own regex or string replacement for extracting semver strings.
- A single canonical semver parsing function is exported from the domain layer and used consistently.
