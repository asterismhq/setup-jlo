---
label: "refacts"
created_at: "2024-03-23"
author_role: "data_arch"
confidence: "high"
---

## Problem

The `RepositorySlug` interface is defined in `src/domain/repository-slug.ts`, but it is not used consistently across the codebase. For example, `src/catalog/jlo.ts` defines `JLO_REPOSITORY` as a plain string (`'asterismhq/jlo'`). This primitive obsession leaks transport/UI concerns into core logic and forces call sites to parse the string back into a `RepositorySlug` object or concatenate strings manually.

## Goal

Enforce the single source of truth for repository identifiers by using the `RepositorySlug` domain type directly in the catalog and across boundaries, eliminating string parsing at call sites.

## Context

Using plain strings for structured domain concepts violates "Boundary Sovereignty" and "Single Source of Truth." It requires manual parsing or formatting at points of use (e.g., in `fetchReleaseAsset`), increasing the risk of invalid formats being passed deep into the system. Representing the catalog entry as a valid `RepositorySlug` object directly encodes invariants at the source.

## Evidence

- path: "src/catalog/jlo.ts"
  loc: "line 1"
  note: "`JLO_REPOSITORY` is defined as a plain string `'asterismhq/jlo'` instead of a `RepositorySlug`."

- path: "src/adapters/github/release-asset-api.ts"
  loc: "line 29"
  note: "`fetchReleaseAsset` accepts `releaseRepository: string` and immediately parses it into a `RepositorySlug` (`const { owner, repo } = parseRepositorySlug(options.releaseRepository)`)."

- path: "src/adapters/process/github-source-git.ts"
  loc: "line 117"
  note: "`cloneGitHubBranch` accepts `repository: string` and concatenates it manually in `buildGitHubRepositoryUrl`."

## Change Scope

- `src/catalog/jlo.ts`
- `src/domain/repository-slug.ts`
- `src/adapters/github/release-asset-api.ts`
- `src/adapters/process/github-source-git.ts`
