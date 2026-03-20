---
label: "refacts"
---

## Goal

Align terminology across the codebase: ensure the internal and output models agree on the name `release-tag`, and standardize the internal variable names to avoid overloading the word `token`.

## Current State

The concept of "version token" and "install mode" is currently inconsistent (`release` internally vs `release-tag` in outputs). Furthermore, `src/index.ts` overloads the word `token` as both the GitHub API token and the requested installation version.

- `src/domain/version-token.ts`: Defines `ParsedVersionToken.kind` as `'release'` instead of `'release-tag'`.
- `src/index.ts`: Overloads the `token` variable (used for GitHub API token and version token). Explicitly maps `'release'` to `'release-tag'` for the install mode.
- `src/action/outputs.ts`: Has `installMode` typed as `'release-tag' | 'main'`, which is good but misaligned with `ParsedVersionToken`.
- `src/app/install-release.ts`: References `Extract<ParsedVersionToken, { kind: 'release' }>`, which needs to be updated.
- `tests/domain/version-token.test.ts`: Asserts `'release'` instead of `'release-tag'`.
- `tests/app/install-release.test.ts`: Uses `{ kind: 'release' }` in mock payload.
- `action.yml`: Correctly documents `release-tag` as the resolved installation mode, but its inputs could be confusing if not aligned with docs.
- `docs/configuration/inputs.md`: Needs to ensure the distinction between GitHub token and version token is clear.
- `docs/usage.md`: Needs to refer to version tokens consistently in its examples.

## Plan

### Update ParsedVersionToken Type and Parsing Logic

- In `src/domain/version-token.ts`, change the union type for the release kind from `{ kind: 'release'; ... }` to `{ kind: 'release-tag'; ... }`.
- Update `parseVersionToken` in the same file to return `kind: 'release-tag'`.

### Update Index Variables and Mapping

- In `src/index.ts`, change variable names to avoid `token` overloading (already uses `token` and `versionToken` but can be clearer). The parameter `token` in `resolveInstallMode(token: string)` should be `versionToken`.
- Remove the explicit mapping `parsedVersion.kind === 'release' ? 'release-tag' : 'main'`, since `parsedVersion.kind` will now exactly match the install mode (`'release-tag' | 'main'`).

### Update Install App References

- In `src/app/install-release.ts`, change `Extract<ParsedVersionToken, { kind: 'release' }>` to `{ kind: 'release-tag' }`.

### Update Tests to Match New Structural Names

- In `tests/domain/version-token.test.ts`, update expected payloads from `kind: 'release'` to `kind: 'release-tag'`.
- In `tests/app/install-release.test.ts`, update the payload passed to `installReleaseVersion` to `{ kind: 'release-tag' }`.
- Review other tests (`tests/action/install-request.test.ts`, `tests/app/install-main-source.test.ts`) to ensure no lingering `kind: 'release'` usages.

### Update Documentation for Terminology Uniformity

- Update `docs/configuration/inputs.md` to consistently refer to `versionToken` for install versions and maintain clarity that `token` specifically refers to GitHub token authentication. Ensure the output descriptions match the refined internal kind `release-tag`.
- Update `docs/usage.md` to consistently use the terminology defined by the codebase changes, ensuring "version token" and "install mode" are unambiguous.

## Acceptance Criteria

- `ParsedVersionToken.kind` exactly matches `'release-tag' | 'main'`.
- `resolveInstallMode` and `run` in `src/index.ts` directly use `parsedVersion.kind` without mapping.
- Variable names for the install version in `src/index.ts` are consistently named `versionToken`.
- Tests pass with the updated terminology.
- No references to `{ kind: 'release' }` remain in the codebase.
- `docs/configuration/inputs.md` and `docs/usage.md` are updated to match the new uniform terminology.

## Risks

- Output breakage: If `release-tag` output was relied upon by downstream actions, changing its value would be a breaking change. Our plan preserves the output value `release-tag` and aligns the internal types to it, minimizing this risk.
- Type errors: Modifying `ParsedVersionToken` will break all consuming files. TypeScript compiler (`npm run typecheck`) must be used to ensure all references are caught and updated.
