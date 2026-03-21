---
label: "refacts"
created_at: "2024-03-21"
author_role: "data_arch"
confidence: "high"
---

## Problem

The domain type `RepositorySlug` exists to represent an owner and repository tuple. However, this type is bypassed in `src/adapters/process/github-source-git.ts`, where repository slugs are manipulated as raw strings. The function `buildGitHubRepositoryUrl` and its callers simply concatenate `options.repository`, missing the data validation guarantees of `parseRepositorySlug`.

## Goal

Ensure `RepositorySlug` is the single source of truth for representing repository identities by leveraging `parseRepositorySlug` at the boundary entry points to enforce invariants.

## Context

Passing around raw strings instead of validated domain objects allows invalid states to be represented (e.g., an un-namespaced repository string) and bypasses boundary validation. This violates the principle of "Represent Valid States Only", meaning invariants should be encoded such that invalid states are hard to express. It's missing validation that is present elsewhere in the system.

## Evidence

- path: "src/domain/repository-slug.ts"
  loc: "line 1-20"
  note: "Defines `RepositorySlug` and validation logic via `parseRepositorySlug`."
- path: "src/adapters/process/github-source-git.ts"
  loc: "line 16, 31, 134, 139, 140"
  note: "Accepts `repository` as a raw `string` and concatenates it without any validation, rather than accepting or parsing a `RepositorySlug`."

## Change Scope

- `src/adapters/process/github-source-git.ts`
- `src/app/install-main-source.ts`
