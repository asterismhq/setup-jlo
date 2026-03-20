---
label: "bugs"
created_at: "2024-03-20"
author_role: "typescripter"
confidence: "high"
---

## Problem

External HTTP JSON responses are blindly trusted and cast with `as Type`, circumventing the TypeScript type system's ability to guarantee runtime safety.

## Goal

Validate untrusted external JSON data at the boundary using a schema validator (like Zod) or type guards before allowing it into the typed core of the application, replacing unsafe `as Type` assertions.

## Context

TypeScript types are erased at runtime. When fetching data from an external API, using `as Type` on the JSON response provides a false sense of security (type illusion). If the API changes or returns unexpected data, the application will fail unpredictably later rather than failing fast at the boundary where the untrusted data enters. This violates the principle of validating external inputs before trusting types.

## Evidence

- path: "src/adapters/github/release-asset-api.ts"
  loc: "line 36"
  note: "The response from `https://api.github.com/repos/${owner}/${repo}/releases/tags/${options.tagVersion}` is parsed using `await metadataResponse.json()` and immediately cast using `as { assets?: Array<{ id: number; name: string }> }` without any runtime validation."

- path: "src/adapters/github/github-git-http-username.ts"
  loc: "line 29"
  note: "The response from `GITHUB_API_USER_URL` is parsed using `await response.json()` and immediately cast using `as { login?: string; type?: string }` without any runtime validation."

## Change Scope

- `src/adapters/github/release-asset-api.ts`
- `src/adapters/github/github-git-http-username.ts`
