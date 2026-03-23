---
label: "refacts"
created_at: "2025-03-23"
author_role: "taxonomy"
confidence: "high"
---

## Problem

The concept of a GitHub repository specified as an `<owner>/<repo>` string is inconsistently named across the application boundaries, alternating between `slug`, `repository`, and `releaseRepository`.

## Goal

Establish a canonical naming convention for `<owner>/<repo>` string identifiers (e.g., `repository_slug`) and standardize it across all modules to ensure consistent parameter names and domain terminology.

## Context

Different layers use different terms for the exact same conceptual parameter. `parseRepositorySlug` accepts a `slug`, while `cloneGitHubBranch` accepts `repository`, and `fetchReleaseAsset` specifically names it `releaseRepository`. This inconsistency requires developers to mentally map synonymous terms across the domain, app, and adapter boundaries.

## Evidence

- path: "src/domain/repository-slug.ts"
  loc: "export function parseRepositorySlug(slug: string)"
  note: "Domain module explicitly introduces the term 'slug'."
- path: "src/adapters/process/github-source-git.ts"
  loc: "export function cloneGitHubBranch(options: { repository: string, ... })"
  note: "Process adapter uses 'repository' for the identical concept."
- path: "src/adapters/github/release-asset-api.ts"
  loc: "export async function fetchReleaseAsset(options: { releaseRepository: string, ... })"
  note: "API adapter introduces 'releaseRepository'."

## Change Scope

- `src/domain/repository-slug.ts`
- `src/adapters/process/github-source-git.ts`
- `src/adapters/github/release-asset-api.ts`
- `src/app/install-main-source.ts`
- `src/app/install-release.ts`
