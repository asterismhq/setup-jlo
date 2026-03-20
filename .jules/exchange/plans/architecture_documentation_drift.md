---
label: "docs"
---

## Goal

Update the documentation in `docs/architecture.md` to accurately reflect the actual import relationships between the runtime boundaries and outline the correct test boundaries.

## Current State

The documentation in `docs/architecture.md` is drifted from the actual implementation truth in the following ways:
- `docs/architecture.md`: Incorrectly documents the dependency direction (`action -> domain` instead of `app -> action`) in the "Dependency Direction" section, which conflicts with actual imports in `src/app/install-main-source.ts` and `src/app/install-release.ts` importing from `src/action/`.
- `docs/architecture.md`: Omits the `tests/adapters` directory from its list of repository-owned boundary tests in the "Repository Boundary" and "Reusable Baseline" sections, even though `tests/adapters/` exists and contains tests.

## Plan

1. Update `docs/architecture.md` dependency direction section:
   - Change `action -> domain` to `app -> action` to match the real import graph where `src/app/` depends on `src/action/`.
   - Ensure the dependency graph text accurately reflects this `app -> action` edge.
2. Update `docs/architecture.md` test boundaries:
   - In the "Repository Boundary" section, add `tests/adapters` to the list of boundary tests alongside `tests/action`, `tests/app`, and `tests/domain`.
   - In the "Reusable Baseline" section, append `tests/adapters` to the list of boundary-owned tests.

## Acceptance Criteria

- `docs/architecture.md` lists the dependency directions matching the actual import graph (specifically replacing `action -> domain` with `app -> action`).
- `docs/architecture.md` documents `tests/adapters` as a recognized directory for repository-owned boundary tests in both the "Repository Boundary" and "Reusable Baseline" sections.

## Risks

- Updating dependency directions in documentation might overlook other implicit dependencies if the module boundaries evolve; ongoing validation of the import graph against the documented architecture is required to prevent future drift.
- Missing updates in other docs references to testing boundaries might leave scattered inconsistencies, though current analysis bounds the issue to `docs/architecture.md`.