---
label: "tests"
created_at: "2026-03-20"
author_role: "cov"
confidence: "high"
---

## Problem

Crucial execution paths within `src/app/install-release.ts` and `src/app/install-main-source.ts` lack robust coverage, especially around error conditions and the actual file operations.

## Goal

Ensure that tests exist for core application flows, particularly caching hits/misses, and failure modes during git/cargo operations or binary fetching.

## Context

The main installation logic for `setup-jlo` dictates either a source build or fetching a release asset. Currently, both modules (`src/app/install-main-source.ts` and `src/app/install-release.ts`) demonstrate large coverage gaps (`install-release.ts` at 55.55% and `install-main-source.ts` at 88.23%). The missing lines (such as `install-release.ts` lines 48-59, 67-81 and `install-main-source.ts` lines 30-33, 93-96) relate directly to downloading/building failure modes, temporary directory management, and caching checks. These are the highest-risk workflows in the tool; incomplete coverage implies that file IO or git failures might not be caught, leaving behind bad state or unhelpful error messages.

## Evidence

- path: "src/app/install-release.ts"
  loc: "Lines 48-59, 67-81"
  note: "Uncovered error branches regarding empty download sizes, and temp dir cleanup logic on failures."
- path: "src/app/install-main-source.ts"
  loc: "Lines 30-33, 93-96"
  note: "Uncovered error paths for when submodule tokens are absent, or when git submodule updates fail."

## Change Scope

- `src/app/install-release.ts`
- `tests/app/install-release.test.ts`
- `src/app/install-main-source.ts`
- `tests/app/install-main-source.test.ts`
