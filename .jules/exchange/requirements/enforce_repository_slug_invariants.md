---
label: "refacts"
implementation_ready: false
---

## Goal

Ensure `RepositorySlug` is the single source of truth for representing repository identities by leveraging `parseRepositorySlug` at the boundary entry points to enforce invariants, preventing invalid un-namespaced strings.

## Problem

The domain type `RepositorySlug` exists to represent an owner and repository tuple. However, this type is bypassed in `src/adapters/process/github-source-git.ts`, where repository slugs are manipulated as raw strings. The function `buildGitHubRepositoryUrl` and its callers simply concatenate `options.repository`, missing the data validation guarantees of `parseRepositorySlug`. Passing around raw strings instead of validated domain objects allows invalid states to be represented.

## Evidence

- source_event: "inconsistent_repository_slug_usage_data_arch.md"
  path: "src/domain/repository-slug.ts"
  loc: "line 1-20"
  note: "Defines `RepositorySlug` and validation logic via `parseRepositorySlug`."
- source_event: "inconsistent_repository_slug_usage_data_arch.md"
  path: "src/adapters/process/github-source-git.ts"
  loc: "line 16, 31, 134, 139, 140"
  note: "Accepts `repository` as a raw `string` and concatenates it without any validation, rather than accepting or parsing a `RepositorySlug`."

## Change Scope

- `src/adapters/process/github-source-git.ts`
- `src/app/install-main-source.ts`

## Constraints

- Input schemas should parse `RepositorySlug` instances natively instead of waiting for a downstream layer to perform coercion or validation.

## Acceptance Criteria

- `RepositorySlug` types are uniformly expected within the adapter and app logic.
- Raw string arguments representing owner/repo strings are fully removed.
