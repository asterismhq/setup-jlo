---
label: "refacts"
created_at: "2024-05-20"
author_role: "taxonomy"
confidence: "high"
---

## Problem

The concept of "version token" and "install mode" is inconsistent. The input `version` refers to a version token, but the output `install-mode` uses `release-tag` while the internal representation `ParsedVersionToken.kind` uses `release`. The `version-token` output has a hyphen, while `version` does not.

## Goal

Align the terminology for version/install modes across the codebase, specifically aligning `release` and `release-tag`.

## Context

The codebase uses `release` as the internal kind for a parsed version token in `src/domain/version-token.ts` but the public `install-mode` output exposes `release-tag`. `src/index.ts` has a specific mapping for this (`parsedVersion.kind === 'release' ? 'release-tag' : 'main'`). `action.yml` uses `release-tag`. This creates a conceptual divergence between the domain layer and the action output layer.

## Evidence

- path: "src/domain/version-token.ts"
  loc: "line 2"
  note: "Defines the internal kind as `release`."
- path: "src/index.ts"
  loc: "line 19"
  note: "Explicitly maps `release` to `release-tag` for the install mode."
- path: "action.yml"
  loc: "line 15"
  note: "Documents `release-tag` as the resolved installation mode."

## Change Scope

- `src/domain/version-token.ts`
- `src/index.ts`
- `src/action/outputs.ts`
- `action.yml`
- `docs/configuration/inputs.md`
- `docs/usage.md`
