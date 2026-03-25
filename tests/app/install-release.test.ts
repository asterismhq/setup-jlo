import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync, mkdirSync, chmodSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { SpawnSyncReturns } from 'node:child_process'

const { info, addPath, spawnSync, fetchReleaseAsset, chmodSyncMock } = vi.hoisted(() => ({
  info: vi.fn(),
  addPath: vi.fn(),
  spawnSync: vi.fn(),
  fetchReleaseAsset: vi.fn(),
  chmodSyncMock: vi.fn(),
}))

vi.mock('@actions/core', () => ({
  info,
  addPath,
}))

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process')
  return {
    ...actual,
    spawnSync,
  }
})

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os')
  return {
    ...actual,
    platform: () => 'linux',
    arch: () => 'x64',
  }
})

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  return {
    ...actual,
    chmodSync: (...args: any[]) => {
      chmodSyncMock(...args)
      actual.chmodSync(args[0], args[1])
    }
  }
})

vi.mock('../../src/adapters/github/release-asset-api', () => ({
  fetchReleaseAsset,
}))

import { installReleaseVersion } from '../../src/app/install-release'

describe('app install release orchestration', () => {
  let cacheRoot: string
  let tempDirectory: string

  beforeEach(() => {
    vi.clearAllMocks()

    // Set up real temp directories for the tests
    const baseTemp = tmpdir()
    cacheRoot = mkdtempSync(join(baseTemp, 'setup-jlo-cache-'))
    tempDirectory = mkdtempSync(join(baseTemp, 'setup-jlo-tmp-'))

    spawnSync.mockImplementation((command: string, args: string[], options: any) => {
      if (command.endsWith('jlo') && args.includes('--version')) {
        return { status: 0, stdout: 'jlo 1.2.3', stderr: '' } as SpawnSyncReturns<string>
      }
      return { status: 1, stdout: '', stderr: 'Command not found' } as SpawnSyncReturns<string>
    })
  })

  afterEach(() => {
    rmSync(cacheRoot, { recursive: true, force: true })
    rmSync(tempDirectory, { recursive: true, force: true })
  })

  it('reuses cached release binary and skips release download', async () => {
    const platformDir = join(cacheRoot, 'linux-x86_64')
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
  })

  it('downloads release asset and places it in cache', async () => {
    fetchReleaseAsset.mockResolvedValue({
      name: 'jlo-linux-x86_64',
      contents: Buffer.from('mock-downloaded-binary'),
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

    const platformDir = join(cacheRoot, 'linux-x86_64')
    const installDir = join(platformDir, 'v1.2.3')
    const installedBinary = join(installDir, 'jlo')

    expect(existsSync(installedBinary)).toBe(true)
    expect(statSync(installedBinary).size).toBeGreaterThan(0)
    expect(chmodSyncMock).toHaveBeenCalledWith(expect.stringContaining('jlo-linux-x86_64'), 0o755)

    expect(info).toHaveBeenCalledWith('jlo installed: jlo 1.2.3')
    expect(addPath).toHaveBeenCalledWith(installDir)
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
