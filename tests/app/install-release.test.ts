import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
} from 'node:fs'
import { join } from 'node:path'
import type { SpawnSyncReturns } from 'node:child_process'

const {
  info,
  addPath,
  spawnSync,
  fetchReleaseAsset,
  chmodSyncMock,
  detectPlatformTuple,
} = vi.hoisted(() => ({
  info: vi.fn(),
  addPath: vi.fn(),
  spawnSync: vi.fn(),
  fetchReleaseAsset: vi.fn(),
  chmodSyncMock: vi.fn(),
  detectPlatformTuple: vi.fn(() => ({ os: 'linux', arch: 'x86_64' })),
}))

vi.mock('@actions/core', () => ({
  info,
  addPath,
}))

vi.mock('node:child_process', async () => {
  const actual =
    await vi.importActual<typeof import('node:child_process')>(
      'node:child_process',
    )
  return {
    ...actual,
    spawnSync,
  }
})

vi.mock('../../src/domain/platform', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/domain/platform')
  >('../../src/domain/platform')
  return {
    ...actual,
    detectPlatformTuple,
  }
})

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  return {
    ...actual,
    chmodSync: (path: string, mode: number) => {
      chmodSyncMock(path, mode)
      actual.chmodSync(path, mode)
    },
  }
})

vi.mock('../../src/adapters/github/release-asset-api', () => ({
  fetchReleaseAsset,
}))

import { installReleaseVersion } from '../../src/app/install-release'

describe('app install release orchestration', () => {
  let cacheRoot: string
  let tempDirectory: string
  let tempRoot: string
  const platformDirName = 'linux-x86_64'

  beforeEach(() => {
    vi.clearAllMocks()

    tempRoot = join(process.cwd(), '.tmp')
    mkdirSync(tempRoot, { recursive: true })
    cacheRoot = mkdtempSync(join(tempRoot, 'setup-jlo-cache-'))
    tempDirectory = mkdtempSync(join(tempRoot, 'setup-jlo-tmp-'))

    spawnSync.mockImplementation((command: string, args: string[]) => {
      if (command.endsWith('jlo') && args.includes('--version')) {
        return {
          status: 0,
          stdout: 'jlo 1.2.3',
          stderr: '',
        } as SpawnSyncReturns<string>
      }
      return {
        status: 1,
        stdout: '',
        stderr: 'Command not found',
      } as SpawnSyncReturns<string>
    })
  })

  afterEach(() => {
    rmSync(cacheRoot, { recursive: true, force: true })
    rmSync(tempDirectory, { recursive: true, force: true })
  })

  it('reuses cached release binary and skips release download', async () => {
    const platformDir = join(cacheRoot, platformDirName)
    const installDir = join(platformDir, 'v1.2.3')
    mkdirSync(installDir, { recursive: true })
    writeFileSync(join(installDir, 'jlo'), 'cached-binary')

    await installReleaseVersion(
      {
        token: 'token',
        allowDarwinX8664Fallback: false,
        cacheRoot,
        tempDirectory,
      },
      {
        kind: 'release-tag',
        version: '1.2.3',
        tag: 'v1.2.3',
      },
    )

    expect(fetchReleaseAsset).not.toHaveBeenCalled()
    expect(info).toHaveBeenCalledWith(
      'jlo 1.2.3 already cached; skipping download.',
    )
    expect(info).toHaveBeenCalledWith('jlo installed: jlo 1.2.3')
    expect(addPath).toHaveBeenCalledWith(installDir)
    expect(readFileSync(join(installDir, 'jlo'), 'utf8')).toBe('cached-binary')
    expect(readdirSync(tempDirectory)).toHaveLength(0)
  })

  it('downloads release asset and places it in cache', async () => {
    const downloadedBinary = 'mock-downloaded-binary'
    fetchReleaseAsset.mockResolvedValue({
      name: 'jlo-linux-x86_64',
      contents: Buffer.from(downloadedBinary),
    })

    await installReleaseVersion(
      {
        token: 'token',
        allowDarwinX8664Fallback: false,
        cacheRoot,
        tempDirectory,
      },
      {
        kind: 'release-tag',
        version: '1.2.3',
        tag: 'v1.2.3',
      },
    )

    const platformDir = join(cacheRoot, platformDirName)
    const installDir = join(platformDir, 'v1.2.3')
    const installedBinary = join(installDir, 'jlo')

    expect(existsSync(installedBinary)).toBe(true)
    expect(statSync(installedBinary).size).toBeGreaterThan(0)
    expect(readFileSync(installedBinary, 'utf8')).toBe(downloadedBinary)
    expect(statSync(installedBinary).mode & 0o777).toBe(0o755)
    expect(info).toHaveBeenCalledWith('jlo installed: jlo 1.2.3')
    expect(addPath).toHaveBeenCalledWith(installDir)
    expect(readdirSync(tempDirectory)).toHaveLength(0)
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
          cacheRoot,
          tempDirectory,
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

    // Verify temp directory was cleaned up
    const tempDirContents = readdirSync(tempDirectory)
    expect(tempDirContents.length).toBe(0)
  })

  it('cleans up temp directory if ensureExecutablePermissions throws', async () => {
    fetchReleaseAsset.mockResolvedValue({
      name: 'jlo-linux-x86_64',
      contents: Buffer.from('mock-downloaded-binary'),
    })

    chmodSyncMock.mockImplementationOnce(() => {
      throw new Error('Permission denied')
    })

    await expect(
      installReleaseVersion(
        {
          token: 'token',
          allowDarwinX8664Fallback: false,
          cacheRoot,
          tempDirectory,
        },
        {
          kind: 'release-tag',
          version: '1.2.3',
          tag: 'v1.2.3',
        },
      ),
    ).rejects.toThrow('Permission denied')

    // Verify temp directory was cleaned up
    const tempDirContents = readdirSync(tempDirectory)
    expect(tempDirContents.length).toBe(0)
  })
})
