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
  const sourceBranch = 'main'
  if (!request.installSubmoduleToken) {
    throw new Error('main install requires submodule_token.')
  }

  const sourceAuthUsername = isHttpRemote(sourceRemoteUrl)
    ? normalizeGitHttpUsername(
        await resolveGitHttpUsername(request.installToken),
      )
    : undefined
  const submoduleAuthUsername = normalizeGitHttpUsername(
    await resolveGitHttpUsername(request.installSubmoduleToken),
  )

  const sourceAuthToken = isHttpRemote(sourceRemoteUrl)
    ? request.installToken
    : undefined
  const submoduleAuthToken = request.installSubmoduleToken

  const sourceFetchRemoteUrl =
    sourceAuthToken && sourceAuthUsername
      ? buildAuthenticatedGitHubRemoteUrl({
          remoteUrl: sourceRemoteUrl,
          username: sourceAuthUsername,
          token: sourceAuthToken,
        })
      : sourceRemoteUrl
  const clonePath = mkdtempSync(
    join(request.runnerTemp ?? tmpdir(), 'setup-jlo-main-'),
  )

  try {
    core.info(
      `Cloning main source from '${sourceRemoteUrl}' using git HTTP username '${sourceAuthUsername ?? 'anonymous'}'.`,
    )

    runGitWithOptionalAuth({
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

    const sha = runGitWithOptionalAuth({
      cwd: clonePath,
      args: ['rev-parse', 'HEAD'],
      operation: 'resolve cloned source head SHA',
    }).trim()

    if (!isFullGitSha(sha)) {
      throw new Error(
        `Failed to resolve source head SHA from cloned branch '${sourceBranch}' in '${sourceRemoteUrl}'.`,
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

    const gitmodulesPath = join(clonePath, '.gitmodules')
    if (!existsSync(gitmodulesPath)) {
      throw new Error(
        `main source repository '${releaseRepository.owner}/${releaseRepository.repo}' is missing required .gitmodules.`,
      )
    }

    core.info('Using submodule_token for required submodule fetch.')

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
      throw new Error(
        `Failed to fetch required git submodules for source build (verify submodule_token can read submodule repositories): ${(error as Error).message}`,
      )
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

    pruneSiblingInstallDirectories(platformDir, installKey)
    installBinaryOnPath(installDir)
    core.info(`jlo installed: ${detectBinaryVersion(binaryPath)}`)
  } finally {
    rmSync(clonePath, { recursive: true, force: true })
  }
}

function isHttpRemote(remote: string): boolean {
  return remote.startsWith('http://') || remote.startsWith('https://')
}
