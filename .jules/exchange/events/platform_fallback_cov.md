---
label: "tests"
created_at: "2026-03-20"
author_role: "cov"
confidence: "high"
---

## Problem

Critical OS/Architecture fallback and parsing logic in `src/domain/platform.ts` lacks test coverage, risking subtle installation failures on edge-case hardware.

## Goal

Improve branch and line coverage for platform detection (`detectPlatformTuple`), specifically targeting the Rosetta ARM64 fallback and OS/Arch normalization failures.

## Context

Platform detection determines which binary asset to download or build. `src/domain/platform.ts` has low line coverage (28.3%) and poor function coverage (20%). The uncovered lines (12-20, 37-69) correspond to the Rosetta detection logic (`detectRosettaArm64`), and the switch statement fallbacks for unsupported OS (`normalizeOs`) and architecture (`normalizeArch`). This logic is a critical decision point for successful `jlo` installation on diverse runner architectures (like Apple Silicon vs Intel Macs). If this logic silently breaks or regresses, it will lead to download errors for the wrong binary or cryptic execution failures.

## Evidence

- path: "src/domain/platform.ts"
  loc: "Lines 37-69"
  note: "Uncovered switch statement defaults in `normalizeOs` and `normalizeArch`. Missing tests for unsupported OS/arch throws."
- path: "src/domain/platform.ts"
  loc: "Lines 12-20"
  note: "Uncovered `detectRosettaArm64` fallback logic which executes `sysctl`. This is a critical branch for Darwin X86_64 to Aarch64 resolution."

## Change Scope

- `src/domain/platform.ts`
- `tests/domain/platform.test.ts`
