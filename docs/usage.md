# Usage

`setup-astm` installs `astm` for the version ref passed by the workflow.

## Standard Workflow Usage

```yaml
- uses: asterismhq/setup-astm@v1
  with:
    token: ${{ secrets.ASTM_INSTALL_TOKEN }}
    version: 23.0.0
```

This default form installs the semver-pinned runtime binary for `23.0.0`.

Examples use the bare semver form. A leading `v` is also accepted for semver releases and resolves to the same release tag.

## Install Modes

The `version` input accepts two version ref classes:

- semver such as `22.0.1`: downloads the matching `astm-*` runtime release asset from `asterismhq/asterism`; a leading `v` is also accepted and resolves to the same release tag
- `main`: resolves the current `main` head SHA, reuses a matching cached build when present, or clones the source repository, fetches required submodules, and builds `astm` with `cargo`

## Main-mode Example

```yaml
- uses: asterismhq/setup-astm@v1
  with:
    token: ${{ secrets.ASTM_INSTALL_TOKEN }}
    version: main
    submodule_token: ${{ secrets.ASTM_SUBMODULE_PAT }}
```

This form builds `astm` from the upstream `main` branch instead of downloading a release asset. Repeated runs reuse the cached binary when the upstream `main` head SHA has not changed.

## Main-mode Requirements

`main` mode requires:

- `git` on `PATH`
- `cargo` on `PATH`
- access to the source repository
- `submodule_token`

`main` mode does not fall back to release installation.

## Local Verification

Repository-local verification commands are:

- `just fix`: applies formatter and safe lint fixes.
- `just check`: validates format, lint, and type safety.
- `just test`: runs the test suite.
