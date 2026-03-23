---
label: "refacts"
created_at: "2025-03-23"
author_role: "taxonomy"
confidence: "high"
---

## Problem

The term "token" is heavily overloaded across the repository, simultaneously representing both a GitHub authentication credential (e.g., `token`, `submodule_token`) and an installation target identifier or parsed version (e.g., `version-token`, `ParsedVersionToken`).

## Goal

Establish distinct and mutually exclusive terminology for authentication credentials (e.g., `credential`, `auth_token`, `secret`) versus installation identifiers (e.g., `version_specifier`, `install_target`, `version_string`).

## Context

Using the same noun for two entirely distinct domain concepts leads to ambiguity, especially in function signatures or variable lists where the purpose of `token` must be inferred from context rather than the type or name. The codebase uses `version-token` (action outputs), `token` (auth input), `submodule_token` (auth input), and `ParsedVersionToken` (domain model), creating a confusing shared vocabulary that increases cognitive load for newcomers.

## Evidence

- path: "action.yml"
  loc: "inputs.token, outputs.version-token"
  note: "Action input 'token' refers to an authentication credential, while the output is 'version-token'."
- path: "src/domain/version-token.ts"
  loc: "type ParsedVersionToken, parseVersionToken()"
  note: "The domain uses 'token' to refer to the unparsed version specifier, such as a semver string or 'main'."
- path: "src/action/install-request.ts"
  loc: "interface InstallRequest { token: string; submoduleToken?: string; }"
  note: "The action layer uses 'token' and 'submoduleToken' exclusively as authentication strings for API requests and Git cloning."

## Change Scope

- `action.yml`
- `src/domain/version-token.ts`
- `src/action/install-request.ts`
- `src/index.ts`
- `src/adapters/process/github-source-git.ts`
- `src/adapters/github/release-asset-api.ts`
- `src/adapters/github/github-git-http-username.ts`
