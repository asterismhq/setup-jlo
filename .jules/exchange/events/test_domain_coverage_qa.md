---
label: "tests"
created_at: "2024-03-20"
author_role: "qa"
confidence: "high"
---

## Problem

Missing tests for `domain/repository-slug.ts` and `action/inputs.ts`, `action/outputs.ts`.

## Goal

Add isolated unit tests for `repository-slug.ts` parsing logic, and `action/inputs.ts`, `action/outputs.ts` core wrapping.

## Context

The core domain logic for parsing repository slugs is not tested. Additionally, the wrapper logic around `@actions/core` input/output parsing could use testing to verify the exception throwing for missing required inputs.

## Evidence

- path: "tests/domain"
  loc: "directory contents"
  note: "Tests for `repository-slug.ts` are missing."
- path: "src/domain/repository-slug.ts"
  loc: "entire file"
  note: "Contains logic for splitting and parsing slugs which can throw errors, and should be tested."
- path: "tests/action"
  loc: "directory contents"
  note: "Tests for `inputs.ts` and `outputs.ts` are missing."
- path: "src/action/inputs.ts"
  loc: "entire file"
  note: "Contains logic for validation of action inputs that will throw an error if missing."
- path: "src/action/outputs.ts"
  loc: "entire file"
  note: "Contains logic for setting outputs that should be verified against `@actions/core` boundaries."

## Change Scope

- `tests/domain/repository-slug.test.ts`
- `tests/action/inputs.test.ts`
- `tests/action/outputs.test.ts`
