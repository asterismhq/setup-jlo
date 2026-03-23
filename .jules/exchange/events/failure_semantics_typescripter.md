---
label: "refacts"
created_at: "2024-03-01"
author_role: "typescripter"
confidence: "high"
---

## Problem

Errors and failures use an implicit `throw` strategy instead of returning a modeled `Result` or explicit union type, degrading the reliability of async boundaries.

## Goal

Model failure semantics using explicit discriminated union types or a `Result` wrapper at system boundaries, instead of relying purely on unstructured thrown errors, so failures become visible in the type signature.

## Context

Throwing errors makes the failure mode of the API implicit and invisible to TypeScript's type checker. This forces callers to either assume success or wrap everything in generic `try...catch` blocks that swallow structured domain failures. In robust TypeScript layers, especially async ones like HTTP or subprocess execution, the failure is a known possible outcome, not an exception. Modeling this state explicitly using discriminated unions (e.g., `{ success: true, data: T } | { success: false, error: DomainError }`) aligns with making invalid states unrepresentable and enforces exhaustive handling of failures at compile time.

## Evidence

- path: "src/adapters/github/release-asset-api.ts"
  loc: "44-55"
  note: "`fetchReleaseAsset` relies exclusively on `throw new Error(...)` for expected HTTP failures like 401, 403, and 404, hiding the failure type from the caller."
- path: "src/adapters/process/github-source-git.ts"
  loc: "107-111"
  note: "`runGitHubCommand` relies on `throw new Error(...)` to signal a failed subprocess execution instead of returning a typed success/failure struct."
- path: "src/adapters/github/github-git-http-username.ts"
  loc: "40-49"
  note: "`resolveGitHubHttpUsername` masks expected HTTP failures behind generic thrown errors, preventing callers from reasoning about the failure in type-safe code."

## Change Scope

- `src/adapters/github/release-asset-api.ts`
- `src/adapters/process/github-source-git.ts`
- `src/adapters/github/github-git-http-username.ts`
