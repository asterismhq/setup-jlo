import { describe, expect, it, vi, beforeEach } from 'vitest'
import * as core from '@actions/core'
import { emitInstallOutputs } from '../../src/action/outputs'

vi.mock('@actions/core', () => ({
  setOutput: vi.fn(),
}))

describe('emitInstallOutputs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const cases = [
    ['v1.0.0', 'release-tag'],
    ['main', 'main'],
  ] as const

  it.each(
    cases,
  )('sets the correct outputs for version-ref %s and install-mode %s', (versionRef, installMode) => {
    emitInstallOutputs(versionRef, installMode)

    expect(core.setOutput).toHaveBeenCalledTimes(2)
    expect(core.setOutput).toHaveBeenCalledWith('version-ref', versionRef)
    expect(core.setOutput).toHaveBeenCalledWith('install-mode', installMode)
  })
})
