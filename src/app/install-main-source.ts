import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import * as core from '@actions/core'
import type { InstallRequest } from '../action/install-request'
import {
  copyExecutableBinary,
  detectBinaryVersion,
  ensureInstallDirectory,
  installBinaryOnPath,
  pruneSiblingInstallDirectories,
  resolvePlatformCacheDirectory,
} from '../adapters/cache/binary-install-cache'
import { resolveGitHubHttpUsername } from '../adapters/github/github-git-http-username'
import { buildCargoRelease } from '../adapters/process/cargo-build'
import {
  cloneGitHubBranch,
  commandExists,
  resolveGitWorktreeHeadSha,
  updateGitHubSubmodules,
} from '../adapters/process/github-source-git'
import { JLO_REPOSITORY } from '../catalog/jlo'
import { detectPlatformTuple } from '../domain/platform'

export async function installMainSource(
  request: InstallRequest,
): Promise<void> {
  if (!commandExists('cargo')) {
    throw new Error(
      'main install requires cargo on PATH. Provision Rust toolchain on the runner.',
    )
  }
  if (!commandExists('git')) {
    throw new Error('main install requires git on PATH.')
  }

  const sourceBranch = 'main'
  if (!request.submoduleToken) {
    throw new Error('main install requires submodule_token.')
  }

  const sourceAuthUsernameResult = await resolveGitHubHttpUsername(
    request.token,
  )
  if (!sourceAuthUsernameResult.ok) {
    throw sourceAuthUsernameResult.error
  }
  const sourceAuthUsername = sourceAuthUsernameResult.value

  const submoduleAuthUsernameResult = await resolveGitHubHttpUsername(
    request.submoduleToken,
  )
  if (!submoduleAuthUsernameResult.ok) {
    throw submoduleAuthUsernameResult.error
  }
  const submoduleAuthUsername = submoduleAuthUsernameResult.value

  const clonePath = mkdtempSync(join(request.tempDirectory, 'setup-jlo-main-'))

  try {
    // Keep source acquisition on the same authenticated clone path used by builds.
    // A separate ls-remote path previously broke main-mode auth in CI.
    core.info(
      `Cloning ${JLO_REPOSITORY.owner}/${JLO_REPOSITORY.repo}@${sourceBranch} for source build.`,
    )

    const cloneResult = cloneGitHubBranch({
      repository: JLO_REPOSITORY,
      branch: sourceBranch,
      destination: clonePath,
      token: request.token,
      username: sourceAuthUsername,
    })
    if (!cloneResult.ok) {
      throw cloneResult.error
    }

    const shaResult = resolveGitWorktreeHeadSha({ cwd: clonePath })
    if (!shaResult.ok) {
      throw shaResult.error
    }
    const sha = shaResult.value

    const platform = detectPlatformTuple()
    const shortSha = sha.slice(0, 12)
    const installKey = `main-${shortSha}`
    const cacheRoot = request.cacheRoot
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

    core.info('Using submodule_token for required submodule fetch.')

    const updateResult = updateGitHubSubmodules({
      cwd: clonePath,
      token: request.submoduleToken,
      username: submoduleAuthUsername,
    })

    if (!updateResult.ok) {
      throw new Error(
        `Failed to fetch required git submodules for source build (verify submodule_token can read submodule repositories): ${updateResult.error.message}`,
      )
    }

    const buildTargetDir = join(clonePath, 'target')
    const manifestPath = join(clonePath, 'Cargo.toml')
    const builtBinary = buildCargoRelease({
      cwd: clonePath,
      manifestPath,
      buildTargetDir,
    })

    copyExecutableBinary(builtBinary, binaryPath)

    pruneSiblingInstallDirectories(platformDir, installKey)
    installBinaryOnPath(installDir)
    core.info(`jlo installed: ${detectBinaryVersion(binaryPath)}`)
  } finally {
    rmSync(clonePath, { recursive: true, force: true })
  }
}
