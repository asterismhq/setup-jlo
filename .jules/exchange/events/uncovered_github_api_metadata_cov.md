---
label: "tests"
created_at: "2024-05-20"
author_role: "cov"
confidence: "high"
---

## Problem

Coverage gaps in GitHub API validation utilities mask edge-case vulnerabilities where the API returns unexpected data structures, specifically non-objects or unexpectedly typed primitives.

## Goal

Add tests to ensure `isGitHubUser` and `isReleaseMetadata` correctly reject unexpected payloads (like strings instead of objects or mis-typed properties).

## Context

Lines 8-9 and 18-19 in `src/adapters/github/github-git-http-username.ts` (`typeof data !== 'object' || data === null` and `typeof obj.type !== 'string'`) and lines 7-8, 13-14, 20-21 in `src/adapters/github/release-asset-api.ts` indicate missing coverage for type guard checks when external APIs return wildly unexpected formats. If the GitHub API changes or returns an unexpected response, it might cause type casting errors downstream instead of being cleanly rejected by these utilities.

## Evidence

- path: "src/adapters/github/github-git-http-username.ts"
  loc: "8-9, 18-19"
  note: "Branches handling `data === null`, `typeof data !== 'object'`, and `typeof obj.type !== 'string'` are untested."
- path: "src/adapters/github/release-asset-api.ts"
  loc: "7-8, 13-14, 20-21"
  note: "Branches handling unexpected non-object payloads, undefined `assets`, or array elements that are not objects are not tested."

## Change Scope

- `src/adapters/github/github-git-http-username.ts`
- `src/adapters/github/release-asset-api.ts`
- `tests/adapters/github/github-git-http-username.test.ts`
- `tests/adapters/github/release-asset-api.test.ts`
