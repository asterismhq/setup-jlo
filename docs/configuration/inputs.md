# Action Inputs

## Inputs

`setup-jlo` defines these inputs in `action.yml`:

| Input | Required | Default | Meaning |
|------|----------|---------|---------|
| `token` | yes | none | Token used to read `.jlo/.jlo-version`, release metadata, release assets, and the source repository for `main` mode |
| `submodule_token` | no | empty | Token used for authenticated submodule fetch during `main` mode when submodules are private |
| `target_branch` | no | `JLO_TARGET_BRANCH` | Branch containing `.jlo/.jlo-version` |
| `repository` | no | `GITHUB_REPOSITORY` | Repository containing `.jlo/.jlo-version` |
| `release_repository` | no | `asterismhq/jlo` | Repository hosting `jlo-*` runtime release assets and the default `main` source repository |

## Outputs

The action emits:

| Output | Meaning |
|--------|---------|
| `version-token` | Raw token read from `.jlo/.jlo-version` |
| `install-mode` | `release-tag` for semver pins, `main` for source-build pins |

## Token Semantics

The token read from `.jlo/.jlo-version` accepts:

- semver such as `22.0.1`
- semver with a leading `v`
- `main`

Invalid shapes are rejected with an explicit action failure.
