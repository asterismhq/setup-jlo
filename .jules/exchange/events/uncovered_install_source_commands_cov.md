---
label: "tests"
created_at: "2024-05-20"
author_role: "cov"
confidence: "high"
---

## Problem

The logic checking for missing `cargo` and `git` binaries on `installMainSource` and `installReleaseVersion` branches is missing test coverage.

## Goal

Add tests to ensure `installMainSource` and `installReleaseVersion` fail fast and clearly when required build dependencies (cargo, git) or extraction tools are not available on the runner.

## Context

Coverage tests show missing line coverage in `src/app/install-main-source.ts` lines 28-31, 33-34, and `src/app/install-release.ts` lines 76-79. These specific areas handle throwing errors when `cargo` or `git` are missing. Without these tests, a regression might accidentally swallow missing command errors, leading to obscure failures later in the GitHub Action run.

## Evidence

- path: "src/app/install-main-source.ts"
  loc: "28-31, 33-34"
  note: "Branches handling missing `cargo` or `git` commands lack tests."
- path: "src/app/install-release.ts"
  loc: "76-79"
  note: "These lines are related to the final steps of `installReleaseVersion` including pruning sibling install directories and installing the binary on path, but they are not executed in tests."

## Change Scope

- `src/app/install-main-source.ts`
- `tests/app/install-main-source.test.ts`
- `src/app/install-release.ts`
- `tests/app/install-release.test.ts`
