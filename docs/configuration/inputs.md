# Action Inputs

## Inputs

`setup-astm` defines these inputs in `action.yml`:

| Input | Required | Default | Meaning |
|------|----------|---------|---------|
| `token` | yes | none | GitHub token used to read release metadata, release assets, and the source repository for `main` mode |
| `version` | yes | none | astm version ref to install, such as `23.0.0` or `main`; a leading `v` is also accepted for semver releases |
| `submodule_token` | no | empty | GitHub token used for required authenticated submodule fetch during `main` mode |

## Outputs

The action emits:

| Output | Meaning |
|--------|---------|
| `version-ref` | Raw version ref passed to the `version` input |
| `install-mode` | `release-tag` for semver pins, `main` for source-build pins |

## Version Ref Semantics

The `version` input accepts:

- semver such as `22.0.1`
- semver with a leading `v`, accepted for compatibility with release tags
- `main`

Invalid shapes are rejected with an explicit action failure.
