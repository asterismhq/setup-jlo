# wait-for-sync-pr-merge

Polls a known pull request until it is merged, and fails if it closes without merge or reaches timeout.

## Usage

```yaml
- uses: asterismhq/jlo-actions/wait-for-sync-pr-merge@v1
  with:
    token: ${{ secrets.JLO_BOT_PAT }}
    pr_number: ${{ steps.sync_pr.outputs.pr_number }}
```

## Inputs

- `token` (required): token with pull-request read access
- `repository` (optional): repository slug (`owner/repo`), defaults to `GITHUB_REPOSITORY`
- `pr_number` (required): pull request number to wait on
- `poll_interval_seconds` (optional): poll interval in seconds, default `5`
- `max_attempts` (optional): maximum poll attempts, default `60`

## Outputs

- `merged_at`: merge timestamp when success occurs
- `final_state`: terminal state value (`merged`)

## Required permissions

- pull request read for the target repository

## Failure modes

- invalid input values (missing token or invalid PR number)
- PR transitions to closed without merge
- timeout after configured max attempts
