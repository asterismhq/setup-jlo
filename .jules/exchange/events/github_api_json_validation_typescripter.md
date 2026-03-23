---
label: "refacts"
created_at: "2024-03-01"
author_role: "typescripter"
confidence: "high"
---

## Problem

Manual, weak JSON validation at external boundaries leads to type illusion and brittle runtime assertions.

## Goal

Introduce structural validation (e.g., using Zod, TypeBox, or Valibot) at API boundaries to parse `unknown` JSON payloads securely, making invalid states unrepresentable instead of relying on manual object inspection and casts.

## Context

TypeScript types erase at runtime. When receiving unstructured data from `fetch(...).json()`, treating the result as `unknown` and then attempting to validate it with custom `typeof data === 'object'` checks and `as Record<string, unknown>` type casts provides a false sense of security. Manual validation logic is error-prone, hard to maintain, and scales poorly as external schemas change. A dedicated parsing library ensures the data structurally matches the expected type before it enters the application core, adhering to the principle "parse, don't validate."

## Evidence

- path: "src/adapters/github/release-asset-api.ts"
  loc: "4-27"
  note: "`isReleaseMetadata` uses manual object inspection and `as Record<string, unknown>` to validate complex JSON payloads, which is brittle and verbose."
- path: "src/adapters/github/github-git-http-username.ts"
  loc: "4-23"
  note: "`isGitHubUser` relies on manual type narrowing and `as Record<string, unknown>` for JSON payloads from the GitHub API."

## Change Scope

- `src/adapters/github/release-asset-api.ts`
- `src/adapters/github/github-git-http-username.ts`
