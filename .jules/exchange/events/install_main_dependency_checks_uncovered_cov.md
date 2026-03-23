---
label: "tests"
created_at: "2024-05-18"
author_role: "cov"
confidence: "high"
---

## Problem

The initial dependency checks for `cargo` and `git` in the `installMainSource` function are completely untested.

## Goal

Add tests to verify that appropriate errors are thrown when either `cargo` or `git` is missing from the system PATH before attempting to install from the main source.

## Context

The `installMainSource` function expects both `cargo` and `git` to be available. If they are absent, the code correctly throws descriptive errors to help users provision their runners. However, these specific error branches are not exercised by tests. As these are the first actions in the function, it is important to ensure their continued correctness to prevent confusing runtime failures for end users. The coverage report flags lines 28-31 and 33-34 in `src/app/install-main-source.ts`.

## Evidence

- path: "src/app/install-main-source.ts"
  loc: "28-31"
  note: "The check for `cargo` and its associated thrown error are uncovered."
- path: "src/app/install-main-source.ts"
  loc: "33-34"
  note: "The check for `git` and its associated thrown error are uncovered."

## Change Scope

- `src/app/install-main-source.ts`
- `tests/app/install-main-source.test.ts`
