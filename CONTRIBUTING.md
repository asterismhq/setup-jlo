# Contributing

## Scope

`setup-jlo` is a single-action repository. The active product surface is the GitHub Action defined by `action.yml`, the TypeScript runtime in `src/`, and the committed package output in `dist/`.

## Local Verification

The repository verification surface is:

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run package`
- `npm run verify:dist`
- `npm run ci`

`npm run ci` is the canonical local verification command because it runs the full repository-owned validation sequence.

## Distribution Boundary

`dist/` is committed because GitHub Actions executes repository contents directly from the tagged revision. Source changes under `src/` are accompanied by regenerated `dist/` output before release tags move.

`scripts/verify-dist.mjs` compares committed `dist/` files against fresh `ncc` output in the repository-local `.tmp/` directory. Distribution drift is treated as a repository defect.

## Release Model

The repository versions one action. Consumer-facing tags follow `vX.Y.Z`, and the moving major tag for workflows is `v1`.
When a semver tag is pushed, the release workflow publishes the matching GitHub Release and then moves the corresponding major tag to the released commit.

## Documentation

`README.md` is the public front door. `docs/` owns task-oriented usage, durable architecture, and configuration reference surfaces.
