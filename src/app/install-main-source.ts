import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as core from '@actions/core'
import type { InstallRequest } from '../action/install-request'
import {
  copyExecutableBinary,
  detectBinaryVersion,
  ensureInstallDirectory,
  installBinaryOnPath,
  pruneSiblingInstallDirectories,
  resolveCacheRoot,
  resolvePlatformCacheDirectory,
} from '../adapters/cache/binary-install-cache'
import { resolveGitHttpUsername } from '../adapters/github/github-git-http-username'
import { buildCargoRelease } from '../adapters/process/cargo-build'
import {
  buildAuthenticatedGitHubRemoteUrl,
  commandExists,
  isFullGitSha,
  normalizeGitHttpUsername,
  runGitWithOptionalAuth,
} from '../adapters/process/git-cli'
import { JLO_RELEASE_REPOSITORY } from '../catalog/jlo'
import { detectPlatformTuple } from '../domain/platform'
import { parseRepositorySlug } from '../domain/repository-slug'

export async function installMainSource(
  request: InstallRequest,
): Promise<void> {
  if (!commandExists('cargo')) {
    throw new Error(
      'main-head install requires cargo on PATH. Provision Rust toolchain on the runner.',
    )
  }
  if (!commandExists('git')) {
    throw new Error('main-head install requires git on PATH.')
  }

  const releaseRepository = parseRepositorySlug(JLO_RELEASE_REPOSITORY)
  const sourceRemoteUrl = `https://github.com/${releaseRepository.owner}/${releaseRepository.repo}.git`
  const sourceRef = 'refs/heads/main'
  const sourceBranch = 'main'
  const sourceAuthUsername = isHttpRemote(sourceRemoteUrl)
    ? normalizeGitHttpUsername(
        await resolveGitHttpUsername(request.installToken),
      )
    : undefined
  const submoduleAuthUsername = request.installSubmoduleToken
    ? normalizeGitHttpUsername(
        await resolveGitHttpUsername(request.installSubmoduleToken),
      )
    : undefined

  const sourceAuthToken = isHttpRemote(sourceRemoteUrl)
    ? request.installToken
    : undefined
  const submoduleAuthToken = request.installSubmoduleToken
    ? request.installSubmoduleToken
    : undefined

  const sourceFetchRemoteUrl =
    sourceAuthToken && sourceAuthUsername
      ? buildAuthenticatedGitHubRemoteUrl({
          remoteUrl: sourceRemoteUrl,
          username: sourceAuthUsername,
          token: sourceAuthToken,
        })
      : sourceRemoteUrl

  core.info(
    `Resolving main source head from '${sourceRemoteUrl}' using git HTTP username '${sourceAuthUsername ?? 'anonymous'}'.`,
  )

  let lsRemoteOutput: string
  try {
    lsRemoteOutput = runGitWithOptionalAuth({
      authUsername: sourceAuthUsername,
      authToken: sourceAuthToken,
      args: ['ls-remote', '--', sourceFetchRemoteUrl, sourceRef],
      operation: 'resolve source head SHA',
    })
  } catch (error) {
    throw new Error(
      `Failed to resolve source head SHA from '${sourceRemoteUrl}' using git HTTP username '${sourceAuthUsername ?? 'anonymous'}'. Verify token can read source repository '${releaseRepository.owner}/${releaseRepository.repo}' and SSO authorization is active when required: ${(error as Error).message}`,
    )
  }
  const sha = lsRemoteOutput.trim().split(/\s+/)[0] ?? ''

  if (!isFullGitSha(sha)) {
    throw new Error(
      `Failed to resolve source head SHA from '${sourceRemoteUrl}' ref '${sourceRef}'.`,
    )
  }

  const platform = detectPlatformTuple()
  const shortSha = sha.slice(0, 12)
  const installKey = `main-${shortSha}`
  const cacheRoot = resolveCacheRoot(request)
  const platformDir = resolvePlatformCacheDirectory(cacheRoot, platform)
  const installDir = ensureInstallDirectory(platformDir, installKey)
  const binaryPath = join(installDir, 'jlo')

  if (existsSync(binaryPath)) {
    core.info(`jlo main@${shortSha} already cached; skipping build.`)
    pruneSiblingInstallDirectories(platformDir, installKey)
    installBinaryOnPath(installDir)
    core.info(`jlo installed: ${detectBinaryVersion(binaryPath)}`)
    return
  }

  const clonePath = mkdtempSync(
    join(request.runnerTemp ?? tmpdir(), 'setup-jlo-main-'),
  )

  try {
    runGitWithOptionalAuth({
      authUsername: sourceAuthUsername,
      authToken: sourceAuthToken,
      args: [
        'clone',
        '--quiet',
        '--depth=1',
        '--branch',
        sourceBranch,
        '--',
        sourceFetchRemoteUrl,
        clonePath,
      ],
      operation: 'clone source branch for source build',
    })

    const gitmodulesPath = join(clonePath, '.gitmodules')
    if (existsSync(gitmodulesPath)) {
      if (request.installSubmoduleToken) {
        core.info('Using submodule_token for submodule fetch authentication.')
      } else {
        core.info(
          'submodule_token is empty; attempting anonymous submodule fetch.',
        )
      }

      runGitWithOptionalAuth({
        cwd: clonePath,
        authUsername: submoduleAuthUsername,
        authToken: submoduleAuthToken,
        args: [
          'config',
          '--local',
          '--add',
          'url.https://github.com/.insteadOf',
          'https://github.com/',
        ],
        operation: 'configure git submodule URL rewrite for source build',
      })
      runGitWithOptionalAuth({
        cwd: clonePath,
        authUsername: submoduleAuthUsername,
        authToken: submoduleAuthToken,
        args: [
          'config',
          '--local',
          '--add',
          'url.https://github.com/.insteadOf',
          'git@github.com:',
        ],
        operation: 'configure git submodule URL rewrite for source build',
      })
      runGitWithOptionalAuth({
        cwd: clonePath,
        authUsername: submoduleAuthUsername,
        authToken: submoduleAuthToken,
        args: [
          'config',
          '--local',
          '--add',
          'url.https://github.com/.insteadOf',
          'ssh://git@github.com/',
        ],
        operation: 'configure git submodule URL rewrite for source build',
      })

      runGitWithOptionalAuth({
        cwd: clonePath,
        authUsername: submoduleAuthUsername,
        authToken: submoduleAuthToken,
        args: ['submodule', 'sync', '--recursive'],
        operation: 'sync git submodule configuration for source build',
      })

      try {
        runGitWithOptionalAuth({
          cwd: clonePath,
          authUsername: submoduleAuthUsername,
          authToken: submoduleAuthToken,
          args: ['submodule', 'update', '--init', '--recursive', '--depth=1'],
          operation: 'fetch git submodules for source build',
        })
      } catch (error) {
        if (request.installSubmoduleToken) {
          throw new Error(
            `Failed to fetch git submodules for source build (verify submodule_token can read submodule repositories): ${(error as Error).message}`,
          )
        }
        throw new Error(
          `Failed to fetch git submodules for source build without credentials. Configure setup-jlo submodule_token for private submodules: ${(error as Error).message}`,
        )
      }
    }

    const buildTargetDir = join(clonePath, 'target')
    const manifestPath = join(clonePath, 'Cargo.toml')
    const builtBinary = buildCargoRelease({
      cwd: clonePath,
      manifestPath,
      buildTargetDir,
      sourceBranch,
      sourceRemoteUrl,
    })

    copyExecutableBinary(builtBinary, binaryPath)
  } finally {
    rmSync(clonePath, { recursive: true, force: true })
  }

  pruneSiblingInstallDirectories(platformDir, installKey)
  installBinaryOnPath(installDir)
  core.info(`jlo installed: ${detectBinaryVersion(binaryPath)}`)
}

function isHttpRemote(remote: string): boolean {
  return remote.startsWith('http://') || remote.startsWith('https://')
}
