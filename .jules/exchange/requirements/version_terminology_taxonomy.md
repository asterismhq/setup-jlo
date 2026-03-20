---
label: "refacts"
implementation_ready: false
---

## Goal

Align terminology across the codebase: ensure the internal and output models agree on the name `release-tag`, and standardize the internal variable names to avoid overloading the word `token`.

## Context

Consolidated context from source events.

## Problem

The concept of "version token" and "install mode" is inconsistent (`release` internally vs `release-tag` in outputs). Furthermore, `src/index.ts` overloads the word `token` as both the GitHub API token and the requested installation version.

## Evidence

- source_event: "version_token_taxonomy.md"
  path: "src/domain/version-token.ts"
  loc: "line 2"
  note: "Defines the internal kind as `release` instead of matching `release-tag`."

- source_event: "version_token_taxonomy.md"
  path: "src/index.ts"
  loc: "line 19"
  note: "Explicitly maps `release` to `release-tag` for the install mode."

- source_event: "version_token_taxonomy.md"
  path: "action.yml"
  loc: "line 15"
  note: "Documents `release-tag` as the resolved installation mode."

- source_event: "version_variable_taxonomy.md"
  path: "src/index.ts"
  loc: "line 8"
  note: "`resolveInstallMode(token: string)` uses `token` for the version."

- source_event: "version_variable_taxonomy.md"
  path: "src/index.ts"
  loc: "lines 14-15"
  note: "`readRequiredInput('token')` vs `readRequiredInput('version')` where one is called `token` and the other `versionToken`."

## Change Scope

- `src/domain/version-token.ts`
- `src/index.ts`
- `src/action/outputs.ts`
- `action.yml`
- `docs/configuration/inputs.md`
- `docs/usage.md`

## Constraints

- Output values must not break backward compatibility (if `release-tag` is currently the expected output string, the internal enum should align to that).
- Use `versionToken` or `versionInput` for version parameters, avoiding `token` unless referring to a GitHub authentication token.

## Acceptance Criteria

- `ParsedVersionToken.kind` correctly maps to `release-tag` and `main` consistently.
- Variable names in `src/index.ts` related to the installation version are consistently named `versionToken` (or similar).
- Documentation correctly matches the updated uniform terminology.
