---
label: "refacts"
created_at: "2024-03-23"
author_role: "data_arch"
confidence: "high"
---

## Problem

The `InstallRequest` interface in `src/action/install-request.ts` acts as a monolithic container coupling properties for distinct operational modes. Specifically, `submoduleToken` is only relevant for the `main` install mode, while `allowDarwinX8664Fallback` is primarily a concern for the `release-tag` install mode. This forces invalid state representations (e.g. `submoduleToken?: string`) that are checked ad-hoc downstream.

## Goal

Model distinct input structures for `main` vs. `release-tag` installations. This ensures that the type system guarantees the presence of required parameters (like `submoduleToken` for source builds) at the boundary, adhering to "Represent Valid States Only".

## Context

Using an optional `submoduleToken` leads to implicit validation or panics deep in the application logic (`src/app/install-main-source.ts:37`), violating "Where are invariants enforced: boundaries (preferred) or scattered call sites?". A tagged union or separate request types based on the resolved `InstallMode` would guarantee that when a `main` build is requested, its required configuration is statically guaranteed.

## Evidence

- path: "src/action/install-request.ts"
  loc: "line 6"
  note: "`submoduleToken` is defined as optional `submoduleToken?: string` in the unified `InstallRequest`."

- path: "src/app/install-main-source.ts"
  loc: "line 37-39"
  note: "Scatter validation: `if (!request.submoduleToken) { throw new Error(...) }` checks for the token at the usage site rather than enforcing it at the action boundary."

- path: "src/action/install-request.ts"
  loc: "line 7"
  note: "`allowDarwinX8664Fallback` is present on all requests, though only `installReleaseVersion` consumes it."

## Change Scope

- `src/action/install-request.ts`
- `src/index.ts`
- `src/app/install-main-source.ts`
- `src/app/install-release.ts`
