---
label: "docs"
created_at: "2024-05-24"
author_role: "consistency"
confidence: "high"
---

## Problem

Documentation in `docs/configuration/inputs.md` and `action.yml` states that `submodule_token` is not required, but the implementation strictly requires it for `main` install mode.

## Goal

Align the documentation to accurately reflect the implementation's requirement that `submodule_token` must be provided when `version` is set to `main`, or adjust the implementation/action contract if the intent is for it to be optional.

## Context

In `action.yml` and `docs/configuration/inputs.md`, `submodule_token` is listed as optional/not required. However, in `src/app/install-main-source.ts`, the implementation throws an error: `"main install requires submodule_token."` if it is not provided. While it's only required for `main` mode, documenting it globally as `required: false` without clear conditional requirement notes in the tables leads to confusion, and `docs/configuration/access.md` explicitly states it *is* required for `main` mode, creating contradictory documentation.

## Evidence

- path: "action.yml"
  loc: "12"
  note: "Lists `submodule_token` with `required: false`."

- path: "docs/configuration/inputs.md"
  loc: "11"
  note: "Table lists `submodule_token` Required as `no`."

- path: "docs/configuration/access.md"
  loc: "21"
  note: "States `submodule_token` is required for `main` mode."

- path: "src/app/install-main-source.ts"
  loc: "37-39"
  note: "Throws error if `request.submoduleToken` is not provided."

## Change Scope

- `action.yml`
- `docs/configuration/inputs.md`
