---
label: "bugs"
implementation_ready: false
---

## Goal

Properly handle `unknown` errors in `catch` blocks by checking if the caught object is an instance of `Error` before accessing its properties, instead of blindly casting it with `as Error`.

## Context

Consolidated context from source events.

## Problem

Errors caught in `catch` blocks are unsafely coerced using `as Error`, ignoring the fact that JavaScript can throw any value (e.g., strings, null, undefined). If a string or a plain object is thrown, accessing `.message` on it will result in `undefined` or runtime crashes.

## Evidence

- source_event: "unsafe_error_coercion_typescripter.md"
  path: "src/app/install-main-source.ts"
  loc: "line 72"
  note: "Inside the `catch` block for `updateGitHubSubmodules`, the error is formatted into a string by calling `(error as Error).message` without verifying if `error` actually has a `message` property."

## Change Scope

- `src/app/install-main-source.ts`

## Constraints

- Must check `error instanceof Error` before accessing properties.
- Non-Error objects thrown must be serialized appropriately (e.g., using `String(error)` or similar).

## Acceptance Criteria

- `src/app/install-main-source.ts` no longer blindly casts `(error as Error).message`.
- Fallbacks correctly handle cases where the thrown error is not an `Error` object.
