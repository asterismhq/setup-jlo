---
label: "refacts"
created_at: "2024-03-21"
author_role: "data_arch"
confidence: "high"
---

## Problem

The term `token` is overloaded in the codebase. It refers to both the installation version requested by the user (`versionToken`) and the GitHub API authentication token (`token` / `submoduleToken`). The `ParsedVersionToken` type has a variant `{ kind: 'main'; token: 'main' }` which reuses the word `token` for a completely different concept than authentication.

## Goal

Disambiguate the term `token` across the codebase. Ensure `token` strictly means an authentication token, and use a term like `version` or `ref` for installation targets to avoid semantic overlap.

## Context

Using the same term for conceptually different facts violates the First Principle of Boundary Sovereignty and Single Source of Truth, as the meaning of `token` depends heavily on context. The memory guidelines explicitly state: "In the setup-jlo codebase, 'versionToken' refers to the installation version requested by the user, while 'token' specifically refers to the GitHub API authentication token. Do not overload these variable names." Re-using `token` within `ParsedVersionToken` for the `'main'` literal introduces an invalid state of ambiguity.

## Evidence

- path: "src/domain/version-token.ts"
  loc: "line 3"
  note: "Defines the 'main' variant as `{ kind: 'main'; token: 'main' }` instead of `{ kind: 'main'; version: 'main' }` or similar, overloading the term 'token'."
- path: "src/action/install-request.ts"
  loc: "line 5, 13, 40"
  note: "Uses 'token' and 'submoduleToken' for GitHub authentication credentials."

## Change Scope

- `src/domain/version-token.ts`
- `src/index.ts`
