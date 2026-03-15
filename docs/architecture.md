# Architecture

## Repository Boundary

`setup-jlo` is a single-action repository. The repository owns GitHub Actions execution for installing `jlo`; it does not own `jlo` release production or the control-plane workflow generation that chooses the version token.

The repository surfaces are:

- `action.yml`: public action contract
- `src/`: TypeScript runtime for version resolution, release installation, and source-build installation
- `dist/`: committed package output used by GitHub Actions at tag resolution time
- `tests/`: repository-owned behavioral tests
- `scripts/verify-dist.mjs`: committed-distribution verification

## Runtime Flow

The action runtime executes this sequence:

1. Read required and optional action inputs.
2. Parse the `version` input as either a semver release or `main`.
3. Resolve install context, cache root, and platform tuple.
4. Execute one install path:
   - semver: query release metadata, select the matching `jlo-*` asset, download it, and install it into the cache
   - `main`: resolve the source head SHA, clone the source repository, initialize submodules when present, build `jlo`, and install the resulting binary into the cache
5. Add the resolved install directory to `GITHUB_PATH`.

## Ownership Split

The current ownership split is:

- `jlo`: version-token contract, workflow generation that embeds the version input, and runtime binary release assets
- `setup-jlo`: GitHub Actions executor for release and `main` installation
- consumer repositories: workflow definitions, secrets, and access settings required to run the private action

## Cache Model

The cache root resolves in this order:

- `JLO_CACHE_ROOT` when explicitly set
- `RUNNER_TEMP/jlo-bin-cache` on GitHub-hosted runners
- `RUNNER_TOOL_CACHE/jlo-bin-cache` when present on self-hosted runners
- `~/.cache/jlo-bin-cache` or `/tmp/jlo-bin-cache` as the final local fallback

Platform directories are keyed by normalized operating system and architecture. Install directories are keyed by either the release tag or the resolved `main` source SHA prefix. Sibling install directories are pruned after a successful install for the same platform.

## Failure Invariants

The action fails explicitly when:

- the `version` input is missing or invalid
- the runner platform is unsupported
- release metadata or release asset access fails
- `git` or `cargo` is missing for `main` mode
- source resolution, clone, submodule fetch, or build fails

No install path silently falls back to another path.
