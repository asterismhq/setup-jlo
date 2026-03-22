---
label: "docs"
implementation_ready: false
---

## Goal

Align the documentation to accurately reflect the implementation's requirement that `submodule_token` must be provided when `version` is set to `main`, or adjust the implementation/action contract if the intent is for it to be optional.

## Problem

Documentation in `docs/configuration/inputs.md` and `action.yml` states that `submodule_token` is not required, but the implementation strictly requires it for `main` install mode. This contradicts `docs/configuration/access.md`, which states it is required for `main`.

## Evidence

- source_event: "submodule_token_required_drift_consistency.md"
  path: "action.yml"
  loc: "12"
  note: "Lists `submodule_token` with `required: false`."
- source_event: "submodule_token_required_drift_consistency.md"
  path: "docs/configuration/inputs.md"
  loc: "11"
  note: "Table lists `submodule_token` Required as `no`."
- source_event: "submodule_token_required_drift_consistency.md"
  path: "docs/configuration/access.md"
  loc: "21"
  note: "States `submodule_token` is required for `main` mode."
- source_event: "submodule_token_required_drift_consistency.md"
  path: "src/app/install-main-source.ts"
  loc: "37-39"
  note: "Throws error if `request.submoduleToken` is not provided."

## Change Scope

- `action.yml`
- `docs/configuration/inputs.md`

## Constraints

- Documentation must cleanly represent context-specific required logic directly in summary tables/interfaces.

## Acceptance Criteria

- `submodule_token` is explicitly marked required for `main` usage across documentation and Action interface definitions.
