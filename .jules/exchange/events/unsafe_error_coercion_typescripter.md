---
label: "bugs"
created_at: "2024-03-20"
author_role: "typescripter"
confidence: "high"
---

## Problem

Errors caught in `catch` blocks are unsafely coerced using `as Error`, ignoring the fact that JavaScript can throw any value (e.g., strings, null, undefined).

## Goal

Properly handle `unknown` errors in `catch` blocks by checking if the caught object is an instance of `Error` before accessing its properties like `.message`, instead of blindly casting it.

## Context

In TypeScript, caught errors are of type `unknown` by default because any value can be thrown. Using `as Error` forces the compiler to treat the value as an `Error` object. If a string or a plain object is thrown, accessing `.message` on it will result in `undefined`, potentially leading to unhelpful error messages or further runtime issues. A safer approach is to use `error instanceof Error` or a utility function to reliably extract a message from an `unknown` error type.

## Evidence

- path: "src/app/install-main-source.ts"
  loc: "line 72"
  note: "Inside the `catch` block for `updateGitHubSubmodules`, the error is formatted into a string by calling `(error as Error).message` without verifying if `error` actually has a `message` property."

## Change Scope

- `src/app/install-main-source.ts`
