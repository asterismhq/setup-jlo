import {
  mkdtempSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import * as core from '@actions/core'
import type { InstallRequest } from '../action/install-request'
import {
  detectBinaryVersion,
  ensureExecutablePermissions,
  ensureInstallDirectory,
  installBinaryOnPath,
  isCachedBinaryForVersion,
  pruneSiblingInstallDirectories,
  resolvePlatformCacheDirectory,
} from '../adapters/cache/binary-install-cache'
import { fetchReleaseAsset } from '../adapters/github/release-asset-api'
import { JLO_REPOSITORY } from '../catalog/jlo'
import {
  buildReleaseAssetCandidates,
  detectPlatformTuple,
} from '../domain/platform'
import type { ParsedVersionToken } from '../domain/version-token'

export async function installReleaseVersion(
  request: InstallRequest,
  versionToken: Extract<ParsedVersionToken, { kind: 'release' }>,
): Promise<void> {
  const platform = detectPlatformTuple()
  const cacheRoot = request.cacheRoot
  const platformDir = resolvePlatformCacheDirectory(cacheRoot, platform)
  const installDir = ensureInstallDirectory(platformDir, versionToken.tag)
  const binaryPath = join(installDir, 'jlo')

  if (isCachedBinaryForVersion(binaryPath, versionToken.version)) {
    core.info(`jlo ${versionToken.version} already cached; skipping download.`)
    pruneSiblingInstallDirectories(platformDir, versionToken.tag)
    installBinaryOnPath(installDir)
    core.info(`jlo installed: ${detectBinaryVersion(binaryPath)}`)
    return
  }

  const candidates = buildReleaseAssetCandidates(
    platform,
    request.allowDarwinX8664Fallback,
  )
  const releaseAsset = await fetchReleaseAsset({
    token: request.token,
    releaseRepository: JLO_REPOSITORY,
    tagVersion: versionToken.tag,
    candidates,
  })

  const tempDirectory = mkdtempSync(
    join(request.tempDirectory, 'setup-jlo-release-'),
  )
  const downloadPath = join(tempDirectory, releaseAsset.name)

  try {
    writeFileSync(downloadPath, releaseAsset.contents)
    if (statSync(downloadPath).size === 0) {
      throw new Error(
        `Downloaded release asset '${releaseAsset.name}' is missing or empty in '${JLO_REPOSITORY}' (${versionToken.tag}).`,
      )
    }

    ensureExecutablePermissions(downloadPath)
    renameSync(downloadPath, binaryPath)
  } finally {
    rmSync(tempDirectory, { recursive: true, force: true })
  }

  pruneSiblingInstallDirectories(platformDir, versionToken.tag)
  installBinaryOnPath(installDir)
  core.info(`jlo installed: ${detectBinaryVersion(binaryPath)}`)
}
