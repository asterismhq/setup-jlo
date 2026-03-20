---
label: "tests"
---

## Goal

Add isolated unit tests for the adapters handling filesystem operations, process spawning, and network I/O, ensuring that failure modes (e.g., 401/403 errors, non-OK statuses) are adequately tested. This ensures that the outer boundaries of the system handle integration failures gracefully and bubble up accurate error messages.

## Current State

- `src/adapters/cache/binary-install-cache.ts`: Performs extensive filesystem operations (directory creation, caching) and spawns processes for version checking. It is completely untested, risking silent failures or corrupted caching during environment setups.
- `src/adapters/process/cargo-build.ts`: Spawns child processes using `spawnSync` to compile binaries. Currently untested, lacking verification that build failures produce actionable error messages.
- `src/adapters/process/github-source-git.ts`: Executes git clone, sha resolution, and submodule sync via `spawnSync`. Completely untested, making it impossible to verify behavior when git commands fail or timeouts occur.
- `src/adapters/github/release-asset-api.ts`: Performs network requests using `fetch` to locate and download release assets. Untested, risking unhandled 401/403/404 HTTP errors or corrupted downloads.
- `src/adapters/github/github-git-http-username.ts`: Partially tested, but critical error paths (e.g. 401, 403, missing login fields, and JSON parsing failures) are not covered. Fails to guarantee that invalid tokens produce clear authentication errors instead of opaque crashes.

## Plan

1. Implement `tests/adapters/cache/binary-install-cache.test.ts`
   - Mock `node:fs` and `node:child_process`.
   - Verify directory resolution, caching binary paths, and execution verification. Ensure externally observable outcomes (e.g., successful cache hits or generated install paths) are tested.
2. Implement `tests/adapters/process/cargo-build.test.ts`
   - Mock `node:child_process` and `node:fs`.
   - Verify successful build execution and failure states correctly bubbling up error messages to the caller.
3. Implement `tests/adapters/process/github-source-git.test.ts`
   - Mock `node:child_process`.
   - Verify git clone execution, sha resolution, and submodule synchronization, prioritizing error states (e.g., unauthenticated clone attempts).
4. Implement `tests/adapters/github/release-asset-api.test.ts`
   - Mock global `fetch`.
   - Verify successful metadata retrieval, asset match, and successful download.
   - Verify 401/403, 404, non-OK statuses, and missing asset matches surface as clear, actionable domain errors.
5. Update `tests/adapters/github-git-http-username.test.ts`
   - Add coverage for error paths.
   - Mock `fetch` to return 401/403 responses and assert error messages.
   - Mock `fetch` to return general non-OK responses and assert error messages.
   - Mock `fetch` to return a successful response with missing or empty login fields and assert error messages.
6. Verify testing works with Vitest using `npm run test` and check formatting/linting.

## Acceptance Criteria

- `binary-install-cache.test.ts` verifies cache root creation, directory operations, and version checking using mocks.
- `cargo-build.test.ts` validates build success logic and checks that error outputs from spawn are thrown correctly.
- `github-source-git.test.ts` asserts git commands are formed correctly for clone, sha extraction, and submodule syncing using mocked spawn.
- `release-asset-api.test.ts` covers fetch success paths and all described failure scenarios (401/403, 404, non-ok, missing matches).
- `github-git-http-username.test.ts` successfully asserts error cases for unauthorized, non-ok, and malformed JSON responses.

## Risks

- Mocking native `fs` and `child_process` can result in brittle tests if internal implementation details change. Mitigation: Mock only boundaries and assert input parameters to external calls.
- Mismatched mock behavior vs actual `fetch` or `spawn` can lead to false positives. Mitigation: Ensure mocked responses accurately represent Node.js and GitHub API behaviors.
