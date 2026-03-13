# install-jlo

Installs jlo for the current job after resolving `.jlo/.jlo-version` from the control-plane target branch.

## Usage

```yaml
- uses: asterismhq/jlo-actions/install-jlo@v1
  with:
    token: ${{ secrets.JLO_RELEASE_PAT }}
    submodule_token: ${{ secrets.JLO_SUBMODULE_PAT }}
```

## Inputs

- `token` (required): token with read access to the target repository and release assets
- `submodule_token` (optional): token for private submodule fetch in `main` mode builds
- `target_branch` (optional): branch containing `.jlo/.jlo-version` (default `JLO_TARGET_BRANCH` env)
- `repository` (optional): repository containing `.jlo/.jlo-version` (default `GITHUB_REPOSITORY`)
- `release_repository` (optional): installer release source (default `asterismhq/jlo`)

## Outputs

- `version-token`: raw token from `.jlo/.jlo-version`
- `install-mode`: `release-tag` or `main`

## Required permissions

- repository contents read for control-plane version resolution
- repository contents read for installer release asset download

## Failure modes

- missing `.jlo/.jlo-version` on target branch
- invalid token format (must be semver or `main`)
- unsupported runner OS/architecture for installer bootstrap
- installer asset download failure or installer execution failure
