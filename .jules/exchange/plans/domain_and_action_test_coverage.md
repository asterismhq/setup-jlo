---
label: "tests"
---

## Goal

Implement comprehensive unit tests for `repository-slug.ts`, `inputs.ts`, and `outputs.ts`, and cover OS/Arch fallbacks and Rosetta detection in `platform.ts`.

## Current State

- `src/domain/repository-slug.ts`: Missing tests validating parsing logic and error throws on invalid slugs.
- `src/action/inputs.ts`: Missing tests for `readRequiredInput` and `readOptionalInput` interacting with `@actions/core`.
- `src/action/outputs.ts`: Missing tests for `emitInstallOutputs` interacting with `@actions/core`.
- `src/domain/platform.ts`: Lacks test coverage for switch defaults in `normalizeOs` and `normalizeArch` (throwing errors) and the `detectRosettaArm64` execution path.

## Plan

1. Create `tests/domain/repository-slug.test.ts` to test `parseRepositorySlug`. It should verify successful parsing of valid `owner/repo` formats and assert that an error is thrown for invalid formats.
2. Create `tests/action/inputs.test.ts` to test `readRequiredInput` and `readOptionalInput`. Mock `@actions/core` `getInput` to verify that required inputs throw an error if missing, and optional inputs return undefined if missing. Verify trimming behavior.
3. Create `tests/action/outputs.test.ts` to test `emitInstallOutputs`. Mock `@actions/core` `setOutput` to verify that `version-token` and `install-mode` are correctly emitted.
4. Update `tests/domain/platform.test.ts` to add tests for `detectPlatformTuple`.
   - Mock `process.platform` and `process.arch` to test `normalizeOs` and `normalizeArch`.
   - Verify that unsupported OS and Arch values throw errors.
   - Mock `node:child_process` `execFileSync` to test the `detectRosettaArm64` path when `process.platform` is `darwin` and `process.arch` is `x64`. Test both true (returns '1') and false (returns '0' or throws) conditions for Rosetta.

## Acceptance Criteria

- `repository-slug.ts` has tests validating parsing logic and error throws on invalid slugs.
- `inputs.ts` and `outputs.ts` are tested for proper `@actions/core` interactions and required value enforcement.
- `platform.ts` tests cover missing switch defaults (throwing for unsupported OS/Arch) and the `detectRosettaArm64` execution path.

## Risks

- Mocking `process.platform` and `process.arch` globally might pollute other tests if not restored correctly (requires `vi.stubGlobal` and `vi.unstubAllGlobals`).
- Mocking `@actions/core` might be brittle if the action's dependency updates and changes internal behavior (though the public API is stable).
