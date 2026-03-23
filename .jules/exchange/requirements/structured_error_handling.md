---
label: "refacts"
implementation_ready: false
---

## Goal

Model failure semantics using explicit discriminated union types or a `Result` wrapper at system boundaries and eliminate the practice of blindly coercing `unknown` errors, ensuring robust error handling without losing context or stack traces.

## Problem

The application currently relies on throwing unstructured errors, which makes failure modes invisible to the TypeScript type checker and forces the use of broad `try...catch` blocks that swallow meaningful domain errors. Concurrently, existing `catch` blocks blindly coerce `unknown` errors into `Error` instances or cast them to generic strings, masking deeper issues, swallowing non-error exceptions, and hiding valuable metadata such as stack traces.

## Context

Throwing errors makes the failure mode of the API implicit and invisible to TypeScript's type checker. This forces callers to either assume success or wrap everything in generic `try...catch` blocks that swallow structured domain failures. In robust TypeScript layers, especially async ones like HTTP or subprocess execution, the failure is a known possible outcome, not an exception. Modeling this state explicitly using discriminated unions aligns with making invalid states unrepresentable and enforces exhaustive handling of failures at compile time.

Catching exceptions typed as `unknown` and applying an `instanceof Error` check, then falling back to `String(error)`, is an anti-pattern. While it makes the compiler happy by narrowing `unknown`, it routinely loses valuable error metadata (such as non-error objects thrown) and hides underlying bugs when a custom error class fails to format as expected. A more robust state modeling for failures avoids this entirely, but even within a `catch` boundary, error context must be reliably converted without fallback swallowing.

## Evidence

- source_event: "failure_semantics_typescripter.md"
  path: "src/adapters/github/release-asset-api.ts"
  loc: "44-55"
  note: "`fetchReleaseAsset` relies exclusively on `throw new Error(...)` for expected HTTP failures like 401, 403, and 404, hiding the failure type from the caller."

- source_event: "failure_semantics_typescripter.md"
  path: "src/adapters/process/github-source-git.ts"
  loc: "124-127"
  note: "`runGitHubCommand` relies on `throw new Error(...)` to signal a failed subprocess execution instead of returning a typed success/failure struct."

- source_event: "failure_semantics_typescripter.md"
  path: "src/adapters/github/github-git-http-username.ts"
  loc: "40-49"
  note: "`resolveGitHubHttpUsername` masks expected HTTP failures behind generic thrown errors, preventing callers from reasoning about the failure in type-safe code."

- source_event: "error_coercion_typescripter.md"
  path: "src/index.ts"
  loc: "41-47"
  note: "The top-level `run().catch((error: unknown) => ...)` coerces the error directly via `instanceof Error` or falls back to a cast `String(error)`, losing details about the failure."

- source_event: "error_coercion_typescripter.md"
  path: "src/app/install-main-source.ts"
  loc: "67-69"
  note: "The `try...catch` block around `updateGitHubSubmodules` interpolates an unknown `error` with a generic fallback `error instanceof Error ? error.message : String(error)`, masking deeper errors with a generic string cast."

## Change Scope

- `src/index.ts`
- `src/app/install-main-source.ts`
- `src/adapters/github/release-asset-api.ts`
- `src/adapters/process/github-source-git.ts`
- `src/adapters/github/github-git-http-username.ts`

## Constraints

- Expected errors must be explicitly represented in function signatures using discriminated unions (e.g., `{ success: true, data: T } | { success: false, error: DomainError }`) rather than implicit `throw`.
- Any required `catch` boundary must properly preserve and surface original error objects or properly validate their shape without string fallback swallowing.

## Acceptance Criteria

- `fetchReleaseAsset`, `runGitHubCommand`, and `resolveGitHubHttpUsername` return structured success/failure representations instead of throwing generic errors.
- `index.ts` and `install-main-source.ts` handle exceptions rigorously without dropping metadata or falling back generically to `String(error)`.
