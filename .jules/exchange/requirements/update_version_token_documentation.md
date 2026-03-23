---
label: "docs"
implementation_ready: true
---

## Goal

Ensure `docs/usage.md` accurately describes the supported version input semantics, explicitly mentioning the optional "v" prefix to eliminate contradiction with the implementation and `docs/configuration/inputs.md`.

## Problem

`docs/usage.md` states the `version` input only supports strict semver strings (e.g., `22.0.1`) and `main`. However, `src/domain/version-token.ts` actively supports strings with a "v" prefix (e.g., `v22.0.1`), a feature correctly documented in `docs/configuration/inputs.md`. This omission causes `docs/usage.md` to be incomplete and contradictory, misleading users reading the primary guide.

## Context

`docs/usage.md` serves as the primary usage guide for the action and its documentation on install modes should be accurate and complete. If a user learns from `docs/usage.md` they will not know that `v` prefix is allowed, even though it is fully supported by the code and documented in the inputs reference.

## Evidence

- source_event: "version_token_drift_consistency.md"
  path: "docs/usage.md"
  loc: "18-21"
  note: "Documents that `version` input accepts two version classes: semver (e.g., `22.0.1`) and `main`."

- source_event: "version_token_drift_consistency.md"
  path: "src/domain/version-token.ts"
  loc: "9"
  note: "Implementation of `extractSemver` strips a leading `v` from the token using `normalized.replace(/^v/, '')` before matching against the semver pattern."

- source_event: "version_token_drift_consistency.md"
  path: "docs/configuration/inputs.md"
  loc: "24-27"
  note: "Correctly documents that the `version` input accepts `semver with a leading v`."

## Change Scope

- `docs/usage.md`

## Constraints

- Documentation must remain declarative.

## Acceptance Criteria

- `docs/usage.md` is updated to include the allowed "v" prefix.
- Examples in `docs/usage.md` reflect the valid syntax without duplicating the entire input reference page.
