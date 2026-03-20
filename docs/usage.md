# Usage

`setup-jlo` installs `jlo` for the version token passed by the workflow.

## Standard Workflow Usage

```yaml
- uses: asterismhq/setup-jlo@v1
  with:
    token: ${{ secrets.JLO_INSTALL_TOKEN }}
    version: 23.0.0
```

This default form installs the semver-pinned runtime binary for `23.0.0`.

## Install Modes

The `version` input accepts two version token classes:

- semver such as `22.0.1`: downloads the matching `jlo-*` runtime release asset from `asterismhq/jlo`
- `main`: resolves the current `main` head SHA, reuses a matching cached build when present, or clones the source repository, fetches required submodules, and builds `jlo` with `cargo`

## Main-mode Example

```yaml
- uses: asterismhq/setup-jlo@v1
  with:
    token: ${{ secrets.JLO_INSTALL_TOKEN }}
    version: main
    submodule_token: ${{ secrets.JLO_SUBMODULE_PAT }}
```

This form builds `jlo` from the upstream `main` branch instead of downloading a release asset. Repeated runs reuse the cached binary when the upstream `main` head SHA has not changed.

## Main-mode Requirements

`main` mode requires:

- `git` on `PATH`
- `cargo` on `PATH`
- access to the source repository
- `submodule_token`

`main` mode does not fall back to release installation.
