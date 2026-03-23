---
label: "refacts"
implementation_ready: false
---

## Goal

Standardize the naming and typed usage of GitHub repository identifiers (the `<owner>/<repo>` concept) across boundaries, establishing a single source of truth in the `RepositorySlug` domain type and eliminating primitive string parsing at call sites.

## Problem

The concept of a repository specified as `<owner>/<repo>` is inconsistently named (`slug`, `repository`, `releaseRepository`) across function boundaries, creating a confusing taxonomy. Simultaneously, the codebase exhibits primitive obsession by relying on plain strings to pass this concept, rather than using the structured `RepositorySlug` object. This forces downstream adapters and functions to duplicate parsing or string formatting and masks the structured domain invariants.

## Context

Using plain strings for structured domain concepts violates "Boundary Sovereignty" and "Single Source of Truth." It requires manual parsing or formatting at points of use (e.g., in `fetchReleaseAsset`), increasing the risk of invalid formats being passed deep into the system. Representing the catalog entry as a valid `RepositorySlug` object directly encodes invariants at the source.

Concurrently, different layers use different terms for the exact same conceptual parameter. `parseRepositorySlug` accepts a `slug`, while `cloneGitHubBranch` accepts `repository`, and `fetchReleaseAsset` specifically names it `releaseRepository`. This inconsistency requires developers to mentally map synonymous terms across the domain, app, and adapter boundaries.

## Evidence

- source_event: "primitive_obsession_repository_slug_data_arch.md"
  path: "src/catalog/jlo.ts"
  loc: "line 1"
  note: "`JLO_REPOSITORY` is defined as a plain string `'asterismhq/jlo'` instead of a `RepositorySlug`."

- source_event: "primitive_obsession_repository_slug_data_arch.md"
  path: "src/adapters/process/github-source-git.ts"
  loc: "line 117"
  note: "`cloneGitHubBranch` accepts `repository: string` and concatenates it manually in `buildGitHubRepositoryUrl`."

- source_event: "repository_slug_naming_taxonomy.md"
  path: "src/domain/repository-slug.ts"
  loc: "export function parseRepositorySlug(slug: string)"
  note: "Domain module explicitly introduces the term 'slug'."

- source_event: "repository_slug_naming_taxonomy.md"
  path: "src/adapters/process/github-source-git.ts"
  loc: "export function cloneGitHubBranch(options: { repository: string, ... })"
  note: "Process adapter uses 'repository' for the identical concept."

- source_event: "repository_slug_naming_taxonomy.md"
  path: "src/adapters/github/release-asset-api.ts"
  loc: "export async function fetchReleaseAsset(options: { releaseRepository: string, ... })"
  note: "API adapter introduces 'releaseRepository', and parses the primitive string argument inline into a `RepositorySlug` object."

## Change Scope

- `src/catalog/jlo.ts`
- `src/domain/repository-slug.ts`
- `src/adapters/github/release-asset-api.ts`
- `src/adapters/process/github-source-git.ts`
- `src/app/install-main-source.ts`
- `src/app/install-release.ts`

## Constraints

- Function arguments referencing a repository's owner and name must accept the `RepositorySlug` type directly where practical, and any string fallback usages must use a unified, descriptive name like `repositorySlug`.
- Parsing logic for repository identifiers must occur at the outer boundary, passing the validated domain type inward to core logic.

## Acceptance Criteria

- `JLO_REPOSITORY` in `src/catalog/jlo.ts` is explicitly typed or parsed as a `RepositorySlug` upon definition.
- Parameter names across `fetchReleaseAsset`, `cloneGitHubBranch`, and corresponding application layers uniformly refer to the repository using a standard term.
- `fetchReleaseAsset` accepts a fully parsed `RepositorySlug` instead of parsing a primitive string internally.
