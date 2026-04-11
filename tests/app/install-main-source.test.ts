import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
} from 'node:fs'
import { join } from 'node:path'
import type { SpawnSyncReturns } from 'node:child_process'

interface MockSpawnOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
}

const {
  info,
  addPath,
  resolveGitHubHttpUsername,
  spawnSync,
  detectPlatformTuple,
} = vi.hoisted(() => ({
  info: vi.fn(),
  addPath: vi.fn(),
  resolveGitHubHttpUsername: vi.fn(),
  spawnSync: vi.fn(),
  detectPlatformTuple: vi.fn(() => ({ os: 'linux', arch: 'x86_64' })),
}))

vi.mock('@actions/core', () => ({
  info,
  addPath,
}))

vi.mock('../../src/adapters/github/github-git-http-username', () => ({
  resolveGitHubHttpUsername,
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

import { installMainSource } from '../../src/app/install-main-source'

describe('app install main-source orchestration', () => {
  let cacheRoot: string
  let tempDirectory: string
  let tempRoot: string

  const mockSha = '0123456789abcdef0123456789abcdef01234567'
  const platformDirName = 'linux-x86_64'

  beforeEach(() => {
    vi.clearAllMocks()

    tempRoot = join(process.cwd(), '.tmp')
    mkdirSync(tempRoot, { recursive: true })
    cacheRoot = mkdtempSync(join(tempRoot, 'setup-jlo-cache-'))
    tempDirectory = mkdtempSync(join(tempRoot, 'setup-jlo-tmp-'))

    resolveGitHubHttpUsername.mockResolvedValue('jlo-user')

    spawnSync.mockImplementation(
      (command: string, args: string[], options?: MockSpawnOptions) => {
        if (command === 'git') {
          if (args.includes('--version'))
            return { status: 0 } as SpawnSyncReturns<string>
          if (args.includes('clone'))
            return {
              status: 0,
              stdout: '',
              stderr: '',
            } as SpawnSyncReturns<string>
          if (args.includes('rev-parse') && args.includes('HEAD'))
            return {
              status: 0,
              stdout: `${mockSha}\n`,
              stderr: '',
            } as SpawnSyncReturns<string>
          if (args.includes('submodule'))
            return {
              status: 0,
              stdout: '',
              stderr: '',
            } as SpawnSyncReturns<string>
        }

        if (command === 'cargo') {
          if (args.includes('--version'))
            return { status: 0 } as SpawnSyncReturns<string>
          if (args.includes('build')) {
            const targetDir =
              options?.env?.CARGO_TARGET_DIR ??
              join(options?.cwd ?? tempDirectory, 'target')
            const binaryPath = join(targetDir, 'release', 'jlo')
            mkdirSync(join(targetDir, 'release'), { recursive: true })
            writeFileSync(binaryPath, 'mock-binary')
            return {
              status: 0,
              stdout: '',
              stderr: '',
            } as SpawnSyncReturns<string>
          }
        }

        // Check if it's the jlo binary being executed
        if (command.endsWith('jlo') && args.includes('--version')) {
          return {
            status: 0,
            stdout: 'jlo main',
            stderr: '',
          } as SpawnSyncReturns<string>
        }

        return {
          status: 1,
          stdout: '',
          stderr: `Command not found or handled: ${command} ${args.join(' ')}`,
        } as SpawnSyncReturns<string>
      },
    )
  })

  afterEach(() => {
    rmSync(cacheRoot, { recursive: true, force: true })
    rmSync(tempDirectory, { recursive: true, force: true })
  })

  it('reuses cached main binary and skips build', async () => {
    const platformDir = join(cacheRoot, platformDirName)
    const shortSha = mockSha.slice(0, 12)
    const installDir = join(platformDir, `main-${shortSha}`)
    mkdirSync(installDir, { recursive: true })
    writeFileSync(join(installDir, 'jlo'), 'cached-binary')

    await installMainSource({
      token: 'token',
      submoduleToken: 'submodule-token',
      allowDarwinX8664Fallback: false,
      cacheRoot,
      tempDirectory,
    })

    expect(info).toHaveBeenCalledWith(
      `jlo main@${shortSha} already cached; skipping build.`,
    )
    expect(info).toHaveBeenCalledWith('jlo installed: jlo main')
    expect(addPath).toHaveBeenCalledWith(installDir)
    expect(readFileSync(join(installDir, 'jlo'), 'utf8')).toBe('cached-binary')
    expect(readdirSync(tempDirectory)).toHaveLength(0)
  })

  it('builds and caches the main binary', async () => {
    await installMainSource({
      token: 'token',
      submoduleToken: 'submodule-token',
      allowDarwinX8664Fallback: false,
      cacheRoot,
      tempDirectory,
    })

    expect(info).toHaveBeenCalledWith(
      'Using submodule_token for required submodule fetch.',
    )
    expect(info).toHaveBeenCalledWith('jlo installed: jlo main')

    const platformDir = join(cacheRoot, platformDirName)
    const shortSha = mockSha.slice(0, 12)
    const installDir = join(platformDir, `main-${shortSha}`)
    expect(existsSync(join(installDir, 'jlo'))).toBe(true)
    expect(readFileSync(join(installDir, 'jlo'), 'utf8')).toBe('mock-binary')
    expect(addPath).toHaveBeenCalledWith(installDir)
    expect(readdirSync(tempDirectory)).toHaveLength(0)
  })

  it('fails when main install omits submodule token', async () => {
    await expect(
      installMainSource({
        token: 'token',
        allowDarwinX8664Fallback: false,
        cacheRoot,
        tempDirectory,
      }),
    ).rejects.toThrow('main install requires submodule_token.')
  })

  it('fails and cleans up temp directory if submodule update fails', async () => {
    spawnSync.mockImplementation(
      (command: string, args: string[], _options?: MockSpawnOptions) => {
        if (command === 'git' && args.includes('submodule')) {
          return {
            status: 1,
            stdout: '',
            stderr: 'Git fetch failed',
          } as SpawnSyncReturns<string>
        }

        // Default success for others to reach the submodule call
        if (command === 'git') {
          if (args.includes('--version'))
            return { status: 0 } as SpawnSyncReturns<string>
          if (args.includes('clone'))
            return {
              status: 0,
              stdout: '',
              stderr: '',
            } as SpawnSyncReturns<string>
          if (args.includes('rev-parse') && args.includes('HEAD'))
            return {
              status: 0,
              stdout: `${mockSha}\n`,
              stderr: '',
            } as SpawnSyncReturns<string>
        }
        if (command === 'cargo' && args.includes('--version'))
          return { status: 0 } as SpawnSyncReturns<string>

        return { status: 1, stdout: '', stderr: '' } as SpawnSyncReturns<string>
      },
    )

    await expect(
      installMainSource({
        token: 'token',
        submoduleToken: 'submodule-token',
        allowDarwinX8664Fallback: false,
        cacheRoot,
        tempDirectory,
      }),
    ).rejects.toThrow(
      'Failed to fetch required git submodules for source build (verify submodule_token can read submodule repositories): Failed to sync git submodule configuration for source build: Git fetch failed',
    )

    // Verify temp directory was cleaned up
    const tempDirContents = readdirSync(tempDirectory)
    expect(tempDirContents.length).toBe(0)
  })

  it('fails when cargo is not installed on PATH', async () => {
    spawnSync.mockImplementation(
      (command: string, args: string[], _options?: MockSpawnOptions) => {
        if (command === 'cargo' && args.includes('--version')) {
          return {
            status: 1,
            stdout: '',
            stderr: 'command not found',
          } as SpawnSyncReturns<string>
        }
        return { status: 0, stdout: '', stderr: '' } as SpawnSyncReturns<string>
      },
    )

    await expect(
      installMainSource({
        token: 'token',
        submoduleToken: 'submodule-token',
        allowDarwinX8664Fallback: false,
        cacheRoot,
        tempDirectory,
      }),
    ).rejects.toThrow(
      'main install requires cargo on PATH. Provision Rust toolchain on the runner.',
    )
  })

  it('fails when git is not installed on PATH', async () => {
    spawnSync.mockImplementation(
      (command: string, args: string[], _options?: MockSpawnOptions) => {
        if (command === 'cargo' && args.includes('--version')) {
          return {
            status: 0,
            stdout: '',
            stderr: '',
          } as SpawnSyncReturns<string>
        }
        if (command === 'git' && args.includes('--version')) {
          return {
            status: 1,
            stdout: '',
            stderr: 'command not found',
          } as SpawnSyncReturns<string>
        }
        return { status: 0, stdout: '', stderr: '' } as SpawnSyncReturns<string>
      },
    )

    await expect(
      installMainSource({
        token: 'token',
        submoduleToken: 'submodule-token',
        allowDarwinX8664Fallback: false,
        cacheRoot,
        tempDirectory,
      }),
    ).rejects.toThrow('main install requires git on PATH.')
  })

  it('safely wraps non-Error strings thrown during submodule updates', async () => {
    spawnSync.mockImplementation(
      (command: string, args: string[], _options?: MockSpawnOptions) => {
        if (command === 'git' && args.includes('submodule')) {
          return {
            status: 1,
            stdout: '',
            stderr: 'fatal: repository not found',
          } as SpawnSyncReturns<string>
        }

        if (command === 'git') {
          if (args.includes('--version'))
            return { status: 0 } as SpawnSyncReturns<string>
          if (args.includes('clone'))
            return {
              status: 0,
              stdout: '',
              stderr: '',
            } as SpawnSyncReturns<string>
          if (args.includes('rev-parse') && args.includes('HEAD'))
            return {
              status: 0,
              stdout: `${mockSha}\n`,
              stderr: '',
            } as SpawnSyncReturns<string>
        }
        if (command === 'cargo' && args.includes('--version'))
          return { status: 0 } as SpawnSyncReturns<string>

        return { status: 1, stdout: '', stderr: '' } as SpawnSyncReturns<string>
      },
    )

    await expect(
      installMainSource({
        token: 'token',
        submoduleToken: 'submodule-token',
        allowDarwinX8664Fallback: false,
        cacheRoot,
        tempDirectory,
      }),
    ).rejects.toThrow(
      /Failed to fetch required git submodules.*: Failed to sync git submodule configuration for source build: fatal: repository not found/,
    )
  })
})
