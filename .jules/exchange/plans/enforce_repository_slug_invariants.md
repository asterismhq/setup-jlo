---
label: "refacts"
---

## Goal

Ensure `RepositorySlug` is the single source of truth for representing repository identities by leveraging `parseRepositorySlug` at the boundary entry points to enforce invariants, preventing invalid un-namespaced strings. Replace stringly-typed `repository` parameters and constants with the `RepositorySlug` domain type.

## Current State

Raw strings are used instead of the `RepositorySlug` domain type, leading to potential invariants bypass and lack of single source of truth for repository identities.

### Implementation Targets
- `src/adapters/process/github-source-git.ts`: The `cloneGitHubBranch` function accepts a raw `string` for the `repository` parameter and passes it to `buildAuthenticatedGitHubRepositoryUrl`, which concatenates it without any validation. This allows unvalidated strings to be used for the repository argument.
- `src/catalog/jlo.ts`: Exports `JLO_REPOSITORY` as a raw string `asterismhq/jlo`.
- `src/app/install-main-source.ts`: Imports `JLO_REPOSITORY` as a raw string and passes it into `cloneGitHubBranch`.
- `src/adapters/github/release-asset-api.ts`: `fetchReleaseAsset` takes a `releaseRepository: string`, although it correctly calls `parseRepositorySlug` inside the function, it should be taking `RepositorySlug` as argument directly to push the validation to boundary edges.
- `src/app/install-release.ts`: Imports `JLO_REPOSITORY` as a raw string and passes it into `fetchReleaseAsset`.

### Tests
- `tests/adapters/process/github-source-git.test.ts`: Passes raw strings instead of `RepositorySlug` domains.
- `tests/adapters/github/release-asset-api.test.ts`: Passes raw strings instead of `RepositorySlug` domains and expects error messages with raw string interpolation.

### Documentation
- No documentation updates are identified because no new public features are exposed, this is a structural boundaries refactoring.

## Plan

### Refactor src/catalog/jlo.ts
Change `JLO_REPOSITORY` export to be a `RepositorySlug` using `parseRepositorySlug('asterismhq/jlo')`.

### Refactor src/adapters/process/github-source-git.ts
Change `cloneGitHubBranch` signature to accept `repository: RepositorySlug` instead of `string`. Update `buildGitHubRepositoryUrl` and `buildAuthenticatedGitHubRepositoryUrl` to accept `repository: RepositorySlug` and use `${repository.owner}/${repository.repo}` in the URL construction.

### Refactor src/app/install-main-source.ts
Update imports and usage of `JLO_REPOSITORY` and `cloneGitHubBranch` to reflect the new type. The logging `core.info` may need string interpolation `${JLO_REPOSITORY.owner}/${JLO_REPOSITORY.repo}`.

### Refactor src/adapters/github/release-asset-api.ts
Change `fetchReleaseAsset` signature to accept `releaseRepository: RepositorySlug` instead of `string`. Remove internal `parseRepositorySlug` call and use the `releaseRepository` parts directly for API calls. Update error messages to stringify the slug using `${options.releaseRepository.owner}/${options.releaseRepository.repo}`.

### Refactor src/app/install-release.ts
Ensure the usage of `JLO_REPOSITORY` passed to `fetchReleaseAsset` and `core.info` error messages is updated to use the stringified format of the `RepositorySlug`.

### Update Tests
Update `tests/adapters/process/github-source-git.test.ts` test calls to pass `RepositorySlug` objects instead of strings. Update `tests/adapters/github/release-asset-api.test.ts` test calls to pass `RepositorySlug` objects. Update mock error message expectations to match the formatted slug.

### Pre-commit Steps
Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done. Use `npm run typecheck` and `npm run test` to verify changes.

## Acceptance Criteria

- `RepositorySlug` types are uniformly expected within the adapter and app logic, specifically `cloneGitHubBranch` and `fetchReleaseAsset`.
- `JLO_REPOSITORY` is defined and exported as a `RepositorySlug`.
- Raw string arguments representing owner/repo strings are fully removed from these APIs.
- Type errors are fixed and the test suite passes.

## Risks

- Breaking the URL format in GitHub Git operations if string interpolation of the slug object is incorrect.
- Failing to locate GitHub API endpoints if the owner/repo mapping is incorrectly passed.
