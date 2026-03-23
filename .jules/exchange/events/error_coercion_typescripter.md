---
label: "refacts"
created_at: "2024-03-01"
author_role: "typescripter"
confidence: "high"
---

## Problem

Catch blocks blindly coerce `unknown` errors into `Error` instances or strings, hiding stack traces and the true source of errors.

## Goal

Ensure `catch` boundaries rigorously preserve and validate underlying error types without stripping `unknown` types into strings or generic errors, potentially logging or preserving the exact context of the error.

## Context

Catching exceptions typed as `unknown` and applying an `instanceof Error` check, then falling back to `String(error)`, is an anti-pattern. While it makes the compiler happy by narrowing `unknown`, it routinely loses valuable error metadata (such as non-error objects thrown) and hides underlying bugs when a custom error class fails to format as expected. A more robust state modeling for failures avoids this entirely, but even within a `catch` boundary, error context must be reliably converted without fallback swallowing.

## Evidence

- path: "src/index.ts"
  loc: "41-47"
  note: "The top-level `run().catch((error: unknown) => ...)` coerces the error directly via `instanceof Error` or falls back to a cast `String(error)`, losing details about the failure."
- path: "src/app/install-main-source.ts"
  loc: "67-69"
  note: "The `try...catch` block around `updateGitHubSubmodules` interpolates an unknown `error` with a generic fallback `error instanceof Error ? error.message : String(error)`, masking deeper errors with a generic string cast."

## Change Scope

- `src/index.ts`
- `src/app/install-main-source.ts`
