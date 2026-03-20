---
label: "tests"
created_at: "2026-03-20"
author_role: "cov"
confidence: "high"
---

## Problem

The error paths in `src/adapters/github/github-git-http-username.ts` are heavily under-tested, creating a blind spot for GitHub token authentication failures.

## Goal

Ensure that test coverage for GitHub HTTP username resolution adequately covers critical failure modes (401, 403, and JSON parsing failures) to prevent silent auth regressions.

## Context

The module `src/adapters/github/github-git-http-username.ts` is responsible for fetching the username associated with a GitHub token. This is a critical security and authentication boundary for cloning `jlo` source code or fetching submodules. The test coverage report shows that lines 21-24, 27-30, and 41-44 are uncovered. These correspond directly to the HTTP error response handling (401/403 and non-ok statuses) and missing username field handling. If changes break these error paths, the action may fail with opaque, unhelpful errors or retry infinitely instead of bubbling up a clear authorization error.

## Evidence

- path: "src/adapters/github/github-git-http-username.ts"
  loc: "Lines 21-24"
  note: "Uncovered error block for handling 401/403 responses. Missing tests for expired/unauthorized tokens."
- path: "src/adapters/github/github-git-http-username.ts"
  loc: "Lines 27-30"
  note: "Uncovered error block for handling non-ok HTTP statuses (e.g., 500). Missing tests for API failures."
- path: "src/adapters/github/github-git-http-username.ts"
  loc: "Lines 41-44"
  note: "Uncovered error block for when the API returns a response without a usable login. Missing tests for invalid payloads."

## Change Scope

- `src/adapters/github/github-git-http-username.ts`
- `tests/adapters/github-git-http-username.test.ts`
