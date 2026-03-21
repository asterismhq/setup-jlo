# Action Inputs

## Inputs

`setup-jlo` defines these inputs in `action.yml`:

| Input | Required | Default | Meaning |
|------|----------|---------|---------|
| `token` | yes | none | GitHub token used to read release metadata, release assets, and the source repository for `main` mode |
| `version` | yes | none | jlo version token to install, such as `23.0.0` or `main` |
| `submodule_token` | no | empty | GitHub token used for required authenticated submodule fetch during `main` mode |

## Outputs

The action emits:

| Output | Meaning |
|--------|---------|
| `version-token` | Raw version token passed to the `version` input |
| `install-mode` | `release-tag` for semver pins, `main` for source-build pins |

## Version Token Semantics

The `version` input accepts:

- semver such as `22.0.1`
- semver with a leading `v`
- `main`

Invalid shapes are rejected with an explicit action failure.
