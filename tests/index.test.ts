import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  info,
  setFailed,
  readRequiredInput,
  readOptionalInput,
  resolveInstallRequest,
  emitInstallOutputs,
  installMainSource,
  installReleaseVersion,
  parseVersionRef,
} = vi.hoisted(() => ({
  info: vi.fn(),
  setFailed: vi.fn(),
  readRequiredInput: vi.fn(),
  readOptionalInput: vi.fn(),
  resolveInstallRequest: vi.fn(),
  emitInstallOutputs: vi.fn(),
  installMainSource: vi.fn(),
  installReleaseVersion: vi.fn(),
  parseVersionRef: vi.fn(),
}))

vi.mock('@actions/core', () => ({
  info,
  setFailed,
}))

vi.mock('../src/action/inputs', () => ({
  readRequiredInput,
  readOptionalInput,
}))

vi.mock('../src/action/install-request', () => ({
  resolveInstallRequest,
}))

vi.mock('../src/action/outputs', () => ({
  emitInstallOutputs,
}))

vi.mock('../src/app/install-main-source', () => ({
  installMainSource,
}))

vi.mock('../src/app/install-release', () => ({
  installReleaseVersion,
}))

vi.mock('../src/domain/version-ref', () => ({
  parseVersionRef,
}))

import { resolveInstallMode, run } from '../src/index'

describe('orchestrator (src/index.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    readRequiredInput.mockImplementation((name: string) => {
      if (name === 'token') return 'mock-token'
      if (name === 'version') return 'mock-version'
      return 'mock-input'
    })
    readOptionalInput.mockReturnValue(undefined)
    resolveInstallRequest.mockReturnValue({
      token: 'mock-token',
      allowDarwinX8664Fallback: false,
      cacheRoot: '/cache',
      tempDirectory: '/tmp',
    })
  })

  describe('resolveInstallMode', () => {
    it('returns kind from parseVersionRef', () => {
      parseVersionRef.mockReturnValue({ kind: 'main', ref: 'main' })
      expect(resolveInstallMode('main')).toBe('main')
      expect(parseVersionRef).toHaveBeenCalledWith('main')

      parseVersionRef.mockReturnValue({
        kind: 'release-tag',
        version: '1.0.0',
        tag: 'v1.0.0',
      })
      expect(resolveInstallMode('1.0.0')).toBe('release-tag')
      expect(parseVersionRef).toHaveBeenCalledWith('1.0.0')
    })
  })

  describe('run', () => {
    it('invokes installMainSource when version kind is main', async () => {
      parseVersionRef.mockReturnValue({ kind: 'main', ref: 'main' })
      readRequiredInput.mockImplementation((name: string) => {
        if (name === 'token') return 'mock-token'
        if (name === 'version') return 'main'
        return 'mock-input'
      })
      const mockRequest = {
        token: 'mock-token',
        submoduleToken: 'mock-submodule-token',
        allowDarwinX8664Fallback: false,
        cacheRoot: '/cache',
        tempDirectory: '/tmp',
      }
      resolveInstallRequest.mockReturnValue(mockRequest)

      await run()

      expect(readRequiredInput).toHaveBeenCalledWith('token')
      expect(readRequiredInput).toHaveBeenCalledWith('version')
      expect(readOptionalInput).toHaveBeenCalledWith('submodule_token')

      expect(parseVersionRef).toHaveBeenCalledWith('main')
      expect(emitInstallOutputs).toHaveBeenCalledWith('main', 'main')

      expect(installMainSource).toHaveBeenCalledWith(mockRequest)
      expect(installReleaseVersion).not.toHaveBeenCalled()
    })

    it('invokes installReleaseVersion when version kind is release-tag', async () => {
      const mockParsedVersion = {
        kind: 'release-tag',
        version: '1.2.3',
        tag: 'v1.2.3',
      }
      parseVersionRef.mockReturnValue(mockParsedVersion)
      readRequiredInput.mockImplementation((name: string) => {
        if (name === 'token') return 'mock-token'
        if (name === 'version') return '1.2.3'
        return 'mock-input'
      })
      const mockRequest = {
        token: 'mock-token',
        allowDarwinX8664Fallback: false,
        cacheRoot: '/cache',
        tempDirectory: '/tmp',
      }
      resolveInstallRequest.mockReturnValue(mockRequest)

      await run()

      expect(readRequiredInput).toHaveBeenCalledWith('token')
      expect(readRequiredInput).toHaveBeenCalledWith('version')
      expect(readOptionalInput).toHaveBeenCalledWith('submodule_token')

      expect(parseVersionRef).toHaveBeenCalledWith('1.2.3')
      expect(emitInstallOutputs).toHaveBeenCalledWith('1.2.3', 'release-tag')

      expect(installReleaseVersion).toHaveBeenCalledWith(
        mockRequest,
        mockParsedVersion,
      )
      expect(installMainSource).not.toHaveBeenCalled()
    })

    it('throws errors directly, leaving setFailed to the caller (if require.main block catches it)', async () => {
      parseVersionRef.mockImplementation(() => {
        throw new Error('Invalid version')
      })

      await expect(run()).rejects.toThrow('Invalid version')
    })
  })
})
