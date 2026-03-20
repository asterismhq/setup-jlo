---
label: "refacts"
created_at: "2024-05-20"
author_role: "taxonomy"
confidence: "high"
---

## Problem

In `src/index.ts`, `resolveInstallMode` uses `token` as the parameter name for the version input, while `run()` uses `versionToken` for the same concept. Furthermore, `token` in `run()` refers to the GitHub token (`readRequiredInput('token')`). This overloads the word "token" within the same file for two entirely different concepts (a GitHub API token vs a version string).

## Goal

Standardize the naming for the "version token" concept to consistently use `versionToken` or `versionInput` throughout `src/index.ts`, ensuring it is not confused with the GitHub `token` input.

## Context

The word "token" is overloaded. The `token` action input represents a GitHub personal access token or `GITHUB_TOKEN`. The `version` action input represents what the docs and code call a "version token" (e.g. `23.0.0` or `main`). Using `token` to refer to both in the same file hurts readability and refactor safety.

## Evidence

- path: "src/index.ts"
  loc: "line 8"
  note: "`export function resolveInstallMode(token: string)` uses `token` for the version."
- path: "src/index.ts"
  loc: "line 14"
  note: "`const token = readRequiredInput('token')` uses `token` for the GitHub token."
- path: "src/index.ts"
  loc: "line 15"
  note: "`const versionToken = readRequiredInput('version')` uses `versionToken` for the version."

## Change Scope

- `src/index.ts`
