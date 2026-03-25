import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { mkdtempSync, rmSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const {
  info,
  detectPlatformTuple,
  buildReleaseAssetCandidates,
  installBinaryOnPath,
  detectBinaryVersion,
  fetchReleaseAsset,
  ensureExecutablePermissions,
} = vi.hoisted(() => ({
  info: vi.fn(),
  detectPlatformTuple: vi.fn(),
  buildReleaseAssetCandidates: vi.fn(),
  installBinaryOnPath: vi.fn(),
  detectBinaryVersion: vi.fn(),
  fetchReleaseAsset: vi.fn(),
  ensureExecutablePermissions: vi.fn(),
}))

vi.mock('@actions/core', () => ({
  info,
}))

vi.mock('../../src/domain/platform', () => ({
  detectPlatformTuple,
  buildReleaseAssetCandidates,
}))

vi.mock('../../src/adapters/cache/binary-install-cache', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/adapters/cache/binary-install-cache')
  >('../../src/adapters/cache/binary-install-cache')
  return {
    ...actual,
    installBinaryOnPath,
    detectBinaryVersion,
    ensureExecutablePermissions,
    isCachedBinaryForVersion: vi.fn(),
  }
})

vi.mock('../../src/adapters/github/release-asset-api', () => ({
  fetchReleaseAsset,
}))

import { installReleaseVersion } from '../../src/app/install-release'
import { isCachedBinaryForVersion } from '../../src/adapters/cache/binary-install-cache'


describe('app install release orchestration', () => {
  let tempTestDir: string
  let mockCacheRoot: string
  let mockTempDirectory: string

  beforeEach(() => {
    vi.clearAllMocks()
    tempTestDir = mkdtempSync(join(tmpdir(), 'vitest-setup-jlo-release-'))
    mockCacheRoot = join(tempTestDir, 'cache')
    mockTempDirectory = join(tempTestDir, 'runner-temp')
    mkdirSync(mockCacheRoot, { recursive: true })
    mkdirSync(mockTempDirectory, { recursive: true })

    detectPlatformTuple.mockReturnValue({ os: 'linux', arch: 'x86_64' })
    buildReleaseAssetCandidates.mockReturnValue(['jlo-linux-x86_64'])
    detectBinaryVersion.mockReturnValue('jlo 1.2.3')
    vi.mocked(isCachedBinaryForVersion).mockReturnValue(false)
  })

  afterEach(() => {
    if (tempTestDir) {
      rmSync(tempTestDir, { recursive: true, force: true })
    }
  })

  it('reuses cached release binary and skips release download', async () => {
    vi.mocked(isCachedBinaryForVersion).mockReturnValue(true)
    const installDir = join(mockCacheRoot, 'linux-x86_64', 'v1.2.3')
    mkdirSync(installDir, { recursive: true })
    writeFileSync(join(installDir, 'jlo'), 'jlo 1.2.3')

    await installReleaseVersion(
      {
        token: 'token',
        allowDarwinX8664Fallback: false,
        cacheRoot: mockCacheRoot,
        tempDirectory: mockTempDirectory,
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

  it('downloads release asset and places it in cache', async () => {
    fetchReleaseAsset.mockResolvedValue({
      name: 'jlo-linux-x86_64',
      contents: Buffer.from('binary-data'),
    })

    await installReleaseVersion(
      {
        token: 'token',
        allowDarwinX8664Fallback: false,
        cacheRoot: mockCacheRoot,
        tempDirectory: mockTempDirectory,
      },
      {
        kind: 'release-tag',
        version: '1.2.3',
        tag: 'v1.2.3',
      },
    )

    expect(fetchReleaseAsset).toHaveBeenCalled()
    expect(ensureExecutablePermissions).toHaveBeenCalled()
    expect(installBinaryOnPath).toHaveBeenCalled()

    const installDir = join(mockCacheRoot, 'linux-x86_64', 'v1.2.3')
    expect(readdirSync(installDir)).toContain('jlo')
    expect(readdirSync(mockTempDirectory).length).toBe(0) // Download temp dir cleaned up
  })

  it('fails and cleans up temp directory if downloaded asset is empty', async () => {
    fetchReleaseAsset.mockResolvedValue({
      name: 'jlo-linux-x86_64',
      contents: Buffer.from(''),
    })

    await expect(
      installReleaseVersion(
        {
          token: 'token',
          allowDarwinX8664Fallback: false,
          cacheRoot: mockCacheRoot,
          tempDirectory: mockTempDirectory,
        },
        {
          kind: 'release-tag',
          version: '1.2.3',
          tag: 'v1.2.3',
        },
      ),
    ).rejects.toThrow(
      "Downloaded release asset 'jlo-linux-x86_64' is missing or empty in 'asterismhq/jlo' (v1.2.3).",
    )

    expect(readdirSync(mockTempDirectory).length).toBe(0)
  })

  it('cleans up temp directory if ensureExecutablePermissions throws', async () => {
    fetchReleaseAsset.mockResolvedValue({
      name: 'jlo-linux-x86_64',
      contents: Buffer.from('binary-data'),
    })
    ensureExecutablePermissions.mockImplementation(() => {
      throw new Error('Permission denied')
    })

    await expect(
      installReleaseVersion(
        {
          token: 'token',
          allowDarwinX8664Fallback: false,
          cacheRoot: mockCacheRoot,
          tempDirectory: mockTempDirectory,
        },
        {
          kind: 'release-tag',
          version: '1.2.3',
          tag: 'v1.2.3',
        },
      ),
    ).rejects.toThrow('Permission denied')

    expect(readdirSync(mockTempDirectory).length).toBe(0)
  })
})
