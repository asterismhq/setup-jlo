import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  info,
  existsSync,
  commandExists,
  runGitWithOptionalAuth,
  isFullGitSha,
  normalizeGitHttpUsername,
  parseRepositorySlug,
  detectPlatformTuple,
  resolveCacheRoot,
  resolvePlatformCacheDirectory,
  ensureInstallDirectory,
  installBinaryOnPath,
  pruneSiblingInstallDirectories,
  detectBinaryVersion,
  buildCargoRelease,
  copyExecutableBinary,
  resolveGitHttpUsername,
} = vi.hoisted(() => ({
  info: vi.fn(),
  existsSync: vi.fn(),
  commandExists: vi.fn(),
  runGitWithOptionalAuth: vi.fn(),
  isFullGitSha: vi.fn(),
  normalizeGitHttpUsername: vi.fn(),
  parseRepositorySlug: vi.fn(),
  detectPlatformTuple: vi.fn(),
  resolveCacheRoot: vi.fn(),
  resolvePlatformCacheDirectory: vi.fn(),
  ensureInstallDirectory: vi.fn(),
  installBinaryOnPath: vi.fn(),
  pruneSiblingInstallDirectories: vi.fn(),
  detectBinaryVersion: vi.fn(),
  buildCargoRelease: vi.fn(),
  copyExecutableBinary: vi.fn(),
  resolveGitHttpUsername: vi.fn(),
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

vi.mock('../../src/adapters/process/git-cli', () => ({
  commandExists,
  runGitWithOptionalAuth,
  isFullGitSha,
  normalizeGitHttpUsername,
}))

vi.mock('../../src/adapters/github/github-git-http-username', () => ({
  resolveGitHttpUsername,
}))

vi.mock('../../src/domain/repository-slug', () => ({
  parseRepositorySlug,
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
    commandExists.mockReturnValue(true)
    resolveGitHttpUsername.mockResolvedValue('jlo-bot')
    normalizeGitHttpUsername.mockImplementation((value: string) => value)
    parseRepositorySlug.mockReturnValue({ owner: 'asterismhq', repo: 'jlo' })
    runGitWithOptionalAuth.mockReturnValue(
      '0123456789abcdef0123456789abcdef01234567\trefs/heads/main\n',
    )
    isFullGitSha.mockReturnValue(true)
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
      allowDarwinX8664Fallback: false,
    })

    expect(runGitWithOptionalAuth).toHaveBeenCalledWith({
      authUsername: 'jlo-bot',
      authToken: 'token',
      args: [
        'ls-remote',
        '--',
        'https://github.com/asterismhq/jlo.git',
        'refs/heads/main',
      ],
      operation: 'resolve source head SHA',
    })
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

  it('adds both ssh rewrite rules before updating submodules', async () => {
    existsSync.mockImplementation((path: string) => {
      if (path.endsWith('/jlo')) {
        return false
      }
      if (path.endsWith('/.gitmodules')) {
        return true
      }
      return false
    })
    buildCargoRelease.mockReturnValue('/tmp/jlo')

    await installMainSource({
      installToken: 'token',
      installSubmoduleToken: 'submodule-token',
      allowDarwinX8664Fallback: false,
    })

    expect(runGitWithOptionalAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        authUsername: 'jlo-bot',
        authToken: 'submodule-token',
        args: [
          'config',
          '--local',
          '--add',
          'url.https://github.com/.insteadOf',
          'git@github.com:',
        ],
      }),
    )
    expect(runGitWithOptionalAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        authUsername: 'jlo-bot',
        authToken: 'submodule-token',
        args: [
          'config',
          '--local',
          '--add',
          'url.https://github.com/.insteadOf',
          'ssh://git@github.com/',
        ],
      }),
    )
    expect(runGitWithOptionalAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        authUsername: 'jlo-bot',
        authToken: 'submodule-token',
        args: ['submodule', 'update', '--init', '--recursive', '--depth=1'],
      }),
    )
  })
})
