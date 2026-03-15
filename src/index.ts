import * as core from '@actions/core'
import { getOptionalInput, getRequiredInput } from './action-inputs'
import { resolveInstallContext } from './install-context'
import { installReleaseVersion } from './release-install'
import { installMainSource } from './source-install'
import { parseVersionToken } from './version-token'

export function resolveInstallMode(token: string): 'release-tag' | 'main' {
  return parseVersionToken(token).kind === 'release' ? 'release-tag' : 'main'
}

async function run(): Promise<void> {
  const token = getRequiredInput('token')
  const versionToken = getRequiredInput('version')
  const submoduleToken = getOptionalInput('submodule_token')

  const parsedVersion = parseVersionToken(versionToken)
  const installMode = parsedVersion.kind === 'release' ? 'release-tag' : 'main'

  core.info(`Resolved version='${versionToken}' (${installMode}).`)

  core.setOutput('version-token', versionToken)
  core.setOutput('install-mode', installMode)

  const installContext = resolveInstallContext({
    token,
    submoduleToken
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
