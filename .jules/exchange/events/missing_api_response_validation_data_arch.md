---
label: "refacts"
created_at: "2024-03-20"
author_role: "data_arch"
confidence: "high"
---

## Problem

Missing data validation for GitHub API responses. The codebase uses loose type assertions (`as {...}`) instead of explicit schema validation for incoming JSON data from external APIs.

## Goal

Encode invariants at boundaries to rule out invalid states explicitly instead of trusting the external payload via assertions.

## Context

Using `as Type` on `response.json()` circumvents TypeScript's safety guarantees and violates the "Represent Valid States Only" principle. It shifts the burden of validation to implicit runtime failure instead of creating an explicit parsing boundary where invalid data is caught and modeled as an error.

## Evidence

- path: "src/adapters/github/release-asset-api.ts"
  loc: "37"
  note: "`const metadata = (await metadataResponse.json()) as { assets?: Array<{ id: number; name: string }> }` blindly trusts the external payload structure."
- path: "src/adapters/github/github-git-http-username.ts"
  loc: "32"
  note: "`const user = (await response.json()) as { login?: string; type?: string }` uses unsafe type assertions over explicit validation logic."

## Change Scope

- `src/adapters/github/release-asset-api.ts`
- `src/adapters/github/github-git-http-username.ts`
