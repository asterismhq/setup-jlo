# Access Model

## Private Action Access

`setup-astm` is designed to be consumed as a private action repository. Consumer repositories require GitHub Actions access to the `setup-astm` repository through repository or organization action-sharing settings.

The workflow does not clone `setup-astm` manually. GitHub Actions resolves the action repository before execution.

## Token Scope

The runtime `token` input is separate from the token GitHub Actions uses internally to fetch the private action repository.

The `token` input requires read access to:

- `asterismhq/astm`

`asterismhq/astm` serves as both the runtime release repository and the default `main` source repository, so the same token covers source resolution and clone access.

## Submodule Access

`submodule_token` is required for `main` mode. The `main` source build depends on repository submodules and does not attempt anonymous fallback.

## Runtime Environment Overrides

The action runtime reads these environment variables when present:

| Variable | Meaning |
|----------|---------|
| `ASTM_ALLOW_DARWIN_X86_64_FALLBACK` | Enables Darwin ARM64 fallback to x86_64 runtime assets |
| `ASTM_CACHE_ROOT` | Explicit cache root override |
| `RUNNER_ENVIRONMENT` | Influences cache-root selection for GitHub-hosted runners |
| `RUNNER_TEMP` | Temporary directory and GitHub-hosted cache base |
| `RUNNER_TOOL_CACHE` | Preferred self-hosted cache base when present |

These overrides are repository-owned runtime escape hatches, not part of the normal consumer-facing action input surface.
