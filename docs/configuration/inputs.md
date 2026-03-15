# Action Inputs

## Inputs

`setup-jlo` defines these inputs in `action.yml`:

| Input | Required | Default | Meaning |
|------|----------|---------|---------|
| `token` | yes | none | Token used to read release metadata, release assets, and the source repository for `main` mode |
| `version` | yes | none | jlo version token to install, such as `23.0.0` or `main` |
| `submodule_token` | no | empty | Token used for authenticated submodule fetch during `main` mode when submodules are private |

## Outputs

The action emits:

| Output | Meaning |
|--------|---------|
| `version-token` | Raw token passed to the `version` input |
| `install-mode` | `release-tag` for semver pins, `main` for source-build pins |

## Token Semantics

The `version` input accepts:

- semver such as `22.0.1`
- semver with a leading `v`
- `main`

Invalid shapes are rejected with an explicit action failure.
