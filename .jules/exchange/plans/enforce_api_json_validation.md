---
label: "refacts"
---

## Goal

Introduce structural schema validation using `zod` at the GitHub API boundaries (`src/adapters/github/`) to securely parse and type unstructured JSON payloads, replacing error-prone manual object inspection and casts.

## Current State

Currently, the application relies on manual object inspection and custom type guard functions with explicit type casting to validate complex API JSON payloads. This approach provides a false sense of security and is brittle, verbose, and difficult to maintain as external schemas evolve.

- `src/adapters/github/release-asset-api.ts`: Uses `isReleaseMetadata` with manual type checking and `as Record<string, unknown>` to validate release metadata JSON from the GitHub API.
- `src/adapters/github/github-git-http-username.ts`: Uses `isGitHubUser` relying on manual type narrowing and `as Record<string, unknown>` to validate user JSON payloads from the GitHub API.

## Plan

1. Install `zod` as a production dependency using `npm install zod`.
2. Update `src/adapters/github/release-asset-api.ts`:
   - Import `zod`.
   - Define a `zod` schema `ReleaseMetadataSchema` corresponding to the expected structure (`{ assets?: Array<{ id: number; name: string }> }`).
   - Remove the `isReleaseMetadata` function.
   - Refactor `fetchReleaseAsset` to use `ReleaseMetadataSchema.safeParse` to validate `rawMetadata` instead of the manual check, throwing a structured error upon failure.
3. Update `src/adapters/github/github-git-http-username.ts`:
   - Import `zod`.
   - Define a `zod` schema `GitHubUserSchema` corresponding to the expected structure (`{ login?: string; type?: string }`).
   - Remove the `isGitHubUser` function.
   - Refactor `resolveGitHubHttpUsername` to use `GitHubUserSchema.safeParse` to validate `rawUser` instead of the manual check, throwing a structured error upon failure.
4. Update associated unit tests:
   - Update `tests/adapters/github/release-asset-api.test.ts` to ensure the validation errors align with the new `zod` schema parsing behavior if error messages differ or to maintain current testing assertions.
   - Update `tests/adapters/github-git-http-username.test.ts` to ensure the validation errors align with the new `zod` schema parsing behavior if error messages differ or to maintain current testing assertions.

## Acceptance Criteria

- `zod` schemas are defined for external JSON boundaries in `src/adapters/github/release-asset-api.ts` and `src/adapters/github/github-git-http-username.ts`.
- `fetchReleaseAsset` and `resolveGitHubHttpUsername` use `zod` schemas for validation, effectively replacing custom validation functions.
- Manual type casting (e.g., `as Record<string, unknown>`) is completely eliminated from external API responses in these two files.
- Existing tests pass, or are updated to reflect exact error message changes if necessary while maintaining the same behavior coverage.
- Application logic rejects invalid payloads accurately at the parsing stage.

## Risks

- Integrating `zod` may alter the exact error message thrown upon validation failure, potentially causing existing tests asserting exact string matching on validation errors to fail, requiring careful test updates.
- If `zod` schemas are too restrictive, valid but unexpected (e.g., undocumented) fields might cause parsing failures. The schemas should be permissive enough (using `.passthrough()` or ignoring unknown keys by default as zod does) to allow structural validation of required fields without breaking on extraneous data.
