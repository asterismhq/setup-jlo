---
label: "tests"
implementation_ready: false
---

## Goal

Add isolated unit tests for `repository-slug.ts`, `action/inputs.ts`, and `action/outputs.ts`, and improve coverage for platform detection logic (`detectPlatformTuple`), particularly OS/Architecture fallbacks and Rosetta detection.

## Context

Consolidated context from source events.

## Problem

Missing tests for core domain logic (`repository-slug.ts`) and action wrappers (`inputs.ts`, `outputs.ts`). Additionally, critical OS/Architecture fallback and parsing logic in `src/domain/platform.ts` lacks test coverage, which risks silent failures on diverse architectures.

## Evidence

- source_event: "test_domain_coverage_qa.md"
  path: "tests/domain"
  loc: "directory contents"
  note: "Tests for `repository-slug.ts` are missing."

- source_event: "test_domain_coverage_qa.md"
  path: "tests/action"
  loc: "directory contents"
  note: "Tests for `inputs.ts` and `outputs.ts` are missing."

- source_event: "platform_fallback_cov.md"
  path: "src/domain/platform.ts"
  loc: "lines 37-69"
  note: "Uncovered switch statement defaults in `normalizeOs` and `normalizeArch`. Missing tests for unsupported OS/arch throws."

- source_event: "platform_fallback_cov.md"
  path: "src/domain/platform.ts"
  loc: "lines 12-20"
  note: "Uncovered `detectRosettaArm64` fallback logic which executes `sysctl`."

## Change Scope

- `tests/domain/repository-slug.test.ts`
- `tests/action/inputs.test.ts`
- `tests/action/outputs.test.ts`
- `src/domain/platform.ts`
- `tests/domain/platform.test.ts`

## Constraints

- Mocks for `@actions/core` must correctly simulate input requirements and output settings.
- Platform tests must stub Node.js `process.platform` and `process.arch` safely, or mock specific functions used for detection.

## Acceptance Criteria

- `repository-slug.ts` has tests validating parsing logic and error throws on invalid slugs.
- `inputs.ts` and `outputs.ts` are tested for proper `@actions/core` interactions and required value enforcement.
- `platform.ts` tests cover missing switch defaults (throwing for unsupported OS/Arch) and the `detectRosettaArm64` execution path.
