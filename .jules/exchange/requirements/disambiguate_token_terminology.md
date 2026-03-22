---
label: "refacts"
implementation_ready: false
---

## Goal

Disambiguate the term `token` across the codebase, ensuring `token` strictly means an authentication token, and use a term like `version` or `ref` for installation targets to avoid semantic overlap.

## Problem

The term `token` is overloaded. It is used both for GitHub API authentication tokens and as a generic string segment or version string variable (`versionToken`). For instance, the `ParsedVersionToken` type has a variant `{ kind: 'main'; token: 'main' }` which reuses the word `token` for a completely different concept than authentication.

## Evidence

- source_event: "version_token_semantic_overload_data_arch.md"
  path: "src/domain/version-token.ts"
  loc: "line 3"
  note: "Defines the 'main' variant as `{ kind: 'main'; token: 'main' }` instead of `{ kind: 'main'; version: 'main' }` or similar, overloading the term 'token'."
- source_event: "token_overloading_taxonomy.md"
  path: "src/domain/version-token.ts"
  loc: "7"
  note: "`extractSemver(token: string)` uses `token` for a generic version string segment."
- source_event: "token_overloading_taxonomy.md"
  path: "src/adapters/cache/binary-install-cache.ts"
  loc: "90"
  note: "`for (const token of value.split(/\\s+/))` uses `token` as a generic string segment rather than a GitHub authentication token."
- source_event: "version_token_semantic_overload_data_arch.md"
  path: "src/action/install-request.ts"
  loc: "line 5, 13, 40"
  note: "Uses 'token' and 'submoduleToken' for GitHub authentication credentials."

## Change Scope

- `src/domain/version-token.ts`
- `src/adapters/cache/binary-install-cache.ts`
- `src/index.ts`

## Constraints

- Ensure any semantic updates do not change functionality or introduce breaking typing.

## Acceptance Criteria

- All instances of `token` in the codebase specifically refer to authentication or access tokens.
- Renamed variables maintain semantic coherence in their localized context.
