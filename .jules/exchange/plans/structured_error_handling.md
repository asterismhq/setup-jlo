---
label: "refacts"
---

## Goal

Model failure semantics using explicit discriminated union types or a `Result` wrapper at system boundaries and eliminate the practice of blindly coercing `unknown` errors, ensuring robust error handling without losing context or stack traces.

## Current State

The application currently relies on throwing unstructured errors, forcing the use of broad `try...catch` blocks that swallow meaningful domain errors. Concurrently, existing `catch` blocks blindly coerce `unknown` errors into `Error` instances or cast them to generic strings, masking deeper issues, swallowing non-error exceptions, and hiding valuable metadata such as stack traces.
- `src/adapters/github/release-asset-api.ts`: `fetchReleaseAsset` relies exclusively on `throw new Error(...)` for expected HTTP failures like 401, 403, and 404, hiding the failure type from the caller.
- `src/adapters/process/github-source-git.ts`: `runGitHubCommand` relies on `throw new Error(...)` to signal a failed subprocess execution instead of returning a typed success/failure struct. Callers like `cloneGitHubBranch`, `resolveGitWorktreeHeadSha`, and `updateGitHubSubmodules` don't return results.
- `src/adapters/github/github-git-http-username.ts`: `resolveGitHubHttpUsername` masks expected HTTP failures behind generic thrown errors, preventing callers from reasoning about the failure in type-safe code.
- `src/app/install-main-source.ts`: The `try...catch` block around `updateGitHubSubmodules` interpolates an unknown `error` with a generic fallback `error instanceof Error ? error.message : String(error)`, masking deeper errors with a generic string cast.
- `src/index.ts`: The top-level `run().catch((error: unknown) => ...)` coerces the error directly via `instanceof Error` or falls back to a cast `String(error)`, losing details about the failure.

## Plan

1. Create `src/domain/result.ts` defining a generic discriminated union type `Result<T, E = Error>` with `{ ok: true, value: T }` and `{ ok: false, error: E }` representations.
2. Refactor `src/adapters/github/release-asset-api.ts` so `fetchReleaseAsset` returns `Promise<Result<{ name: string; contents: Buffer }>>` instead of throwing errors. Update `src/app/install-release.ts` to unwrap the `Result` and propagate the error.
3. Refactor `src/adapters/process/github-source-git.ts` so `runGitHubCommand` returns `Result<string>`. Update its exported dependent functions (`cloneGitHubBranch`, `resolveGitWorktreeHeadSha`, `updateGitHubSubmodules`) to also return `Result` types.
4. Refactor `src/adapters/github/github-git-http-username.ts` so `resolveGitHubHttpUsername` returns `Promise<Result<string>>` instead of throwing natively. Update callers to unwrap and check `ok`.
5. Update `src/app/install-main-source.ts` to check the `Result` from `updateGitHubSubmodules`, removing the generic `try...catch` and the generic string interpolation fallback, preserving deeper error contexts explicitly.
6. Refactor top-level error handling in `src/index.ts` to extract properties like `message` or `stack` from `unknown` objects robustly instead of just casting with `String(error)`.
7. Update test suites (e.g. in `tests/adapters/` and `tests/app/`) to verify externally observable behavior against the new `Result` boundaries rather than expecting exceptions to be thrown.
8. Update documentation/JSDoc on modified modules to reflect the usage of `Result` types for error handling.

## Acceptance Criteria

- `fetchReleaseAsset`, `runGitHubCommand`, and `resolveGitHubHttpUsername` return structured success/failure representations instead of throwing generic errors.
- `index.ts` and `install-main-source.ts` handle exceptions rigorously without dropping metadata or falling back generically to `String(error)`.
- Top-level unhandled rejection logging doesn't lose non-`Error` thrown object values or stack traces.

## Risks

- `Result` values might be silently ignored if callers are not forced to verify the `ok` property, leading to unhandled failures that do not crash but leave the application in an invalid state.
- Subprocess error handling might fail to correctly embed git stdout/stderr into the custom error returned in the `Result`, causing diagnostic metadata loss.
- Converting thrown native `Error` classes to `Result` objects might result in lost stack traces if not instantiated correctly at the point of failure.