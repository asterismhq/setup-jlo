---
label: "docs"
created_at: "2024-05-24"
author_role: "consistency"
confidence: "high"
---

## Problem

`docs/usage.md` documents that the `version` input only accepts semver (e.g. `22.0.1`) and `main`. However, the implementation in `src/domain/version-token.ts` also allows a "v" prefix (e.g. `v22.0.1`), which is correctly documented in `docs/configuration/inputs.md`. This creates a contradiction between documentation sources and means `docs/usage.md` is incomplete.

## Goal

Update `docs/usage.md` to accurately reflect the implemented version token semantics, mentioning the allowed `v` prefix, so that it matches both the implementation and `docs/configuration/inputs.md`.

## Context

`docs/usage.md` serves as the primary usage guide for the action and its documentation on install modes should be accurate and complete. If a user learns from `docs/usage.md` they will not know that `v` prefix is allowed, even though it is fully supported by the code and documented in the inputs reference.

## Evidence

- path: "docs/usage.md"
  loc: "18-21"
  note: "Documents that `version` input accepts two version token classes: semver (e.g., `22.0.1`) and `main`."

- path: "src/domain/version-token.ts"
  loc: "9"
  note: "Implementation of `extractSemver` strips a leading `v` from the token using `normalized.replace(/^v/, '')` before matching against the semver pattern."

- path: "docs/configuration/inputs.md"
  loc: "24-27"
  note: "Correctly documents that the `version` input accepts `semver with a leading v`."

## Change Scope

- `docs/usage.md`
