import * as core from '@actions/core'
import {
  getOptionalInput,
  getPositiveIntegerInput,
  getPullRequestView,
  getRequiredInput,
  sleep
} from '../../packages/shared/src'

export type PollEvaluation =
  | { status: 'merged'; mergedAt: string }
  | { status: 'closed_without_merge' }
  | { status: 'pending' }

export function evaluatePullRequestState(view: {
  state: string
  mergedAt: string | null
}): PollEvaluation {
  if (view.mergedAt && view.mergedAt !== 'null') {
    return { status: 'merged', mergedAt: view.mergedAt }
  }
  if (view.state.toUpperCase() === 'CLOSED') {
    return { status: 'closed_without_merge' }
  }
  return { status: 'pending' }
}

async function run(): Promise<void> {
  const token = getRequiredInput('token')
  const repository = getOptionalInput('repository') ?? process.env.GITHUB_REPOSITORY
  const pullNumber = Number.parseInt(getRequiredInput('pr_number'), 10)
  const pollIntervalSeconds = getPositiveIntegerInput('poll_interval_seconds', 5)
  const maxAttempts = getPositiveIntegerInput('max_attempts', 60)

  if (!repository) {
    throw new Error('Input or environment for repository is required.')
  }
  if (!Number.isFinite(pullNumber) || pullNumber <= 0) {
    throw new Error("Input 'pr_number' must be a positive integer.")
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const view = await getPullRequestView({
      token,
      repository,
      pullNumber
    })

    const decision = evaluatePullRequestState(view)
    if (decision.status === 'merged') {
      core.info(`Sync PR #${pullNumber} merged at ${decision.mergedAt}.`)
      core.setOutput('merged_at', decision.mergedAt)
      core.setOutput('final_state', 'merged')
      return
    }

    if (decision.status === 'closed_without_merge') {
      throw new Error(`Sync PR #${pullNumber} closed without merge.`)
    }

    if (attempt < maxAttempts) {
      await sleep(pollIntervalSeconds * 1000)
    }
  }

  throw new Error(`Timed out waiting for sync PR #${pullNumber} to merge.`)
}

if (require.main === module) {
  run().catch((error: unknown) => {
    if (error instanceof Error) {
      core.setFailed(error.message)
      return
    }
    core.setFailed(String(error))
  })
}
