# Usage

`setup-jlo` installs `jlo` by reading `.jlo/.jlo-version` from the configured target branch.

## Standard Workflow Usage

```yaml
- uses: asterismhq/setup-jlo@v1
  with:
    token: ${{ secrets.JLO_RELEASE_PAT }}
    submodule_token: ${{ secrets.JLO_SUBMODULE_PAT }}
```

This default form reads `.jlo/.jlo-version` from `${{ github.repository }}` on `JLO_TARGET_BRANCH`.

## Install Modes

`.jlo/.jlo-version` accepts two token classes:

- semver such as `22.0.1`: downloads the matching `jlo-*` runtime release asset from the configured release repository
- `main`: clones the configured source repository, resolves the upstream `main` head, initializes submodules when present, and builds `jlo` with `cargo`

The action exposes:

- `version-token`: the raw token read from `.jlo/.jlo-version`
- `install-mode`: `release-tag` or `main`

## Non-default Repository Or Branch

```yaml
- uses: asterismhq/setup-jlo@v1
  with:
    token: ${{ secrets.JLO_RELEASE_PAT }}
    repository: asterismhq/example-control-plane
    target_branch: release-control
    release_repository: asterismhq/jlo
```

This form reads the version pin from a different control-plane repository or branch while still downloading runtime assets from the configured release repository.

## Main-mode Requirements

`main` mode requires:

- `git` on `PATH`
- `cargo` on `PATH`
- access to the source repository
- `submodule_token` when the source tree contains private submodules

`main` mode does not fall back to release installation.

## Local Verification

Repository-local verification is:

- `npm run ci`

Targeted commands remain available when only one surface is under active change:

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run package`
- `npm run verify:dist`
