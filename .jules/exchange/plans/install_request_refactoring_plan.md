---
label: "refacts"
---

## Goal

Align internal token property names in `InstallRequest` with the public input names (`token`, `submoduleToken`), and ensure `InstallRequest` maps environment-specific inputs to pure domain facts (`cacheRoot`, `tempDirectory`) rather than propagating external terminology.

## Current State

- `src/action/install-request.ts`: Defines `InstallRequest` with `installToken`, `installSubmoduleToken`, `runnerEnvironment`, `runnerTemp`, and `runnerToolCache`. Leaks GitHub Actions-specific terms into the core logic.
- `src/app/install-main-source.ts`: Uses `installToken`, `installSubmoduleToken`, and constructs temp paths using `request.runnerTemp ?? tmpdir()`. Passes the request object into `resolveCacheRoot`.
- `src/app/install-release.ts`: Uses `installToken` and constructs temp paths using `request.runnerTemp ?? tmpdir()`. Passes the request object into `resolveCacheRoot`.
- `src/adapters/cache/binary-install-cache.ts`: Defines `resolveCacheRoot` which inspects properties like `runnerEnvironment` to calculate paths, pulling transport logic into the adapter.
- `tests/action/install-request.test.ts`: Tests the transport leak by asserting environment properties directly on the request.

## Plan

1. Update `src/action/install-request.ts` to rename `installToken` to `token`, and `installSubmoduleToken` to `submoduleToken` in the `InstallRequest` interface.
2. In `src/action/install-request.ts`, replace transport-specific properties (`runnerEnvironment`, `runnerTemp`, `runnerToolCache`, `cacheRootOverride`) in `InstallRequest` with domain path properties: `cacheRoot` and `tempDirectory`.
3. Move the path calculation logic currently inside `resolveCacheRoot` from `src/adapters/cache/binary-install-cache.ts` into `resolveInstallRequest` in `src/action/install-request.ts`. `resolveInstallRequest` will now resolve and set the final `cacheRoot` and `tempDirectory` based on environment variables and `os.tmpdir()`.
4. Update `src/adapters/cache/binary-install-cache.ts` to remove the `resolveCacheRoot` function completely, since `cacheRoot` will be available directly on `InstallRequest`.
5. Update `src/app/install-main-source.ts` and `src/app/install-release.ts` to use `request.token`, `request.submoduleToken`, `request.tempDirectory`, and `request.cacheRoot`.
6. Update `tests/action/install-request.test.ts` to reflect the new `InstallRequest` structure and assert on the computed `cacheRoot` and `tempDirectory` values.

## Acceptance Criteria

- `InstallRequest` contains properties named `token` and `submoduleToken`.
- `InstallRequest` contains properties named `cacheRoot` and `tempDirectory` instead of GitHub runner specific environment names.
- The `resolveCacheRoot` function is removed from `src/adapters/cache/binary-install-cache.ts`.
- Tests assert that `InstallRequest` correctly maps environment combinations to pure domain paths.

## Risks

- Path calculation logic might behave differently if not carefully adapted during the move, causing installation directory mismatches across steps.
- Incomplete updates across the `app` or `adapters` boundaries may lead to runtime errors due to missing or renamed properties.