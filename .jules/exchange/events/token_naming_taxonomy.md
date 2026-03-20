---
label: "refacts"
created_at: "2024-05-20"
author_role: "taxonomy"
confidence: "high"
---

## Problem

The internal naming of GitHub tokens in `InstallRequest` (`installToken`, `installSubmoduleToken`) diverges from the public input names (`token`, `submodule_token`). The prefix `install` implies a specific lifecycle phase, but `token` is just an access token used across all phases (metadata fetch, download, clone).

## Goal

Align internal token property names in `InstallRequest` with the public input names (`token`, `submoduleToken`), removing the unnecessary `install` prefix that incorrectly scopes their purpose.

## Context

In `action.yml`, the inputs are `token` and `submodule_token`. In `src/action/install-request.ts`, these are mapped to `installToken` and `installSubmoduleToken`. The "install" prefix adds no clarity since everything happens within an "install" action, and it diverges from standard GitHub action conventions where internal properties mirror input names.

## Evidence

- path: "src/action/install-request.ts"
  loc: "lines 2-3, 16-17"
  note: "Defines `installToken` and `installSubmoduleToken` properties."
- path: "action.yml"
  loc: "lines 4, 10"
  note: "Defines the inputs simply as `token` and `submodule_token`."

## Change Scope

- `src/action/install-request.ts`
- `src/app/install-main-source.ts`
- `src/app/install-release.ts`
- `tests/action/install-request.test.ts`
