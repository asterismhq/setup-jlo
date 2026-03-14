import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import * as core from '@actions/core'
import { getOptionalInput, getRequiredInput } from './action-inputs'
import { parseRepositorySlug, readTextFileFromBranch } from './github-client'
import { parseVersionToken } from './version-token'

type InstallerTarget = 'x86_64' | 'aarch64'
type InstallerOs = 'linux' | 'darwin'

export function resolveInstallMode(token: string): 'release-tag' | 'main' {
  return parseVersionToken(token).kind === 'release' ? 'release-tag' : 'main'
}

function detectInstallerPlatform(): { os: InstallerOs; arch: InstallerTarget } {
  const nodePlatform = process.platform
  const nodeArch = process.arch

  let os: InstallerOs
  if (nodePlatform === 'linux') {
    os = 'linux'
  } else if (nodePlatform === 'darwin') {
    os = 'darwin'
  } else {
    throw new Error(`Unsupported OS for installer bootstrap: ${nodePlatform}`)
  }

  let arch: InstallerTarget
  if (nodeArch === 'x64') {
    arch = 'x86_64'
  } else if (nodeArch === 'arm64') {
    arch = 'aarch64'
  } else {
    throw new Error(`Unsupported architecture for installer bootstrap: ${nodeArch}`)
  }

  return { os, arch }
}

function buildInstallerAssetCandidates(
  os: InstallerOs,
  arch: InstallerTarget
): string[] {
  if (arch === 'x86_64') {
    return [`jlo-installer-${os}-x86_64`, `jlo-installer-${os}-amd64`]
  }
  return [`jlo-installer-${os}-aarch64`, `jlo-installer-${os}-arm64`]
}

async function fetchInstallerAsset(options: {
  token: string
  releaseRepository: string
  installerReleaseTag?: string
  candidates: string[]
}): Promise<Buffer> {
  const { token, releaseRepository, installerReleaseTag, candidates } = options
  const { owner, repo } = parseRepositorySlug(releaseRepository)
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'setup-jlo'
  }

  const releaseUrl = installerReleaseTag
    ? `https://api.github.com/repos/${owner}/${repo}/releases/tags/${installerReleaseTag}`
    : `https://api.github.com/repos/${owner}/${repo}/releases/latest`

  const releaseResponse = await fetch(releaseUrl, { headers })
  if (!releaseResponse.ok) {
    throw new Error(
      `Failed to query installer release metadata from '${releaseRepository}' (HTTP ${releaseResponse.status}).`
    )
  }

  const releaseJson = (await releaseResponse.json()) as {
    assets?: Array<{ id: number; name: string }>
  }

  const assets = releaseJson.assets ?? []
  const matched = candidates
    .map((candidate) => assets.find((asset) => asset.name === candidate))
    .find((asset): asset is { id: number; name: string } => asset !== undefined)

  if (!matched) {
    throw new Error(
      `No matching installer asset for ${candidates.join(', ')} in '${releaseRepository}'.`
    )
  }

  const downloadResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/assets/${matched.id}`,
    {
      headers: {
        ...headers,
        Accept: 'application/octet-stream'
      }
    }
  )

  if (!downloadResponse.ok) {
    throw new Error(
      `Failed to download installer asset '${matched.name}' (HTTP ${downloadResponse.status}).`
    )
  }

  const arrayBuffer = await downloadResponse.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function resolveInstallerBinary(options: {
  token: string
  releaseRepository: string
  installerReleaseTag?: string
}): Promise<{ path: string; cleanup: () => void }> {
  const bootstrapPath = process.env.JLO_INSTALLER_BOOTSTRAP_BIN
  if (bootstrapPath && bootstrapPath.trim().length > 0) {
    return { path: bootstrapPath, cleanup: () => undefined }
  }

  const platform = detectInstallerPlatform()
  const candidates = buildInstallerAssetCandidates(platform.os, platform.arch)
  const installerBinary = await fetchInstallerAsset({
    token: options.token,
    releaseRepository: options.releaseRepository,
    installerReleaseTag: options.installerReleaseTag,
    candidates
  })

  const directory = mkdtempSync(join(tmpdir(), 'jlo-installer-'))
  const binaryPath = join(directory, 'jlo-installer')
  writeFileSync(binaryPath, installerBinary)
  chmodSync(binaryPath, 0o755)

  return {
    path: binaryPath,
    cleanup: () => rmSync(directory, { recursive: true, force: true })
  }
}

async function run(): Promise<void> {
  const token = getRequiredInput('token')
  const submoduleToken = getOptionalInput('submodule_token')
  const repository = getOptionalInput('repository') ?? process.env.GITHUB_REPOSITORY
  const targetBranch = getOptionalInput('target_branch') ?? process.env.JLO_TARGET_BRANCH
  const releaseRepository = getOptionalInput('release_repository') ?? 'asterismhq/jlo'

  if (!repository) {
    throw new Error('Input or environment for repository is required.')
  }
  if (!targetBranch) {
    throw new Error('Input or environment for target_branch is required.')
  }

  const versionFile = await readTextFileFromBranch({
    token,
    repository,
    branch: targetBranch,
    path: '.jlo/.jlo-version'
  })
  const versionToken = versionFile.trim()

  const installMode = resolveInstallMode(versionToken)
  core.info(
    `Resolved .jlo/.jlo-version='${versionToken}' from ${repository}@${targetBranch} (${installMode}).`
  )

  core.setOutput('version-token', versionToken)
  core.setOutput('install-mode', installMode)

  const installer = await resolveInstallerBinary({
    token,
    releaseRepository,
    installerReleaseTag: process.env.JLO_INSTALLER_RELEASE_TAG
  })

  try {
    const result = spawnSync(installer.path, ['install'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        INSTALL_JLO_TOKEN: token,
        INSTALL_JLO_SUBMODULE_TOKEN: submoduleToken ?? ''
      }
    })

    if (typeof result.status === 'number' && result.status !== 0) {
      throw new Error(`Installer failed with exit code ${result.status}.`)
    }

    if (result.error) {
      throw result.error
    }
  } finally {
    installer.cleanup()
  }
}

if (require.main === module) {
  run().catch((error: unknown) => {
    if (error instanceof Error) {
      core.setFailed(error.message)
      return
    }
    core.setFailed(String(error))
  })
}
