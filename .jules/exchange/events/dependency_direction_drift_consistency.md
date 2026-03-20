---
label: "docs"
created_at: "2024-03-20"
author_role: "consistency"
confidence: "high"
---

## Problem

The documentation in `docs/architecture.md` incorrectly documents the dependency direction. `action -> domain` is specified but no files in `src/action` import from `src/domain`. In contrast, files in `src/app` import from `src/action`.

## Goal

Update the dependency direction in `docs/architecture.md` to accurately reflect the actual import relationships between the runtime boundaries.

## Context

The architecture documentation explicitly models dependency direction to enforce purity and layering. Specifically, it lists `action -> domain` but code grep confirms `src/action` does not import from `src/domain`. Additionally, the file `src/app/install-main-source.ts` and `src/app/install-release.ts` both import `InstallRequest` from `src/action/install-request.ts`.

## Evidence

- path: "docs/architecture.md"
  loc: "32"
  note: "Documents `action -> domain`, which is incorrect based on `src/action` imports."

- path: "src/action"
  loc: "directory"
  note: "Files inside `src/action/` do not import anything from `src/domain/`."

- path: "src/app/install-main-source.ts"
  loc: "4"
  note: "Imports `InstallRequest` from `../action/install-request.ts`, which indicates an `app -> action` dependency not documented in `docs/architecture.md`."

- path: "src/app/install-release.ts"
  loc: "8"
  note: "Imports `InstallRequest` from `../action/install-request.ts`, supporting the `app -> action` dependency."

## Change Scope

- `docs/architecture.md`
