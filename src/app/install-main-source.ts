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
import { buildCargoRelease } from '../adapters/process/cargo-build'
import {
  basicAuthHeader,
  commandExists,
  isFullGitSha,
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
  const defaultSourceRemoteUrl = `https://github.com/${releaseRepository.owner}/${releaseRepository.repo}.git`
  const sourceRemoteUrl = request.mainSourceRemoteUrl ?? defaultSourceRemoteUrl
  const sourceRef = 'refs/heads/main'
  const sourceBranch = 'main'

  const sourceAuthHeader = isHttpRemote(sourceRemoteUrl)
    ? basicAuthHeader(request.installToken)
    : undefined
  const submoduleAuthHeader = request.installSubmoduleToken
    ? basicAuthHeader(request.installSubmoduleToken)
    : undefined

  const lsRemoteOutput = runGitWithOptionalAuth({
    authHeader: sourceAuthHeader,
    args: ['ls-remote', '--', sourceRemoteUrl, sourceRef],
    operation: 'resolve source head SHA',
  })
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
      authHeader: sourceAuthHeader,
      args: [
        'clone',
        '--quiet',
        '--depth=1',
        '--branch',
        sourceBranch,
        '--',
        sourceRemoteUrl,
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
        authHeader: submoduleAuthHeader,
        args: [
          'config',
          '--local',
          'url.https://github.com/.insteadOf',
          'git@github.com:',
        ],
        operation: 'configure git submodule URL rewrite for source build',
      })
      runGitWithOptionalAuth({
        cwd: clonePath,
        authHeader: submoduleAuthHeader,
        args: [
          'config',
          '--local',
          'url.https://github.com/.insteadOf',
          'ssh://git@github.com/',
        ],
        operation: 'configure git submodule URL rewrite for source build',
      })

      runGitWithOptionalAuth({
        cwd: clonePath,
        authHeader: submoduleAuthHeader,
        args: ['submodule', 'sync', '--recursive'],
        operation: 'sync git submodule configuration for source build',
      })

      try {
        runGitWithOptionalAuth({
          cwd: clonePath,
          authHeader: submoduleAuthHeader,
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
