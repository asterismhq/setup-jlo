---
label: "refacts"
created_at: "2026-03-21"
author_role: "taxonomy"
confidence: "high"
---

## Problem

The term `token` is overloaded. It is used both for GitHub API authentication tokens and as a generic string segment or version string variable.

## Goal

Establish and enforce a shared vocabulary where `token` specifically refers to the GitHub API authentication token, and `versionToken` or similar explicit names are used for version requests or generic string segments.

## Context

In the setup-jlo codebase, 'versionToken' refers to the installation version requested by the user, while 'token' specifically refers to the GitHub API authentication token. Overloading the term `token` to mean multiple things can lead to confusion and reduced refactoring safety, violating the principle of "One Concept, One Preferred Term".

## Evidence

- path: "src/domain/version-token.ts"
  loc: "3"
  note: "`ParsedVersionToken` uses `token` in the `main` kind variant (`{ kind: 'main'; token: 'main' }`) instead of `versionToken`."

- path: "src/domain/version-token.ts"
  loc: "7"
  note: "`extractSemver(token: string)` uses `token` for a generic version string segment."

- path: "src/adapters/cache/binary-install-cache.ts"
  loc: "90"
  note: "`for (const token of value.split(/\\s+/))` uses `token` as a generic string segment rather than a GitHub authentication token."

## Change Scope

- `src/domain/version-token.ts`
- `src/adapters/cache/binary-install-cache.ts`
