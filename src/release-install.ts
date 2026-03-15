import { mkdtempSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as core from '@actions/core'
import type { InstallContext } from './install-context'
import { resolveCacheRoot } from './install-context'
import {
  detectBinaryVersion,
  ensureExecutablePermissions,
  ensureInstallDirectory,
  installBinaryOnPath,
  isCachedBinaryForVersion,
  pruneSiblingInstallDirectories,
  resolvePlatformCacheDirectory
} from './cache-paths'
import { parseRepositorySlug } from './github-client'
import { JLO_RELEASE_REPOSITORY } from './jlo-release-source'
import { buildReleaseAssetCandidates, detectPlatformTuple } from './platform'
import type { ParsedVersionToken } from './version-token'

export async function installReleaseVersion(
  context: InstallContext,
  versionToken: Extract<ParsedVersionToken, { kind: 'release' }>
): Promise<void> {
  const platform = detectPlatformTuple()
  const cacheRoot = resolveCacheRoot(context)
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
    context.allowDarwinX8664Fallback
  )
  const releaseAsset = await fetchReleaseAsset({
    token: context.installToken,
    releaseRepository: JLO_RELEASE_REPOSITORY,
    tagVersion: versionToken.tag,
    candidates
  })

  const tempDirectory = mkdtempSync(
    join(context.runnerTemp ?? tmpdir(), 'setup-jlo-release-')
  )
  const downloadPath = join(tempDirectory, releaseAsset.name)

  try {
    writeFileSync(downloadPath, releaseAsset.contents)
    if (statSync(downloadPath).size === 0) {
      throw new Error(
        `Downloaded release asset '${releaseAsset.name}' is missing or empty in '${JLO_RELEASE_REPOSITORY}' (${versionToken.tag}).`
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

async function fetchReleaseAsset(options: {
  token: string
  releaseRepository: string
  tagVersion: string
  candidates: string[]
}): Promise<{ name: string; contents: Buffer }> {
  const { owner, repo } = parseRepositorySlug(options.releaseRepository)
  const headers = {
    Authorization: `Bearer ${options.token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'setup-jlo'
  }

  const metadataResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/tags/${options.tagVersion}`,
    { headers }
  )

  if (metadataResponse.status === 401 || metadataResponse.status === 403) {
    throw new Error(
      `JLO_RELEASE_PAT cannot access release metadata in '${options.releaseRepository}'. Ensure contents:read and organization SSO authorization.`
    )
  }
  if (metadataResponse.status === 404) {
    throw new Error(
      `Release '${options.tagVersion}' was not found (or is inaccessible) in '${options.releaseRepository}'.`
    )
  }
  if (!metadataResponse.ok) {
    throw new Error(
      `Failed to query release metadata for '${options.tagVersion}' in '${options.releaseRepository}' (HTTP ${metadataResponse.status}).`
    )
  }

  const metadata = (await metadataResponse.json()) as {
    assets?: Array<{ id: number; name: string }>
  }
  const matchedAsset = options.candidates
    .map((candidate) => metadata.assets?.find((asset) => asset.name === candidate))
    .find((asset): asset is { id: number; name: string } => asset !== undefined)

  if (!matchedAsset) {
    throw new Error(
      `No matching release asset for ${options.candidates.join(', ')} in '${options.releaseRepository}'.`
    )
  }

  const downloadResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/assets/${matchedAsset.id}`,
    {
      headers: {
        ...headers,
        Accept: 'application/octet-stream'
      }
    }
  )

  if (!downloadResponse.ok) {
    throw new Error(
      `Failed to download release asset '${matchedAsset.name}' from '${options.releaseRepository}' (HTTP ${downloadResponse.status}).`
    )
  }

  return {
    name: matchedAsset.name,
    contents: Buffer.from(await downloadResponse.arrayBuffer())
  }
}
