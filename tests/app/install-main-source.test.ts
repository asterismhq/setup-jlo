import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  mkdtempSync,
  rmSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const {
  info,
  resolveGitHubHttpUsername,
  commandExists,
  cloneGitHubBranch,
  resolveGitWorktreeHeadSha,
  updateGitHubSubmodules,
  detectPlatformTuple,
  detectBinaryVersion,
  buildCargoRelease,
  installBinaryOnPath,
} = vi.hoisted(() => ({
  info: vi.fn(),
  resolveGitHubHttpUsername: vi.fn(),
  commandExists: vi.fn(),
  cloneGitHubBranch: vi.fn(),
  resolveGitWorktreeHeadSha: vi.fn(),
  updateGitHubSubmodules: vi.fn(),
  detectPlatformTuple: vi.fn(),
  detectBinaryVersion: vi.fn(),
  buildCargoRelease: vi.fn(),
  installBinaryOnPath: vi.fn(),
}))

vi.mock('@actions/core', () => ({
  info,
}))

vi.mock('../../src/adapters/github/github-git-http-username', () => ({
  resolveGitHubHttpUsername,
}))

vi.mock('../../src/adapters/process/github-source-git', () => ({
  commandExists,
  cloneGitHubBranch,
  resolveGitWorktreeHeadSha,
  updateGitHubSubmodules,
}))

vi.mock('../../src/domain/platform', () => ({
  detectPlatformTuple,
}))

vi.mock('../../src/adapters/cache/binary-install-cache', async () => {
  const actual = await vi.importActual<
    typeof import('../../src/adapters/cache/binary-install-cache')
  >('../../src/adapters/cache/binary-install-cache')
  return {
    ...actual,
    detectBinaryVersion,
    installBinaryOnPath,
  }
})

vi.mock('../../src/adapters/process/cargo-build', () => ({
  buildCargoRelease,
}))

import { installMainSource } from '../../src/app/install-main-source'

describe('app install main-source orchestration', () => {
  let tempTestDir: string
  let mockCacheRoot: string
  let mockTempDirectory: string

  beforeEach(() => {
    vi.clearAllMocks()
    tempTestDir = mkdtempSync(join(tmpdir(), 'vitest-setup-jlo-main-source-'))
    mockCacheRoot = join(tempTestDir, 'cache')
    mockTempDirectory = join(tempTestDir, 'runner-temp')
    mkdirSync(mockCacheRoot, { recursive: true })
    mkdirSync(mockTempDirectory, { recursive: true })

    resolveGitHubHttpUsername.mockResolvedValue({ ok: true, value: 'jlo-user' })
    commandExists.mockReturnValue(true)
    cloneGitHubBranch.mockReturnValue({ ok: true, value: undefined })
    updateGitHubSubmodules.mockReturnValue({ ok: true, value: undefined })
    resolveGitWorktreeHeadSha.mockReturnValue({
      ok: true,
      value: '0123456789abcdef0123456789abcdef01234567',
    })
    detectPlatformTuple.mockReturnValue({ os: 'linux', arch: 'x86_64' })
    detectBinaryVersion.mockReturnValue('jlo main')
  })

  afterEach(() => {
    if (tempTestDir) {
      rmSync(tempTestDir, { recursive: true, force: true })
    }
  })

  it('reuses cached main binary and skips build', async () => {
    const installDir = join(mockCacheRoot, 'linux-x86_64', 'main-0123456789ab')
    mkdirSync(installDir, { recursive: true })
    writeFileSync(join(installDir, 'jlo'), 'mock-cached-binary')

    await installMainSource({
      token: 'token',
      submoduleToken: 'submodule-token',
      allowDarwinX8664Fallback: false,
      cacheRoot: mockCacheRoot,
      tempDirectory: mockTempDirectory,
    })

    expect(updateGitHubSubmodules).not.toHaveBeenCalled()
    expect(buildCargoRelease).not.toHaveBeenCalled()
    expect(info).toHaveBeenCalledWith(
      'jlo main@0123456789ab already cached; skipping build.',
    )
    expect(info).toHaveBeenCalledWith('jlo installed: jlo main')
    expect(installBinaryOnPath).toHaveBeenCalledWith(installDir)

    expect(readdirSync(mockTempDirectory)).toEqual([])
  })

  it('fetches required submodules and builds when not cached', async () => {
    buildCargoRelease.mockImplementation((options) => {
      const mockBuiltBinary = join(options.buildTargetDir, 'release', 'jlo')
      mkdirSync(join(options.buildTargetDir, 'release'), { recursive: true })
      writeFileSync(mockBuiltBinary, 'built-data')
      return mockBuiltBinary
    })

    await installMainSource({
      token: 'token',
      submoduleToken: 'submodule-token',
      allowDarwinX8664Fallback: false,
      cacheRoot: mockCacheRoot,
      tempDirectory: mockTempDirectory,
    })

    expect(info).toHaveBeenCalledWith(
      'Using submodule_token for required submodule fetch.',
    )
    expect(info).toHaveBeenCalledWith('jlo installed: jlo main')
    expect(buildCargoRelease).toHaveBeenCalled()

    const installDir = join(mockCacheRoot, 'linux-x86_64', 'main-0123456789ab')
    expect(readdirSync(installDir)).toContain('jlo')
    expect(installBinaryOnPath).toHaveBeenCalledWith(installDir)
    expect(readdirSync(mockTempDirectory)).toEqual([])
  })

  it('fails when main install omits submodule token', async () => {
    await expect(
      installMainSource({
        token: 'token',
        allowDarwinX8664Fallback: false,
        cacheRoot: mockCacheRoot,
        tempDirectory: mockTempDirectory,
      }),
    ).rejects.toThrow('main install requires submodule_token.')
  })

  it('fails and cleans up temp directory if submodule update fails', async () => {
    updateGitHubSubmodules.mockReturnValue({
      ok: false,
      error: new Error('Git fetch failed'),
    })

    await expect(
      installMainSource({
        token: 'token',
        submoduleToken: 'submodule-token',
        allowDarwinX8664Fallback: false,
        cacheRoot: mockCacheRoot,
        tempDirectory: mockTempDirectory,
      }),
    ).rejects.toThrow(
      'Failed to fetch required git submodules for source build (verify submodule_token can read submodule repositories): Git fetch failed',
    )

    expect(readdirSync(mockTempDirectory)).toEqual([])
  })

  it('fails when cargo is not installed on PATH', async () => {
    commandExists.mockImplementation((cmd) => cmd !== 'cargo')

    await expect(
      installMainSource({
        token: 'token',
        submoduleToken: 'submodule-token',
        allowDarwinX8664Fallback: false,
        cacheRoot: mockCacheRoot,
        tempDirectory: mockTempDirectory,
      }),
    ).rejects.toThrow(
      'main install requires cargo on PATH. Provision Rust toolchain on the runner.',
    )
  })

  it('fails when git is not installed on PATH', async () => {
    commandExists.mockImplementation((cmd) => cmd !== 'git')

    await expect(
      installMainSource({
        token: 'token',
        submoduleToken: 'submodule-token',
        allowDarwinX8664Fallback: false,
        cacheRoot: mockCacheRoot,
        tempDirectory: mockTempDirectory,
      }),
    ).rejects.toThrow('main install requires git on PATH.')
  })
})
