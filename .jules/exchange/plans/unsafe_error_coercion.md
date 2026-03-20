---
label: "bugs"
---

## Goal

Ensure that `unknown` caught errors in `src/app/install-main-source.ts` are safely evaluated by verifying they are an `Error` instance before accessing `.message`, replacing the current unsafe `(error as Error)` coercion.

## Current State

The current implementation blindly casts caught errors without verifying their actual runtime type, leading to potential secondary runtime failures if non-`Error` values are thrown.
- `src/app/install-main-source.ts`: The `catch` block wrapping `updateGitHubSubmodules` attempts to extract the error's message with `(error as Error).message`. If the thrown value is a string, primitive, or an object lacking a `message` property, this will evaluate to `undefined` or throw a `TypeError`, obscuring the original failure reason and breaking the predictable error reporting boundary.
- `tests/app/install-main-source.test.ts`: Missing test coverage for the failure path when `updateGitHubSubmodules` throws a non-`Error` value (e.g., a primitive string).

## Plan

1. Update `src/app/install-main-source.ts` inside the `catch` block for `updateGitHubSubmodules` to verify if `error instanceof Error`. If it is, append `error.message` to the thrown `Error`. If it is not, safely serialize the value using `String(error)`.
2. Update `tests/app/install-main-source.test.ts` to add a new test case that mocks `updateGitHubSubmodules` to throw a non-`Error` value (such as a plain string) and asserts that the resulting thrown `Error` contains the correctly serialized string instead of crashing or returning `undefined`.

## Acceptance Criteria

- `src/app/install-main-source.ts` no longer contains the unsafe `(error as Error)` coercion.
- The `catch` block correctly formats both `Error` instances and non-`Error` primitives thrown by `updateGitHubSubmodules`.
- The test suite includes a test specifically verifying the fallback behavior for non-`Error` thrown values.

## Risks

- If a thrown object overrides `toString()` to return a non-informative value like `[object Object]`, using `String(error)` may log a less useful message. However, this is structurally safer than causing a secondary exception and satisfies standard TypeScript best practices for `unknown` errors.
