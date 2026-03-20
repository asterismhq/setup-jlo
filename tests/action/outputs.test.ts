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

  it('sets the correct outputs for version-token and install-mode', () => {
    emitInstallOutputs('v1.0.0', 'release-tag')

    expect(core.setOutput).toHaveBeenCalledTimes(2)
    expect(core.setOutput).toHaveBeenCalledWith('version-token', 'v1.0.0')
    expect(core.setOutput).toHaveBeenCalledWith('install-mode', 'release-tag')
  })

  it('sets the correct outputs for main install mode', () => {
    emitInstallOutputs('main', 'main')

    expect(core.setOutput).toHaveBeenCalledTimes(2)
    expect(core.setOutput).toHaveBeenCalledWith('version-token', 'main')
    expect(core.setOutput).toHaveBeenCalledWith('install-mode', 'main')
  })
})
