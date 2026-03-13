# jlo-actions

Standalone TypeScript GitHub Actions monorepo for reusable jlo workflow runtime actions.

## Public actions

- `asterismhq/jlo-actions/install-jlo@v1`
  - installs `jlo` after resolving `.jlo/.jlo-version` from the control-plane target branch
  - required input: `token`
  - action contract: [`install-jlo/README.md`](install-jlo/README.md)
- `asterismhq/jlo-actions/wait-for-sync-pr-merge@v1`
  - polls a known pull request until merge and fails on close-without-merge or timeout
  - required inputs: `token`, `pr_number`
  - action contract: [`wait-for-sync-pr-merge/README.md`](wait-for-sync-pr-merge/README.md)

## Minimal usage

```yaml
- uses: asterismhq/jlo-actions/install-jlo@v1
  with:
    token: ${{ secrets.JLO_RELEASE_PAT }}

- uses: asterismhq/jlo-actions/wait-for-sync-pr-merge@v1
  with:
    token: ${{ secrets.JLO_BOT_PAT }}
    pr_number: ${{ steps.sync_pr.outputs.pr_number }}
```

Each public action requires explicit inputs. The root README is an index. Per-action inputs, outputs, permissions, and failure modes are defined in each action README.

## Repository commands

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run package`
- `npm run verify:dist`

## Local verification

```bash
npm ci
npm run ci
```

## Runner model

Repository workflows run on self-hosted runners.

Node.js is still fixed by workflow configuration through `.nvmrc` and `actions/setup-node`.

## Release model

The repository versions as one unit.

- tags: `vX.Y.Z`
- moving major tag for consumers: `v1`

Both public actions execute from committed `dist/index.js` artifacts.
`dist/` is part of the repository contents used by `uses:` and is not gitignored.
Release tags publish repository state, not bundled action files as separate release assets.
