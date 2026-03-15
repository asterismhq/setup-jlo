import * as core from '@actions/core'
import { getOptionalInput, getRequiredInput } from './action-inputs'
import { readTextFileFromBranch } from './github-client'
import { resolveInstallContext } from './install-context'
import { installReleaseVersion } from './release-install'
import { installMainSource } from './source-install'
import { parseVersionToken } from './version-token'

export function resolveInstallMode(token: string): 'release-tag' | 'main' {
  return parseVersionToken(token).kind === 'release' ? 'release-tag' : 'main'
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
  const parsedVersion = parseVersionToken(versionToken)

  core.info(
    `Resolved .jlo/.jlo-version='${versionToken}' from ${repository}@${targetBranch} (${installMode}).`
  )

  core.setOutput('version-token', versionToken)
  core.setOutput('install-mode', installMode)

  const installContext = resolveInstallContext({
    token,
    submoduleToken,
    targetBranch,
    releaseRepository
  })

  if (parsedVersion.kind === 'release') {
    await installReleaseVersion(installContext, parsedVersion)
    return
  }

  await installMainSource(installContext)
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
