---
label: "refacts"
---

## Goal

Standardize the naming and typed usage of GitHub repository identifiers across boundaries, establishing a single source of truth using the `RepositorySlug` domain type and eliminating primitive string obsession and inconsistent parameter taxonomy (`slug`, `repository`, `releaseRepository`).

## Current State

The repository identifier concept is inconsistently named across boundaries and passed as primitive strings, forcing redundant parsing and masking domain invariants.
- `src/catalog/jlo.ts`: Hardcodes `JLO_REPOSITORY` as a plain string `'asterismhq/jlo'`, deferring validation.
- `src/adapters/process/github-source-git.ts`: `cloneGitHubBranch` accepts `repository: string` and manually interpolates it.
- `src/adapters/github/release-asset-api.ts`: `fetchReleaseAsset` names the parameter `releaseRepository: string` and parses it internally, duplicating boundary responsibilities.
- `src/app/install-main-source.ts`: Connects the primitive catalog string to the process adapter.
- `src/app/install-release.ts`: Connects the primitive catalog string to the API adapter.
- Tests for these boundaries currently mock or pass primitive string arguments, coupling tests to the redundant internal parsing instead of the unified domain object.

## Plan

1. Redefine `JLO_REPOSITORY` in `src/catalog/jlo.ts` as a parsed `RepositorySlug` object using `parseRepositorySlug`.
2. Refactor `src/adapters/github/release-asset-api.ts` to require a `repositorySlug: RepositorySlug` argument in `fetchReleaseAsset` and remove the internal string parsing. Update corresponding test setups to provide the object.
3. Refactor `src/adapters/process/github-source-git.ts` to require a `repositorySlug: RepositorySlug` argument in `cloneGitHubBranch` and its internal URL builders. Update concatenation to use the `owner` and `repo` properties. Update corresponding test setups.
4. Update `src/app/install-main-source.ts` and `src/app/install-release.ts` to pass the structured `JLO_REPOSITORY` catalog object directly to the updated adapter functions.

## Acceptance Criteria

- `JLO_REPOSITORY` in `src/catalog/jlo.ts` is explicitly typed or parsed as a `RepositorySlug` upon definition.
- Parameter names across `fetchReleaseAsset`, `cloneGitHubBranch`, and corresponding application layers uniformly refer to the repository using the `repositorySlug` identifier and type.
- `fetchReleaseAsset` accepts a fully parsed `RepositorySlug` instead of parsing a primitive string internally.

## Risks

- Breaking authentication formatting in `cloneGitHubBranch` if the `owner/repo` concatenation logic in `buildAuthenticatedGitHubRepositoryUrl` drops the slash or incorrectly orders the segments.
- Regressions in GitHub API queries in `fetchReleaseAsset` if the URL interpolation does not properly deconstruct the `RepositorySlug` `owner` and `repo` properties.
