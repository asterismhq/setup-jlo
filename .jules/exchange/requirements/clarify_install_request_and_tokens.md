---
label: "refacts"
implementation_ready: false
---

## Goal

Model distinct, guaranteed input structures for different installation modes and resolve the overloaded taxonomy of the word "token" by separating authentication credentials from version specifiers.

## Problem

The term "token" is heavily overloaded in the repository, referring simultaneously to GitHub authentication credentials (`token`, `submodule_token`) and installation version identifiers (`version-token`, `ParsedVersionToken`). This creates conceptual ambiguity in interfaces and variables. Concurrently, these credentials and settings are bundled into a monolithic `InstallRequest` interface that loosely couples properties for fundamentally different operational modes (e.g., `main` builds vs. `release-tag` downloads). This forces the use of optional properties (like `submoduleToken?: string`) and pushes validation logic deep into the application, where scattered assertions verify the presence of required data instead of statically guaranteeing it at the boundary.

## Context

Using an optional `submoduleToken` inside a monolithic install request leads to implicit validation or panics deep in the application logic, violating "Where are invariants enforced: boundaries (preferred) or scattered call sites?". A tagged union or separate request types based on the resolved `InstallMode` would guarantee that when a `main` build is requested, its required configuration is statically guaranteed.

Simultaneously, using the same noun ("token") for two entirely distinct domain concepts leads to ambiguity, especially in function signatures or variable lists where the purpose of `token` must be inferred from context rather than the type or name. The codebase uses `version-token` (action outputs), `token` (auth input), `submodule_token` (auth input), and `ParsedVersionToken` (domain model), creating a confusing shared vocabulary that increases cognitive load for newcomers.

## Evidence

- source_event: "token_concept_overload_taxonomy.md"
  path: "action.yml"
  loc: "inputs.token, outputs.version-token"
  note: "Action input 'token' refers to an authentication credential, while the output is 'version-token'."

- source_event: "token_concept_overload_taxonomy.md"
  path: "src/domain/version-token.ts"
  loc: "type ParsedVersionToken, parseVersionToken()"
  note: "The domain uses 'token' to refer to the unparsed version specifier, such as a semver string or 'main'."

- source_event: "monolithic_install_request_data_arch.md"
  path: "src/action/install-request.ts"
  loc: "line 6"
  note: "`submoduleToken` is defined as optional `submoduleToken?: string` in the unified `InstallRequest`."

- source_event: "monolithic_install_request_data_arch.md"
  path: "src/app/install-main-source.ts"
  loc: "line 37-39"
  note: "Scatter validation: `if (!request.submoduleToken) { throw new Error(...) }` checks for the credential at the usage site rather than enforcing it at the action boundary."

## Change Scope

- `action.yml`
- `src/domain/version-token.ts`
- `src/action/install-request.ts`
- `src/index.ts`
- `src/app/install-main-source.ts`
- `src/app/install-release.ts`
- `src/adapters/process/github-source-git.ts`
- `src/adapters/github/release-asset-api.ts`
- `src/adapters/github/github-git-http-username.ts`

## Constraints

- New names for authentication inputs and version specifiers must not use the ambiguous term "token" and must clearly indicate their respective domain purpose (e.g., `credential`, `auth_token`, `version_specifier`).
- The unified install request object must be replaced with separate specific types or a discriminated union that statically guarantees the required parameters for each install mode without deep null checks.

## Acceptance Criteria

- `InstallRequest` is refactored into distinct structures for source and release installations, rendering deep assertions for optional properties unnecessary.
- The use of the word "token" in `action.yml` outputs and internal typings is replaced with mutually exclusive terms for credentials and version specifiers.
- Domain and app layers correctly enforce the structurally guaranteed properties dictated by the chosen `InstallMode`.
