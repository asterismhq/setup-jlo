---
label: "refacts"
implementation_ready: false
---

## Goal

Align internal token property names in `InstallRequest` with the public input names (`token`, `submoduleToken`), and ensure `InstallRequest` maps environment-specific inputs to pure domain facts rather than propagating external terminology.

## Context

Consolidated context from source events.

## Problem

The internal naming of GitHub tokens in `InstallRequest` (`installToken`, `installSubmoduleToken`) diverges from the public input names and the `InstallRequest` object leaks transport-level variables (`runnerEnvironment`, `runnerTemp`, etc.) into core domain logic.

## Evidence

- source_event: "token_naming_taxonomy.md"
  path: "src/action/install-request.ts"
  loc: "lines 2-3, 16-17"
  note: "Defines `installToken` and `installSubmoduleToken` properties with unnecessary `install` prefixes."

- source_event: "token_naming_taxonomy.md"
  path: "action.yml"
  loc: "lines 4, 10"
  note: "Defines the inputs simply as `token` and `submodule_token`."

- source_event: "transport_dto_leak_data_arch.md"
  path: "src/action/install-request.ts"
  loc: "lines 5-9"
  note: "Defines properties like `runnerEnvironment`, `runnerTemp`, `runnerToolCache` rather than abstracted path concepts."

- source_event: "transport_dto_leak_data_arch.md"
  path: "src/adapters/cache/binary-install-cache.ts"
  loc: "lines 12-25"
  note: "`resolveCacheRoot` directly inspects string values like `github-hosted` on the options interface to calculate paths, pulling transport logic into the adapter."

## Change Scope

- `src/action/install-request.ts`
- `src/app/install-main-source.ts`
- `src/app/install-release.ts`
- `tests/action/install-request.test.ts`
- `src/adapters/cache/binary-install-cache.ts`

## Constraints

- Property renames must be propagated accurately across all usages in the `app` and `adapters` boundaries.
- The `InstallRequest` boundary must present a clean domain interface that doesn't explicitly refer to GitHub runner internal env var names.

## Acceptance Criteria

- `InstallRequest` has properties named `token` and `submoduleToken` instead of `installToken` and `installSubmoduleToken`.
- Transport-level properties (e.g., `runnerEnvironment`, `runnerTemp`) in `InstallRequest` are replaced with cleanly modeled domain/filesystem path concepts.
- The cache adapter computes paths based on the cleaned domain abstractions without referencing raw runner environment strings.
