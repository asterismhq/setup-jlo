import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  info,
  detectPlatformTuple,
  buildReleaseAssetCandidates,
  resolvePlatformCacheDirectory,
  ensureInstallDirectory,
  isCachedBinaryForVersion,
  pruneSiblingInstallDirectories,
  installBinaryOnPath,
  detectBinaryVersion,
  fetchReleaseAsset,
  ensureExecutablePermissions,
  mkdtempSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
  tmpdir,
} = vi.hoisted(() => ({
  info: vi.fn(),
  detectPlatformTuple: vi.fn(),
  buildReleaseAssetCandidates: vi.fn(),
  resolvePlatformCacheDirectory: vi.fn(),
  ensureInstallDirectory: vi.fn(),
  isCachedBinaryForVersion: vi.fn(),
  pruneSiblingInstallDirectories: vi.fn(),
  installBinaryOnPath: vi.fn(),
  detectBinaryVersion: vi.fn(),
  fetchReleaseAsset: vi.fn(),
  ensureExecutablePermissions: vi.fn(),
  mkdtempSync: vi.fn(),
  renameSync: vi.fn(),
  rmSync: vi.fn(),
  statSync: vi.fn(),
  writeFileSync: vi.fn(),
  tmpdir: vi.fn(),
}))

vi.mock('@actions/core', () => ({
  info,
}))

vi.mock('node:fs', () => ({
  mkdtempSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
}))

vi.mock('node:os', () => ({
  tmpdir,
}))

vi.mock('../../src/domain/platform', () => ({
  detectPlatformTuple,
  buildReleaseAssetCandidates,
}))

vi.mock('../../src/adapters/cache/binary-install-cache', () => ({
  resolvePlatformCacheDirectory,
  ensureInstallDirectory,
  isCachedBinaryForVersion,
  pruneSiblingInstallDirectories,
  installBinaryOnPath,
  detectBinaryVersion,
  ensureExecutablePermissions,
}))

vi.mock('../../src/adapters/github/release-asset-api', () => ({
  fetchReleaseAsset,
}))

import { installReleaseVersion } from '../../src/app/install-release'

describe('app install release orchestration', () => {
  const MOCK_TMP_DIR = '/tmp'
  const MOCK_DOWNLOAD_PATH = '/tmp/setup-jlo-release-1234'

  beforeEach(() => {
    vi.clearAllMocks()
    detectPlatformTuple.mockReturnValue({ os: 'linux', arch: 'x86_64' })
    buildReleaseAssetCandidates.mockReturnValue(['jlo-linux-x86_64'])
    resolvePlatformCacheDirectory.mockReturnValue('/cache/linux-x86_64')
    ensureInstallDirectory.mockReturnValue('/cache/linux-x86_64/v1.2.3')
    isCachedBinaryForVersion.mockReturnValue(true)
    detectBinaryVersion.mockReturnValue('jlo 1.2.3')
  })

  it('reuses cached release binary and skips release download', async () => {
    await installReleaseVersion(
      {
        token: 'token',
        allowDarwinX8664Fallback: false,
        cacheRoot: '/cache',
        tempDirectory: '/tmp',
      },
      {
        kind: 'release-tag',
        version: '1.2.3',
        tag: 'v1.2.3',
      },
    )

    expect(buildReleaseAssetCandidates).not.toHaveBeenCalled()
    expect(fetchReleaseAsset).not.toHaveBeenCalled()
    expect(info).toHaveBeenCalledWith(
      'jlo 1.2.3 already cached; skipping download.',
    )
    expect(info).toHaveBeenCalledWith('jlo installed: jlo 1.2.3')
  })

  it('fails and cleans up temp directory if downloaded asset is empty', async () => {
    isCachedBinaryForVersion.mockReturnValue(false)
    tmpdir.mockReturnValue(MOCK_TMP_DIR)
    mkdtempSync.mockReturnValue(MOCK_DOWNLOAD_PATH)
    fetchReleaseAsset.mockResolvedValue({
      name: 'jlo-linux-x86_64',
      contents: Buffer.from(''),
    })
    statSync.mockReturnValue({ size: 0 })

    await expect(
      installReleaseVersion(
        {
          installToken: 'token',
          allowDarwinX8664Fallback: false,
        },
        {
          kind: 'release',
          version: '1.2.3',
          tag: 'v1.2.3',
        },
      ),
    ).rejects.toThrow(
      "Downloaded release asset 'jlo-linux-x86_64' is missing or empty in 'asterismhq/jlo' (v1.2.3).",
    )

    expect(rmSync).toHaveBeenCalledWith(MOCK_DOWNLOAD_PATH, {
      recursive: true,
      force: true,
    })
  })

  it('cleans up temp directory if ensureExecutablePermissions throws', async () => {
    isCachedBinaryForVersion.mockReturnValue(false)
    tmpdir.mockReturnValue(MOCK_TMP_DIR)
    mkdtempSync.mockReturnValue(MOCK_DOWNLOAD_PATH)
    fetchReleaseAsset.mockResolvedValue({
      name: 'jlo-linux-x86_64',
      contents: Buffer.from('binary-data'),
    })
    statSync.mockReturnValue({ size: 100 })
    ensureExecutablePermissions.mockImplementation(() => {
      throw new Error('Permission denied')
    })

    await expect(
      installReleaseVersion(
        {
          installToken: 'token',
          allowDarwinX8664Fallback: false,
        },
        {
          kind: 'release',
          version: '1.2.3',
          tag: 'v1.2.3',
        },
      ),
    ).rejects.toThrow('Permission denied')

    expect(rmSync).toHaveBeenCalledWith(MOCK_DOWNLOAD_PATH, {
      recursive: true,
      force: true,
    })
  })
})
