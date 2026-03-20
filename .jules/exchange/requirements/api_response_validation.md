---
label: "bugs"
implementation_ready: false
---

## Goal

Validate untrusted external JSON data at the boundary using a schema validator (like Zod) or type guards before allowing it into the typed core of the application, replacing unsafe `as Type` assertions. Encode invariants at boundaries to rule out invalid states explicitly.

## Context

Consolidated context from source events.

## Problem

External HTTP JSON responses are blindly trusted and cast with `as Type`, circumventing the TypeScript type system's ability to guarantee runtime safety. This uses loose type assertions instead of explicit schema validation for incoming JSON data from external APIs. It shifts the burden of validation to implicit runtime failure instead of creating an explicit parsing boundary where invalid data is caught and modeled as an error.

## Evidence

- source_event: "unvalidated_http_json_typescripter.md"
  path: "src/adapters/github/release-asset-api.ts"
  loc: "line 36"
  note: "The response from `https://api.github.com/...` is parsed using `await metadataResponse.json()` and immediately cast without any runtime validation."

- source_event: "unvalidated_http_json_typescripter.md"
  path: "src/adapters/github/github-git-http-username.ts"
  loc: "line 29"
  note: "The response from `GITHUB_API_USER_URL` is parsed using `await response.json()` and immediately cast without any runtime validation."

- source_event: "missing_api_response_validation_data_arch.md"
  path: "src/adapters/github/release-asset-api.ts"
  loc: "line 37"
  note: "`const metadata = (await metadataResponse.json()) as {...}` blindly trusts the external payload structure."

- source_event: "missing_api_response_validation_data_arch.md"
  path: "src/adapters/github/github-git-http-username.ts"
  loc: "line 32"
  note: "`const user = (await response.json()) as {...}` uses unsafe type assertions over explicit validation logic."

## Change Scope

- `src/adapters/github/release-asset-api.ts`
- `src/adapters/github/github-git-http-username.ts`

## Constraints

- Schema validation logic must be implemented manually or with an appropriate type guard/lightweight validation utility, without introducing heavy new dependencies unless necessary.
- Rejections of invalid payloads must throw informative error messages identifying the missing or invalid fields.

## Acceptance Criteria

- `src/adapters/github/release-asset-api.ts` validates the structure of `metadataResponse.json()` at runtime before casting or returning.
- `src/adapters/github/github-git-http-username.ts` validates the structure of `response.json()` at runtime.
- Invalid structures are rejected gracefully and bubble up explicit errors rather than breaking silently downstream.
