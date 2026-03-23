---
label: "refacts"
implementation_ready: false
---

## Goal

Introduce structural schema validation at API boundaries to securely parse and type unstructured JSON payloads instead of relying on manual object inspection and casts.

## Problem

Manual JSON validation of external API responses leads to type illusion and brittle runtime assertions. Receiving `unknown` data from `fetch(...).json()` and attempting to validate it with custom `typeof data === 'object'` checks and `as Record<string, unknown>` casts provides a false sense of security. It is verbose, error-prone, hard to maintain, and scales poorly when external schemas inevitably change.

## Context

TypeScript types erase at runtime. When receiving unstructured data from `fetch(...).json()`, treating the result as `unknown` and then attempting to validate it with custom `typeof data === 'object'` checks and `as Record<string, unknown>` type casts provides a false sense of security. Manual validation logic is error-prone, hard to maintain, and scales poorly as external schemas change. A dedicated parsing library ensures the data structurally matches the expected type before it enters the application core, adhering to the principle "parse, don't validate."

## Evidence

- source_event: "github_api_json_validation_typescripter.md"
  path: "src/adapters/github/release-asset-api.ts"
  loc: "4-27"
  note: "`isReleaseMetadata` uses manual object inspection and `as Record<string, unknown>` to validate complex JSON payloads, which is brittle and verbose."

- source_event: "github_api_json_validation_typescripter.md"
  path: "src/adapters/github/github-git-http-username.ts"
  loc: "4-23"
  note: "`isGitHubUser` relies on manual type narrowing and `as Record<string, unknown>` for JSON payloads from the GitHub API."

## Change Scope

- `src/adapters/github/release-asset-api.ts`
- `src/adapters/github/github-git-http-username.ts`

## Constraints

- Structural validation must be implemented using a dedicated validation library (e.g., Zod, TypeBox, or Valibot) and placed directly at the network boundary.
- Invalid responses must be caught at parsing rather than deeper in the application logic.

## Acceptance Criteria

- `isReleaseMetadata` and `isGitHubUser` use a robust schema validation library to enforce type safety and reject invalid payloads.
- Manual type casting (e.g., `as Record<string, unknown>`) is completely eliminated from external API responses.
