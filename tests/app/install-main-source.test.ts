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
  resolveCacheRoot,
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
  resolveCacheRoot: vi.fn(),
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
  resolveCacheRoot,
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
  beforeEach(() => {
    vi.clearAllMocks()
    resolveGitHubHttpUsername.mockResolvedValue('jlo-user')
    commandExists.mockReturnValue(true)
    resolveGitWorktreeHeadSha.mockReturnValue(
      '0123456789abcdef0123456789abcdef01234567',
    )
    detectPlatformTuple.mockReturnValue({ os: 'linux', arch: 'x86_64' })
    resolveCacheRoot.mockReturnValue('/cache')
    resolvePlatformCacheDirectory.mockReturnValue('/cache/linux-x86_64')
    ensureInstallDirectory.mockReturnValue(
      '/cache/linux-x86_64/main-0123456789ab',
    )
    existsSync.mockReturnValue(true)
    detectBinaryVersion.mockReturnValue('jlo main')
    tmpdir.mockReturnValue('/tmp')
    mkdtempSync.mockReturnValue('/tmp/setup-jlo-main-1234')
  })

  it('reuses cached main binary and skips build', async () => {
    await installMainSource({
      installToken: 'token',
      installSubmoduleToken: 'submodule-token',
      allowDarwinX8664Fallback: false,
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
    buildCargoRelease.mockReturnValue('/tmp/jlo')

    await installMainSource({
      installToken: 'token',
      installSubmoduleToken: 'submodule-token',
      allowDarwinX8664Fallback: false,
    })

    expect(info).toHaveBeenCalledWith(
      'Using submodule_token for required submodule fetch.',
    )
    expect(info).toHaveBeenCalledWith('jlo installed: jlo main')
  })

  it('fails when main install omits submodule token', async () => {
    await expect(
      installMainSource({
        installToken: 'token',
        allowDarwinX8664Fallback: false,
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
        installToken: 'token',
        installSubmoduleToken: 'submodule-token',
        allowDarwinX8664Fallback: false,
      }),
    ).rejects.toThrow(
      'Failed to fetch required git submodules for source build (verify submodule_token can read submodule repositories): Git fetch failed',
    )

    expect(rmSync).toHaveBeenCalledWith('/tmp/setup-jlo-main-1234', {
      recursive: true,
      force: true,
    })
  })
})
