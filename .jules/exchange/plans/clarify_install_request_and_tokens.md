---
label: "refacts"
---

## Goal

Model distinct, guaranteed input structures for different installation modes and resolve the overloaded taxonomy of the word "token" by separating authentication credentials from version specifiers.

## Current State

The term "token" is heavily overloaded, referring to both GitHub authentication credentials and installation version identifiers. Concurrently, credentials and settings are bundled into a monolithic `InstallRequest` interface that loosely couples properties for fundamentally different operational modes, forcing validation deep into the application.
- `action.yml`: Action input `token` refers to an authentication credential, while the output is `version-token`.
- `src/domain/version-token.ts`: The domain uses "token" to refer to the unparsed version specifier, such as a semver string or "main".
- `src/action/install-request.ts`: `submoduleToken` is defined as optional `submoduleToken?: string` in the unified `InstallRequest`.
- `src/app/install-main-source.ts`: Scatter validation: `if (!request.submoduleToken) { throw new Error(...) }` checks for the credential at the usage site rather than enforcing it at the action boundary.

## Plan

1. Rename `token` to `credential` and `submodule_token` to `submodule_credential` in `action.yml` inputs. Rename `version-token` to `version-specifier` in `action.yml` outputs. Update `src/action/inputs.ts` and `src/action/outputs.ts` accordingly.
2. Rename `src/domain/version-token.ts` to `src/domain/version-specifier.ts`. Rename internal types like `ParsedVersionToken` to `ParsedVersionSpecifier` and `parseVersionToken` to `parseVersionSpecifier`.
3. Refactor `InstallRequest` in `src/action/install-request.ts` into a discriminated union based on the resolved `InstallMode` (`release-tag` vs `main`). Make `submoduleCredential` a required, non-optional property of the `main` mode request structure.
4. Update `src/index.ts` to parse inputs, resolve the `InstallMode`, and construct the specific `InstallRequest` variant, moving validation of mode-specific requirements to the boundary.
5. Remove deep runtime checks for optional properties (e.g., `!request.submoduleToken`) in `src/app/install-main-source.ts`, relying instead on the statically guaranteed types from the `InstallRequest` union. Update `src/app/install-release.ts` as needed.
6. Replace the word "token" with "credential" in parameter typings and local variable names across `src/adapters/process/github-source-git.ts`, `src/adapters/github/release-asset-api.ts`, and `src/adapters/github/github-git-http-username.ts`.
7. Update all affected tests (e.g., in `tests/action`, `tests/domain`, `tests/app`) to verify the new boundary-enforced invariants and to reflect the renamed components (`credential`, `version-specifier`).
8. Update documentation in `docs/usage.md` and `docs/configuration/inputs.md` to reflect the new input and output names, ensuring the vocabulary clearly distinguishes between credentials and version specifiers.

## Acceptance Criteria

- `InstallRequest` is refactored into distinct structures for source and release installations, rendering deep assertions for optional properties unnecessary.
- The use of the word "token" in `action.yml` outputs and internal typings is replaced with mutually exclusive terms for credentials and version specifiers.
- Domain and app layers correctly enforce the structurally guaranteed properties dictated by the chosen `InstallMode`.

## Risks

- Action consumers will experience breaking changes due to renamed `action.yml` inputs and outputs (`token` to `credential`, `submodule_token` to `submodule_credential`, `version-token` to `version-specifier`).
- Removing deep validation might lead to unexpected failures if boundary enforcement incorrectly constructs the `InstallRequest`.
