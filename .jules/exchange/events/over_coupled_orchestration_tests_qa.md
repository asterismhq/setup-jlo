---
label: "tests"
created_at: "2024-05-24"
author_role: "qa"
confidence: "high"
---

## Problem

Application orchestration tests are over-coupled to internal implementation details, mocking up to 18 individual dependencies per file. This makes the tests extremely brittle and tightly bound to the current implementation structure, defeating their purpose as behavior verifiers.

## Goal

Refactor the orchestration boundaries to reduce mocking. Tests should validate externally visible behavior using fakes or by observing the boundary of side effects (I/O, network, process execution) rather than mocking every internal function call.

## Context

The `installMainSource` and `installReleaseVersion` tests mock large numbers of `node:fs`, `node:os`, domain functions, and adapter functions. This is a recognized anti-pattern ("Over-coupling tests to private implementation details") as any minor refactor in the dependencies or their usage will break the tests, reducing recovery cost optimization and increasing maintenance overhead.

## Evidence

- path: "tests/app/install-main-source.test.ts"
  loc: "line 4"
  note: "Mocks 18 internal dependencies including standard library functions (`existsSync`, `mkdtempSync`) and custom adapters (`cloneGitHubBranch`, `detectPlatformTuple`, etc.)"

- path: "tests/app/install-release.test.ts"
  loc: "line 4"
  note: "Mocks 17 internal dependencies, heavily coupling the test to the implementation details instead of testing external behavior."

## Change Scope

- `tests/app/install-main-source.test.ts`
- `tests/app/install-release.test.ts`
