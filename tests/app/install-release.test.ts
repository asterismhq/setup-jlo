import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  info,
  detectPlatformTuple,
  buildReleaseAssetCandidates,
  resolveCacheRoot,
  resolvePlatformCacheDirectory,
  ensureInstallDirectory,
  isCachedBinaryForVersion,
  pruneSiblingInstallDirectories,
  installBinaryOnPath,
  detectBinaryVersion,
  fetchReleaseAsset
} = vi.hoisted(() => ({
  info: vi.fn(),
  detectPlatformTuple: vi.fn(),
  buildReleaseAssetCandidates: vi.fn(),
  resolveCacheRoot: vi.fn(),
  resolvePlatformCacheDirectory: vi.fn(),
  ensureInstallDirectory: vi.fn(),
  isCachedBinaryForVersion: vi.fn(),
  pruneSiblingInstallDirectories: vi.fn(),
  installBinaryOnPath: vi.fn(),
  detectBinaryVersion: vi.fn(),
  fetchReleaseAsset: vi.fn()
}))

vi.mock('@actions/core', () => ({
  info
}))

vi.mock('../../src/domain/platform', () => ({
  detectPlatformTuple,
  buildReleaseAssetCandidates
}))

vi.mock('../../src/adapters/cache/binary-install-cache', () => ({
  resolveCacheRoot,
  resolvePlatformCacheDirectory,
  ensureInstallDirectory,
  isCachedBinaryForVersion,
  pruneSiblingInstallDirectories,
  installBinaryOnPath,
  detectBinaryVersion,
  ensureExecutablePermissions: vi.fn()
}))

vi.mock('../../src/adapters/github/release-asset-api', () => ({
  fetchReleaseAsset
}))

import { installReleaseVersion } from '../../src/app/install-release'

describe('app install release orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    detectPlatformTuple.mockReturnValue({ os: 'linux', arch: 'x86_64' })
    buildReleaseAssetCandidates.mockReturnValue(['jlo-linux-x86_64'])
    resolveCacheRoot.mockReturnValue('/cache')
    resolvePlatformCacheDirectory.mockReturnValue('/cache/linux-x86_64')
    ensureInstallDirectory.mockReturnValue('/cache/linux-x86_64/v1.2.3')
    isCachedBinaryForVersion.mockReturnValue(true)
    detectBinaryVersion.mockReturnValue('jlo 1.2.3')
  })

  it('reuses cached release binary and skips release download', async () => {
    await installReleaseVersion(
      {
        installToken: 'token',
        allowDarwinX8664Fallback: false
      },
      {
        kind: 'release',
        version: '1.2.3',
        tag: 'v1.2.3'
      }
    )

    expect(buildReleaseAssetCandidates).not.toHaveBeenCalled()
    expect(fetchReleaseAsset).not.toHaveBeenCalled()
    expect(pruneSiblingInstallDirectories).toHaveBeenCalledWith(
      '/cache/linux-x86_64',
      'v1.2.3'
    )
    expect(installBinaryOnPath).toHaveBeenCalledWith('/cache/linux-x86_64/v1.2.3')
    expect(info).toHaveBeenCalledWith('jlo installed: jlo 1.2.3')
  })
})