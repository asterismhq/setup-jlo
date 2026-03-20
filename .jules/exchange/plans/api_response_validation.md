---
label: "bugs"
---

## Goal

Validate untrusted external JSON data at the boundary using a schema validator or type guards before allowing it into the typed core of the application, replacing unsafe `as Type` assertions. Encode invariants at boundaries to rule out invalid states explicitly.

## Current State

External HTTP JSON responses are blindly trusted and cast with `as Type`, circumventing the TypeScript type system's ability to guarantee runtime safety.

- `src/adapters/github/release-asset-api.ts`: Parses the response using `await metadataResponse.json()` and immediately casts to `{ assets?: Array<{ id: number; name: string }> }` without any runtime validation. This trusts the external payload structure blindly.
- `src/adapters/github/github-git-http-username.ts`: Parses the response using `await response.json()` and immediately casts to `{ login?: string; type?: string }` without any runtime validation. This uses unsafe type assertions over explicit validation logic.

## Plan

1. In `src/adapters/github/release-asset-api.ts`, add a lightweight type guard or validation function to verify the structure of `metadataResponse.json()` at runtime before casting or returning. It should verify that if `assets` exists, it is an array containing objects with `id` (number) and `name` (string) properties. Rejections of invalid payloads must throw an explicit error identifying the missing or invalid fields.
2. In `src/adapters/github/github-git-http-username.ts`, add a lightweight type guard or validation function to verify the structure of `response.json()` at runtime. It should verify that `login` is a string (if present) and `type` is a string (if present). Rejections of invalid payloads must throw an explicit error identifying the missing or invalid fields.
3. Update tests for both files to ensure these new validation errors are caught and surfaced correctly when invalid JSON structures are returned by the API.

## Acceptance Criteria

- `src/adapters/github/release-asset-api.ts` validates the structure of `metadataResponse.json()` at runtime before casting or returning.
- `src/adapters/github/github-git-http-username.ts` validates the structure of `response.json()` at runtime.
- Invalid structures are rejected gracefully and bubble up explicit errors rather than breaking silently downstream.
- Schema validation logic is implemented manually or with an appropriate type guard/lightweight validation utility, without introducing heavy new dependencies unless necessary.

## Risks

- Validation errors might be too generic and not provide actionable information. The validation mechanism should throw explicit, detailed error messages.
- The new validation logic might inadvertently reject valid responses from GitHub APIs if the expected schema changes or our understanding of it is incomplete. It's crucial to match the expected schema precisely.
