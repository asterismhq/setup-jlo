# Access Model

## Private Action Access

`setup-jlo` is designed to be consumed as a private action repository. Consumer repositories require GitHub Actions access to the `setup-jlo` repository through repository or organization action-sharing settings.

The workflow does not clone `setup-jlo` manually. GitHub Actions resolves the action repository before execution.

## Token Scope

The runtime `token` input is separate from the token GitHub Actions uses internally to fetch the private action repository.

The `token` input requires read access to:

- the repository that contains `.jlo/.jlo-version`
- the configured `release_repository`

When `release_repository` also serves as the `main` source repository, the same token covers source resolution and clone access.

## Submodule Access

`submodule_token` is required only when the `main` source tree contains private submodules. Public submodules or repositories without submodules do not require it.

The action attempts anonymous submodule fetch when `submodule_token` is absent. Failure remains explicit.

## Runtime Environment Overrides

The action runtime reads these environment variables when present:

| Variable | Meaning |
|----------|---------|
| `JLO_TARGET_BRANCH` | Default branch used when `target_branch` input is omitted |
| `JLO_MAIN_SOURCE_REMOTE_URL` | Override for the `main` source repository URL |
| `JLO_MAIN_SOURCE_REF` | Override for the ref resolved by `git ls-remote` in `main` mode |
| `JLO_MAIN_SOURCE_BRANCH` | Override for the branch cloned in `main` mode |
| `JLO_ALLOW_DARWIN_X86_64_FALLBACK` | Enables Darwin ARM64 fallback to x86_64 runtime assets |
| `JLO_CACHE_ROOT` | Explicit cache root override |
| `RUNNER_ENVIRONMENT` | Influences cache-root selection for GitHub-hosted runners |
| `RUNNER_TEMP` | Temporary directory and GitHub-hosted cache base |
| `RUNNER_TOOL_CACHE` | Preferred self-hosted cache base when present |

These overrides are repository-owned runtime escape hatches, not part of the normal consumer-facing action input surface.
