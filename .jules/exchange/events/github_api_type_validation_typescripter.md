---
label: "refacts"
created_at: "2024-05-24"
author_role: "typescripter"
confidence: "high"
---

## Problem

The GitHub API responses in `github-git-http-username.ts` and `release-asset-api.ts` use type predicates with excessive `unknown` casting and loose type checks, creating an illusion of safety while remaining vulnerable to unexpected API payload changes. The `isGitHubUser` and `isReleaseMetadata` functions use type casting and manual property checks instead of a robust validation schema.

## Goal

Improve boundary type integrity by using robust validation for external inputs (GitHub API responses) before trusting them in the typed core, avoiding manual `as Record<string, unknown>` casting and loose checks.

## Context

The first principle of the Typescripter role states: "Types erase at runtime: validate external inputs before trusting types". The current implementation reads untrusted JSON from external APIs and attempts to validate it using manual assertions that are prone to maintenance drift and fail to deeply validate arrays or specific properties thoroughly.

## Evidence

- path: "src/adapters/github/github-git-http-username.ts"
  loc: "4-22"
  note: "Manual type predicate `isGitHubUser` casts to `Record<string, unknown>` and checks properties loosely."
- path: "src/adapters/github/release-asset-api.ts"
  loc: "3-24"
  note: "Manual type predicate `isReleaseMetadata` casts to `Record<string, unknown>` and iterates arrays with loose runtime checks."

## Change Scope

- `src/adapters/github/github-git-http-username.ts`
- `src/adapters/github/release-asset-api.ts`
