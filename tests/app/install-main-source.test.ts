import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  info,
  existsSync,
  mkdtempSync,
  rmSync,
  resolveGitHubHttpUsername,
  commandExists,
  cloneGitHubBranch,
  resolveGitWorktreeHeadSha,
  updateGitHubSubmodules,
  detectPlatformTuple,
  resolvePlatformCacheDirectory,
  ensureInstallDirectory,
  installBinaryOnPath,
  pruneSiblingInstallDirectories,
  detectBinaryVersion,
  buildCargoRelease,
  copyExecutableBinary,
  tmpdir,
} = vi.hoisted(() => ({
  info: vi.fn(),
  existsSync: vi.fn(),
  mkdtempSync: vi.fn(),
  rmSync: vi.fn(),
  resolveGitHubHttpUsername: vi.fn(),
  commandExists: vi.fn(),
  cloneGitHubBranch: vi.fn(),
  resolveGitWorktreeHeadSha: vi.fn(),
  updateGitHubSubmodules: vi.fn(),
  detectPlatformTuple: vi.fn(),
  resolvePlatformCacheDirectory: vi.fn(),
  ensureInstallDirectory: vi.fn(),
  installBinaryOnPath: vi.fn(),
  pruneSiblingInstallDirectories: vi.fn(),
  detectBinaryVersion: vi.fn(),
  buildCargoRelease: vi.fn(),
  copyExecutableBinary: vi.fn(),
  tmpdir: vi.fn(),
}))

vi.mock('@actions/core', () => ({
  info,
}))

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  return {
    ...actual,
    existsSync,
    mkdtempSync,
    rmSync,
  }
})

vi.mock('node:os', () => ({
  tmpdir,
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

vi.mock('../../src/adapters/cache/binary-install-cache', () => ({
  resolvePlatformCacheDirectory,
  ensureInstallDirectory,
  installBinaryOnPath,
  pruneSiblingInstallDirectories,
  detectBinaryVersion,
  copyExecutableBinary,
}))

vi.mock('../../src/adapters/process/cargo-build', () => ({
  buildCargoRelease,
}))

import { installMainSource } from '../../src/app/install-main-source'

describe('app install main-source orchestration', () => {
  const MOCK_TMP_DIR = '/tmp'
  const MOCK_CLONE_PATH = '/tmp/setup-jlo-main-1234'
  const MOCK_BUILD_PATH = '/tmp/jlo'

  beforeEach(() => {
    vi.clearAllMocks()
    resolveGitHubHttpUsername.mockResolvedValue('jlo-user')
    commandExists.mockReturnValue(true)
    resolveGitWorktreeHeadSha.mockReturnValue(
      '0123456789abcdef0123456789abcdef01234567',
    )
    detectPlatformTuple.mockReturnValue({ os: 'linux', arch: 'x86_64' })
    resolvePlatformCacheDirectory.mockReturnValue('/cache/linux-x86_64')
    ensureInstallDirectory.mockReturnValue(
      '/cache/linux-x86_64/main-0123456789ab',
    )
    existsSync.mockReturnValue(true)
    detectBinaryVersion.mockReturnValue('jlo main')
    tmpdir.mockReturnValue(MOCK_TMP_DIR)
    mkdtempSync.mockReturnValue(MOCK_CLONE_PATH)
  })

  it('reuses cached main binary and skips build', async () => {
    await installMainSource({
      token: 'token',
      submoduleToken: 'submodule-token',
      allowDarwinX8664Fallback: false,
      cacheRoot: '/cache',
      tempDirectory: '/tmp',
    })

    expect(updateGitHubSubmodules).not.toHaveBeenCalled()
    expect(buildCargoRelease).not.toHaveBeenCalled()
    expect(copyExecutableBinary).not.toHaveBeenCalled()
    expect(info).toHaveBeenCalledWith(
      'jlo main@0123456789ab already cached; skipping build.',
    )
    expect(info).toHaveBeenCalledWith('jlo installed: jlo main')
  })

  it('fetches required submodules with submodule token', async () => {
    existsSync.mockReturnValue(false)
    buildCargoRelease.mockReturnValue(MOCK_BUILD_PATH)

    await installMainSource({
      token: 'token',
      submoduleToken: 'submodule-token',
      allowDarwinX8664Fallback: false,
      cacheRoot: '/cache',
      tempDirectory: '/tmp',
    })

    expect(info).toHaveBeenCalledWith(
      'Using submodule_token for required submodule fetch.',
    )
    expect(info).toHaveBeenCalledWith('jlo installed: jlo main')
  })

  it('fails when main install omits submodule token', async () => {
    await expect(
      installMainSource({
        token: 'token',
        allowDarwinX8664Fallback: false,
        cacheRoot: '/cache',
        tempDirectory: '/tmp',
      }),
    ).rejects.toThrow('main install requires submodule_token.')
  })

  it('fails and cleans up temp directory if submodule update fails', async () => {
    existsSync.mockReturnValue(false)
    updateGitHubSubmodules.mockImplementation(() => {
      throw new Error('Git fetch failed')
    })

    await expect(
      installMainSource({
        token: 'token',
        submoduleToken: 'submodule-token',
        allowDarwinX8664Fallback: false,
        cacheRoot: '/cache',
        tempDirectory: '/tmp',
      }),
    ).rejects.toThrow(
      'Failed to fetch required git submodules for source build (verify submodule_token can read submodule repositories): Git fetch failed',
    )

    expect(rmSync).toHaveBeenCalledWith(MOCK_CLONE_PATH, {
      recursive: true,
      force: true,
    })
  })

  it('fails when cargo is not installed on PATH', async () => {
    commandExists.mockImplementation((cmd) => cmd !== 'cargo')

    await expect(
      installMainSource({
        token: 'token',
        submoduleToken: 'submodule-token',
        allowDarwinX8664Fallback: false,
        cacheRoot: '/cache',
        tempDirectory: '/tmp',
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
        cacheRoot: '/cache',
        tempDirectory: '/tmp',
      }),
    ).rejects.toThrow('main install requires git on PATH.')
  })

  it('safely wraps non-Error strings thrown during submodule updates', async () => {
    existsSync.mockReturnValue(false)
    updateGitHubSubmodules.mockImplementation(() => {
      throw 'fatal: repository not found'
    })

    await expect(
      installMainSource({
        token: 'token',
        submoduleToken: 'submodule-token',
        allowDarwinX8664Fallback: false,
        cacheRoot: '/cache',
        tempDirectory: '/tmp',
      }),
    ).rejects.toThrow(
      /Failed to fetch required git submodules.*: fatal: repository not found/,
    )
  })
})
