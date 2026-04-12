# setup-astm

`setup-astm` is a GitHub Action that installs the `astm` CLI for a supplied version ref. The action owns GitHub Actions execution for both release-tag installation and `main` source-build installation.

The repository packages one distributable action. The runtime contract is intentionally narrow: accept a version ref, install the matching `astm` binary, and place it on the GitHub Actions path with explicit failures when prerequisites or permissions are missing.

## Quick Start

```yaml
- uses: asterismhq/setup-astm@v1
  with:
    token: ${{ secrets.ASTM_INSTALL_TOKEN }}
    version: 23.0.0
```

## Usage

Usage centers on two install modes: semver refs download `astm` runtime release assets from `asterismhq/astm` and the `main` ref resolves the current `main` head, reuses a matching cached build when present, or builds `astm` from source on the runner.

See [docs/usage.md](docs/usage.md) for the input surface, install modes, and workflow examples.

## Architecture

The repository contains one action runtime under `src/` with explicit ownership boundaries (`action`, `app`, `domain`, `adapters`, and `catalog`) and one committed distribution under `dist/` for release tags.

See [docs/architecture.md](docs/architecture.md) for ownership boundaries, dependency direction, runtime flow, and failure invariants.

## Configuration

Configuration consists of action inputs, runtime environment variables, token scopes, and private-action access settings. The action installs the version ref supplied by the workflow and reads release assets and `main`-mode source from `asterismhq/astm`.

See [docs/README.md](docs/README.md) for inputs, environment overrides, and access requirements.
