---
label: "tests"
---

## Goal

Refactor the tests in `tests/adapters/process/cargo-build.test.ts` and `tests/adapters/process/github-source-git.test.ts` to reduce tight coupling to the exact structural array arguments of `child_process.spawnSync`. Tests should use partial assertions to verify the core observable constraints without being brittle to minor reordering or exact argument string sequences.

## Current State

- `tests/adapters/process/cargo-build.test.ts`: Asserts against the exact array argument `['build', '--release', '--manifest-path', '/src/Cargo.toml']` for `spawnSync`. This makes the test fail if an optional, non-breaking flag is added or the order of arguments changes in the implementation.
- `tests/adapters/process/github-source-git.test.ts`: Asserts on exact array combinations for `clone` and `submodule` updates in `childProcess.spawnSync` like `['clone', '--quiet', '--depth=1', '--branch', 'main', '--', ...]` and specific sequence numbers.

## Plan

1. In `tests/adapters/process/cargo-build.test.ts`, replace the `toHaveBeenCalledWith` assertion for `spawnSync` that checks the exact array `['build', '--release', '--manifest-path', '/src/Cargo.toml']`.
2. Introduce assertions that ensure `spawnSync` is called with `'cargo'` and that the arguments array *contains* expected key values (like `'build'`, `'--release'`, and `'/src/Cargo.toml'`), potentially using `expect.arrayContaining` and partial object matchers instead of exact structural matches.
3. In `tests/adapters/process/github-source-git.test.ts`, similarly update the `spawnSync` assertions in `cloneGitHubBranch` and `updateGitHubSubmodules`.
4. Ensure the assertions verify that `spawnSync` is called with the expected executable ('git') and contains key flags/urls without requiring an exact, rigid array match.
5. Alternatively, if the argument construction logic is complex enough, instruct the implementer to extract it into pure functions within the adapter and test those pure functions separately, while keeping the `spawnSync` boundary tests simpler and focused only on the command execution outcome (e.g., throwing errors on non-zero exit).

## Acceptance Criteria

- `tests/adapters/process/cargo-build.test.ts` no longer asserts against exact, hardcoded `spawnSync` array structures.
- `tests/adapters/process/github-source-git.test.ts` no longer asserts against exact, hardcoded `spawnSync` array structures.
- Tests use `expect.arrayContaining` or similar partial matching strategies.
- The tests pass successfully.

## Risks

- Partial assertions might become too loose, missing critical flags that actually break the functionality. The assertions should be carefully designed to check for all non-optional, semantically required flags.