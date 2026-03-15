import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import * as core from '@actions/core'
import type { InstallContext } from './install-context'
import { resolveCacheRoot } from './install-context'
import {
  copyExecutableBinary,
  detectBinaryVersion,
  ensureInstallDirectory,
  installBinaryOnPath,
  pruneSiblingInstallDirectories,
  resolvePlatformCacheDirectory
} from './cache-paths'
import {
  basicAuthHeader,
  commandExists,
  isFullGitSha,
  runGitWithOptionalAuth
} from './git-process'
import { parseRepositorySlug } from './github-client'
import { detectPlatformTuple } from './platform'

export async function installMainSource(context: InstallContext): Promise<void> {
  if (!commandExists('cargo')) {
    throw new Error(
      'main-head install requires cargo on PATH. Provision Rust toolchain on the runner.'
    )
  }
  if (!commandExists('git')) {
    throw new Error('main-head install requires git on PATH.')
  }

  const releaseRepository = parseRepositorySlug(context.releaseRepository)
  const defaultSourceRemoteUrl = `https://github.com/${releaseRepository.owner}/${releaseRepository.repo}.git`
  const sourceRemoteUrl = context.mainSourceRemoteUrl ?? defaultSourceRemoteUrl
  const sourceRef = context.mainSourceRef ?? 'refs/heads/main'
  const sourceBranch = context.mainSourceBranch ?? 'main'

  const sourceAuthHeader = isHttpRemote(sourceRemoteUrl)
    ? basicAuthHeader(context.installToken)
    : undefined
  const submoduleAuthHeader = context.installSubmoduleToken
    ? basicAuthHeader(context.installSubmoduleToken)
    : undefined

  const lsRemoteOutput = runGitWithOptionalAuth({
    authHeader: sourceAuthHeader,
    args: ['ls-remote', '--', sourceRemoteUrl, sourceRef],
    operation: 'resolve source head SHA'
  })
  const sha = lsRemoteOutput.trim().split(/\s+/)[0] ?? ''

  if (!isFullGitSha(sha)) {
    throw new Error(
      `Failed to resolve source head SHA from '${sourceRemoteUrl}' ref '${sourceRef}'.`
    )
  }

  const platform = detectPlatformTuple()
  const shortSha = sha.slice(0, 12)
  const installKey = `main-${shortSha}`
  const cacheRoot = resolveCacheRoot(context)
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

  const clonePath = mkdtempSync(join(context.runnerTemp ?? tmpdir(), 'setup-jlo-main-'))

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
        clonePath
      ],
      operation: 'clone source branch for source build'
    })

    const gitmodulesPath = join(clonePath, '.gitmodules')
    if (existsSync(gitmodulesPath)) {
      if (context.installSubmoduleToken) {
        core.info('Using submodule_token for submodule fetch authentication.')
      } else {
        core.info('submodule_token is empty; attempting anonymous submodule fetch.')
      }

      runGitWithOptionalAuth({
        cwd: clonePath,
        authHeader: submoduleAuthHeader,
        args: [
          'config',
          '--local',
          'url.https://github.com/.insteadOf',
          'git@github.com:'
        ],
        operation: 'configure git submodule URL rewrite for source build'
      })
      runGitWithOptionalAuth({
        cwd: clonePath,
        authHeader: submoduleAuthHeader,
        args: [
          'config',
          '--local',
          'url.https://github.com/.insteadOf',
          'ssh://git@github.com/'
        ],
        operation: 'configure git submodule URL rewrite for source build'
      })

      runGitWithOptionalAuth({
        cwd: clonePath,
        authHeader: submoduleAuthHeader,
        args: ['submodule', 'sync', '--recursive'],
        operation: 'sync git submodule configuration for source build'
      })

      try {
        runGitWithOptionalAuth({
          cwd: clonePath,
          authHeader: submoduleAuthHeader,
          args: ['submodule', 'update', '--init', '--recursive', '--depth=1'],
          operation: 'fetch git submodules for source build'
        })
      } catch (error) {
        if (context.installSubmoduleToken) {
          throw new Error(
            `Failed to fetch git submodules for source build (verify submodule_token can read submodule repositories): ${(error as Error).message}`
          )
        }
        throw new Error(
          `Failed to fetch git submodules for source build without credentials. Configure setup-jlo submodule_token for private submodules: ${(error as Error).message}`
        )
      }
    }

    const buildTargetDir = join(clonePath, 'target')
    const manifestPath = join(clonePath, 'Cargo.toml')
    const buildResult = spawnSync(
      'cargo',
      ['build', '--release', '--manifest-path', manifestPath],
      {
        cwd: clonePath,
        encoding: 'utf8',
        env: {
          ...process.env,
          CARGO_TARGET_DIR: buildTargetDir
        }
      }
    )

    if (buildResult.status !== 0) {
      throw new Error(
        `Failed to build jlo from source branch '${sourceBranch}' in '${sourceRemoteUrl}': ${buildResult.stderr.trim()}`
      )
    }

    const builtBinary = join(buildTargetDir, 'release', 'jlo')
    if (!existsSync(builtBinary)) {
      throw new Error(
        `Source build completed but binary not found at '${builtBinary}'.`
      )
    }

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
