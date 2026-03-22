---
label: "tests"
---

## Goal

Refactor the tests in `tests/app/install-main-source.test.ts` and `tests/app/install-release.test.ts` to assert on externally observable behaviors and state changes (like filesystem operations and cache management) rather than internal implementation details and function spy interactions.

## Current State

- `tests/app/install-main-source.test.ts`: Heavily mocks internal adapters (e.g., `updateGitHubSubmodules`, `buildCargoRelease`, `copyExecutableBinary`). Tests assert on whether these internal functions were called rather than whether the app function actually resulted in a successful clone, build, and caching outcome observable via the filesystem or higher-level interfaces.
- `tests/app/install-release.test.ts`: Relies on internal mocks like `fetchReleaseAsset`, `detectPlatformTuple`, `isCachedBinaryForVersion`, asserting their interaction rather than utilizing a realistic temp filesystem to verify the binary ends up in the correct target path.

## Plan

1. In `tests/app/install-main-source.test.ts`, remove the internal mocks for `updateGitHubSubmodules`, `buildCargoRelease`, `copyExecutableBinary`, `resolveGitWorktreeHeadSha`, `detectPlatformTuple`, `resolvePlatformCacheDirectory`, `ensureInstallDirectory`, `installBinaryOnPath`, `pruneSiblingInstallDirectories`, and `detectBinaryVersion`.
2. Introduce a filesystem-based testing strategy using a temporary directory (e.g., `os.tmpdir()` with `fs.mkdtempSync`). Setup realistic stubs only at the true external boundaries:
   - Network API: Mock `resolveGitHubHttpUsername`.
   - OS Process (`spawnSync` / `child_process`): Intercept `spawnSync` calls for `git` and `cargo` to simulate success/failure behaviors without requiring network or actual build processes.
   - Core Action API: Mock `@actions/core` to verify user-facing logs.
3. Assert that the resulting binary file exists at the expected path inside the temporary cache directory after execution, verifying the true goal of the `installMainSource` function.
4. Apply the same principles to `tests/app/install-release.test.ts`. Remove internal mocks (`buildReleaseAssetCandidates`, `resolvePlatformCacheDirectory`, `isCachedBinaryForVersion`, `installBinaryOnPath`, etc.).
5. Mock the network boundary (`fetchReleaseAsset` or the `undici` `request` it calls) to return a dummy binary payload. Use a real temporary cache directory.
6. Assert that `installReleaseVersion` results in the binary being successfully written to the correct location in the temporary cache directory, and that appropriate success logs are emitted via `@actions/core`.
7. Ensure both tests have proper `afterEach` cleanup logic to remove any temporary directories created during the tests.

## Acceptance Criteria

- `tests/app/install-main-source.test.ts` no longer spies on or mocks internal `adapters` and `domain` functions.
- `tests/app/install-release.test.ts` no longer spies on or mocks internal `adapters` and `domain` functions.
- Both test files utilize a real temporary filesystem directory to verify the outcome of the installation process.
- Both test files assert on the existence of the installed binary in the expected cache location.
- The tests pass successfully.

## Risks

- File permission issues or leftover artifacts from temporary directories could cause test flakiness or cross-test contamination if teardown is missed. We need robust `afterEach` cleanup using `fs.rmSync(dir, { recursive: true, force: true })`.
- Mocking OS process boundaries (like `spawnSync`) might require complex matchers if the app invokes them multiple times with different arguments. The mocks must be flexible enough to handle these variations predictably.