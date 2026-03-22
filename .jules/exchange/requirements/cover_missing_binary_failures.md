---
label: "tests"
implementation_ready: true
---

## Goal

Ensure `installMainSource` branches that check for required binaries like `cargo` or `git` are tested thoroughly, fast-failing, and correctly asserting missing tool errors.

## Problem

The logic checking for missing `cargo` and `git` binaries on `installMainSource` branches is missing test coverage. Specifically, `installMainSource` lines 28-31, 33-34. Without these tests, a regression might accidentally swallow missing command errors, leading to obscure failures later in the run.

## Evidence

- source_event: "uncovered_install_source_commands_cov.md"
  path: "src/app/install-main-source.ts"
  loc: "28-31, 33-34"
  note: "Branches handling missing `cargo` or `git` commands lack tests."

## Change Scope

- `src/app/install-main-source.ts`
- `tests/app/install-main-source.test.ts`

## Constraints

- Test files must appropriately isolate environment calls checking for the tools' presence to reliably simulate these failure cases.

## Acceptance Criteria

- Code coverage metrics on missing tool errors are fully resolved.
- Tests assert specific missing tool error messages.
