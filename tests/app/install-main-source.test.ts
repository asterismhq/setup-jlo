import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  info,
  existsSync,
  resolveGitHubHttpUsername,
  commandExists,
  resolveGitHubBranchHeadSha,
  cloneGitHubBranch,
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
} = vi.hoisted(() => ({
  info: vi.fn(),
  existsSync: vi.fn(),
  resolveGitHubHttpUsername: vi.fn(),
  commandExists: vi.fn(),
  resolveGitHubBranchHeadSha: vi.fn(),
  cloneGitHubBranch: vi.fn(),
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
}))

vi.mock('@actions/core', () => ({
  info,
}))

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  return {
    ...actual,
    existsSync,
  }
})

vi.mock('../../src/adapters/github/github-git-http-username', () => ({
  resolveGitHubHttpUsername,
}))

vi.mock('../../src/adapters/process/github-source-git', () => ({
  commandExists,
  resolveGitHubBranchHeadSha,
  cloneGitHubBranch,
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
    resolveGitHubBranchHeadSha.mockReturnValue(
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
  })

  it('reuses cached main binary and skips clone/build', async () => {
    await installMainSource({
      installToken: 'token',
      installSubmoduleToken: 'submodule-token',
      allowDarwinX8664Fallback: false,
    })

    expect(resolveGitHubBranchHeadSha).toHaveBeenCalledWith({
      repository: 'asterismhq/jlo',
      branch: 'main',
      token: 'token',
      username: 'jlo-user',
    })
    expect(cloneGitHubBranch).not.toHaveBeenCalled()
    expect(updateGitHubSubmodules).not.toHaveBeenCalled()
    expect(buildCargoRelease).not.toHaveBeenCalled()
    expect(copyExecutableBinary).not.toHaveBeenCalled()
    expect(pruneSiblingInstallDirectories).toHaveBeenCalledWith(
      '/cache/linux-x86_64',
      'main-0123456789ab',
    )
    expect(installBinaryOnPath).toHaveBeenCalledWith(
      '/cache/linux-x86_64/main-0123456789ab',
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

    expect(cloneGitHubBranch).toHaveBeenCalledWith({
      repository: 'asterismhq/jlo',
      branch: 'main',
      destination: expect.any(String),
      token: 'token',
      username: 'jlo-user',
    })
    expect(updateGitHubSubmodules).toHaveBeenCalledWith({
      cwd: expect.any(String),
      token: 'submodule-token',
      username: 'jlo-user',
    })
  })

  it('fails when main install omits submodule token', async () => {
    await expect(
      installMainSource({
        installToken: 'token',
        allowDarwinX8664Fallback: false,
      }),
    ).rejects.toThrow('main install requires submodule_token.')
  })
})
