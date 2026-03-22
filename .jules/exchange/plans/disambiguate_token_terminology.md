---
label: "refacts"
---

## Goal

Disambiguate the term `token` across the codebase so that `token` strictly refers to an authentication credential. Use `ref` and `segment` for installation targets and string manipulation to avoid semantic overlap.

## Current State

- `src/domain/version-token.ts`: Named with `token`, exports `ParsedVersionToken` and `parseVersionToken`. The `main` variant uses `{ kind: 'main'; token: 'main' }` which overloads `token`. It also uses `token` as a generic parameter in `extractSemver(token: string)`.
- `tests/domain/version-token.test.ts`: Test file for `version-token.ts` with test cases referencing the old terminology.
- `src/adapters/cache/binary-install-cache.ts`: Uses `token` as a loop variable for string segments in `extractFirstSemverTriplet`.
- `src/index.ts`: Uses the variable `versionToken`.
- `src/action/outputs.ts`, `tests/action/outputs.test.ts`, `tests/app/install-release.test.ts`: Uses `versionToken` as a parameter and variable.
- Documentation (`README.md`, `docs/usage.md`, `docs/architecture.md`) and `action.yml`: Refer to "version token" in descriptions.

## Plan

1. Use `run_in_bash_session` to rename `src/domain/version-token.ts` to `src/domain/version-ref.ts` and `tests/domain/version-token.test.ts` to `tests/domain/version-ref.test.ts`. Use `list_files` to verify the renames.
2. Use a file editing tool (e.g. `replace_with_git_merge_diff` or `write_file`) to update `src/domain/version-ref.ts`:
   - Rename `ParsedVersionToken` to `ParsedVersionRef`.
   - Rename `parseVersionToken` to `parseVersionRef`.
   - Change variant from `{ kind: 'main'; token: 'main' }` to `{ kind: 'main'; ref: 'main' }`.
   - Change `extractSemver(token: string)` to `extractSemver(segment: string)`.
   - Verify with `read_file`.
3. Use a file editing tool to update `tests/domain/version-ref.test.ts` to reflect the new types, function names, and imports. Verify with `read_file`.
4. Use a file editing tool to update `src/adapters/cache/binary-install-cache.ts`:
   - Change the loop variable from `token` to `segment` in `for (const token of value.split(/\s+/))`.
   - Update the import path from `../../domain/version-token` to `../../domain/version-ref`.
   - Verify with `read_file`.
5. Use a file editing tool to update `src/index.ts`:
   - Rename the `versionToken` variable to `versionRef`.
   - Update `parseVersionToken` to `parseVersionRef` and fix the import.
   - Verify with `read_file`.
6. Use a file editing tool to update `src/action/outputs.ts` and `tests/action/outputs.test.ts`:
   - Rename `versionToken` parameters and variables to `versionRef`.
   - Verify with `read_file`.
7. Use a file editing tool to update `src/app/install-release.ts` and `tests/app/install-release.test.ts`:
   - Update imports and rename `ParsedVersionToken` to `ParsedVersionRef`.
   - Verify with `read_file`.
8. Use a file editing tool to update `src/app/install-main-source.ts` and `tests/app/install-main-source.test.ts` if they contain references to `versionToken` or `ParsedVersionToken`. Verify with `read_file`.
9. Use a file editing tool to replace "version token" with "version ref" or "version" in `README.md`, `docs/usage.md`, `docs/architecture.md`, and descriptions in `action.yml` (while retaining the public API output key `version-token`). Verify with `read_file`.
10. Use `run_in_bash_session` to run `npm run typecheck` and `npm run test` (or `just check` / `just test`) to verify that all type checks pass and no regressions were introduced.

## Acceptance Criteria

- All instances of `token` in the codebase strictly refer to authentication or access credentials, excluding the legacy public API output key `version-token`.
- Variables and parameters representing installation targets are named `versionRef` or `version`.
- Variables representing generic string segments are named `segment`.
- All tests and type checks pass.

## Risks

- Forgetting to update an import path after file renaming could lead to build or test failures.
- Modifying the public action output key `version-token` would break consumer workflows; this is mitigated by keeping the key strictly as `version-token` while changing the internal variable.