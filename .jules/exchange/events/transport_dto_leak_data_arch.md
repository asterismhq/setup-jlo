---
label: "refacts"
created_at: "2024-03-20"
author_role: "data_arch"
confidence: "medium"
---

## Problem

`InstallRequest` couples transport-level variables from `process.env` (e.g. `runnerEnvironment`, `runnerTemp`, `runnerToolCache`, `JLO_ALLOW_DARWIN_X86_64_FALLBACK`) directly into the core installation logic.

## Goal

Ensure `InstallRequest` maps environment-specific inputs to pure domain facts rather than propagating external terminology directly into internal logic.

## Context

Data architecture anti-pattern: "Transport DTOs or persistence types leaking into core domain logic". Passing action runner internals deep into `app/install-release.ts` and `app/install-main-source.ts` via `InstallRequest` blurs the boundary between external execution context and the application core.

## Evidence

- path: "src/action/install-request.ts"
  loc: "5-9"
  note: "Defines properties like `runnerEnvironment`, `runnerTemp`, `runnerToolCache` rather than abstracted path concepts."
- path: "src/adapters/cache/binary-install-cache.ts"
  loc: "12-25"
  note: "`resolveCacheRoot` directly inspects string values like `github-hosted` on the options interface to calculate paths, pulling transport logic into the adapter."

## Change Scope

- `src/action/install-request.ts`
- `src/app/install-release.ts`
- `src/app/install-main-source.ts`
- `src/adapters/cache/binary-install-cache.ts`
