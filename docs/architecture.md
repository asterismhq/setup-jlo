# Architecture

## Repository Boundary

`setup-astm` is a single-action repository. The repository owns GitHub Actions execution for installing `astm`; it does not own `astm` release production or the control-plane workflow generation that chooses the version ref.

The repository surfaces are:

- `action.yml`: public action contract
- `src/`: TypeScript runtime organized by action, app, domain, adapters, and catalog boundaries
- `dist/`: committed package output refreshed only by release automation
- `tests/`: repository-owned boundary tests under `tests/action`, `tests/adapters`, `tests/app`, and `tests/domain`

## Runtime Boundaries

The runtime boundaries are:

- `src/index.ts`: bootstrap and top-level orchestration only
- `src/action/`: action boundary input reading, output emission, and install-request normalization
- `src/app/`: release and main-source use-case orchestration
- `src/domain/`: pure version ref parsing, platform normalization, and repository-slug parsing
- `src/adapters/`: cache, GitHub API, and process integrations
- `src/catalog/`: repository-specific constants for the upstream `astm` source

## Dependency Direction

Runtime dependencies follow this direction:

```text
index -> app -> domain
index -> action
app -> action
app -> adapters
app -> catalog
adapters -> domain
catalog -> none
domain -> none
```

`domain` remains pure and does not depend on `action`, `app`, `adapters`, or `catalog`.

## Runtime Execution Flow

The action runtime executes this sequence:

1. Read required and optional action inputs.
2. Parse the `version` input as either a semver release or `main`.
3. Normalize an install request from inputs and runtime environment.
4. Execute one install path:
   - semver: query release metadata, select the matching `astm-*` asset, download it, and install it into the cache
   - `main`: resolve the `main` head SHA, reuse a matching cached build when present, otherwise clone the source repository, fetch required submodules, build `astm`, and install the resulting binary into the cache
5. Add the resolved install directory to `GITHUB_PATH`.

## Ownership Split

The current ownership split is:

- `astm`: version-ref contract, workflow generation that embeds the version input, and runtime binary release assets
- `setup-astm`: GitHub Actions executor for release and `main` installation
- consumer repositories: workflow definitions, secrets, and access settings required to run the private action

## Cache Model

The cache root resolves in this order:

- `ASTM_CACHE_ROOT` when explicitly set
- `RUNNER_TEMP/astm-bin-cache` on GitHub-hosted runners
- `RUNNER_TOOL_CACHE/astm-bin-cache` when present on self-hosted runners
- `~/.cache/astm-bin-cache` or `/tmp/astm-bin-cache` as the final local fallback

Platform directories are keyed by normalized operating system and architecture. Install directories are keyed by either the release tag or the resolved `main` source SHA prefix. Sibling install directories are pruned after a successful install for the same platform.

## Reusable Baseline

The repository demonstrates a reusable TypeScript GitHub Action baseline:

- `action.yml`
- minimal `src/index.ts` bootstrap
- boundary-owned runtime directories (`src/action`, `src/app`, `src/domain`, `src/adapters`)
- boundary-owned tests (`tests/action`, `tests/adapters`, `tests/app`, `tests/domain`)
- standard validation entrypoints (`just`)

## Repository-Specific Layer

`setup-astm`-specific values and behavior remain isolated:

- upstream repository identifiers are owned by `src/catalog/astm.ts`
- use-case file names remain specific to release and main-source installation
- generic runtime boundaries remain free of repository-specific catalog values

This split preserves direct compatibility with future action repositories, including retry-oriented and release-mutation action designs, without introducing framework abstractions.

## Failure Invariants

The action fails explicitly when:

- the `version` input is missing or invalid
- the runner platform is unsupported
- release metadata or release asset access fails
- `git` or `cargo` is missing for `main` mode
- source SHA resolution, clone, submodule fetch, or build fails

No install path silently falls back to another path.
