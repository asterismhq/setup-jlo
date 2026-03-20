---
label: "refacts"
created_at: "2024-03-20"
author_role: "qa"
confidence: "medium"
---

## Problem

Application orchestration tests over-couple to adapter mock internals rather than observable behavior boundaries.

## Goal

Refactor `install-main-source.test.ts` and `install-release.test.ts` to assert observable state changes or explicitly defined adapter boundary contracts rather than tracking every mock call and argument strictly.

## Context

The `install-main-source.test.ts` and `install-release.test.ts` files mock almost every imported dependency and then assert that those mocks were called with specific arguments. This tightly couples the tests to the internal implementation details of the orchestration logic. Refactoring the implementation (e.g., changing how a dependency is used or replacing it entirely) will break the test even if the overall observable behavior remains correct.

## Evidence

- path: "tests/app/install-main-source.test.ts"
  loc: "lines 8-46, 75-92"
  note: "Massive mocking of adapters and assertions tightly bound to `toHaveBeenCalledWith` arguments across internal dependencies."
- path: "tests/app/install-release.test.ts"
  loc: "lines 4-31, 56-65"
  note: "Similar heavy mocking and strict assertion on internal adapter calls rather than external outcome or boundary definition."

## Change Scope

- `tests/app/install-main-source.test.ts`
- `tests/app/install-release.test.ts`
