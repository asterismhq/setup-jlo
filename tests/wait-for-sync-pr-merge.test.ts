import { describe, expect, it } from 'vitest'
import { evaluatePullRequestState } from '../wait-for-sync-pr-merge/src/index'

describe('wait-for-sync-pr-merge polling behavior', () => {
  it('treats mergedAt as merged terminal state', () => {
    expect(
      evaluatePullRequestState({
        state: 'OPEN',
        mergedAt: '2026-03-13T00:00:00Z'
      })
    ).toEqual({ status: 'merged', mergedAt: '2026-03-13T00:00:00Z' })
  })

  it('fails when pull request is closed without merge', () => {
    expect(
      evaluatePullRequestState({
        state: 'CLOSED',
        mergedAt: null
      })
    ).toEqual({ status: 'closed_without_merge' })
  })

  it('continues polling while pull request is open and unmerged', () => {
    expect(
      evaluatePullRequestState({
        state: 'OPEN',
        mergedAt: null
      })
    ).toEqual({ status: 'pending' })
  })
})
