# setup-jlo

GitHub Action for setting up the `jlo` CLI after resolving `.jlo/.jlo-version` from the control-plane target branch.

## Usage

```yaml
- uses: asterismhq/setup-jlo@v1
  with:
    token: ${{ secrets.JLO_RELEASE_PAT }}
    submodule_token: ${{ secrets.JLO_SUBMODULE_PAT }}
```

## Inputs

- `token` (required): token with read access to the target repository and release assets
- `submodule_token` (optional): token for private submodule fetch in `main` mode builds
- `target_branch` (optional): branch containing `.jlo/.jlo-version`, defaults to `JLO_TARGET_BRANCH`
- `repository` (optional): repository containing `.jlo/.jlo-version`, defaults to `GITHUB_REPOSITORY`
- `release_repository` (optional): `jlo` runtime release source, defaults to `asterismhq/jlo`

## Outputs

- `version-token`: raw token from `.jlo/.jlo-version`
- `install-mode`: `release-tag` or `main`

## Required permissions

- repository contents read for control-plane version resolution
- repository contents read for `jlo` runtime release asset download

## Failure modes

- missing `.jlo/.jlo-version` on target branch
- invalid token format, must be semver or `main`
- unsupported runner OS or architecture for setup-jlo
- release asset download failure or source-build execution failure

## Repository commands

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run package`
- `npm run verify:dist`
- `npm run ci`

## Local verification

```bash
npm ci
npm run ci
```

## Release model

The repository versions as one action.

- tags: `vX.Y.Z`
- moving major tag for consumers: `v1`

`dist/` is committed because `uses:` executes repository contents directly from the tagged revision.
