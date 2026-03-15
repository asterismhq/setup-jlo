# setup-jlo

`setup-jlo` is a GitHub Action that installs the `jlo` CLI for a supplied version token. The action owns GitHub Actions execution for both release-tag installation and `main` source-build installation.

The repository packages one distributable action. The runtime contract is intentionally narrow: accept a version token, install the matching `jlo` binary, and place it on the GitHub Actions path with explicit failures when prerequisites or permissions are missing.

## Quick Start

```yaml
- uses: asterismhq/setup-jlo@v1
  with:
    token: ${{ secrets.JLO_INSTALL_TOKEN }}
    version: 23.0.0
```

## Usage

Usage centers on two install modes: semver tokens download `jlo` runtime release assets from `asterismhq/jlo` and the `main` token builds `jlo` from source on the runner.

See [docs/usage.md](docs/usage.md) for the input surface, install modes, and workflow examples.

## Architecture

The repository contains one action runtime under `src/`, one committed distribution under `dist/`, and one verification path that compares committed `dist/` output with fresh `ncc` packaging. Version-token parsing stays aligned with the `jlo` install contract while GitHub Actions execution remains local to this repository.

See [docs/architecture.md](docs/architecture.md) for ownership boundaries, runtime flow, caching, and failure invariants.

## Configuration

Configuration consists of action inputs, runtime environment variables, token scopes, and private-action access settings. The action installs the version token supplied by the workflow and reads runtime release assets from `asterismhq/jlo`.

See [docs/README.md](docs/README.md) for inputs, environment overrides, and access requirements.
