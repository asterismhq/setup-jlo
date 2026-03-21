import * as core from '@actions/core'
import { readOptionalInput, readRequiredInput } from './action/inputs'
import { resolveInstallRequest } from './action/install-request'
import { emitInstallOutputs } from './action/outputs'
import { installMainSource } from './app/install-main-source'
import { installReleaseVersion } from './app/install-release'
import { parseVersionToken } from './domain/version-token'

export function resolveInstallMode(
  versionToken: string,
): 'release-tag' | 'main' {
  return parseVersionToken(versionToken).kind
}

async function run(): Promise<void> {
  const token = readRequiredInput('token')
  const versionToken = readRequiredInput('version')
  const submoduleToken = readOptionalInput('submodule_token')

  const parsedVersion = parseVersionToken(versionToken)
  const installMode = parsedVersion.kind

  core.info(`Resolved version='${versionToken}' (${installMode}).`)

  emitInstallOutputs(versionToken, installMode)

  const installRequest = resolveInstallRequest({
    token,
    submoduleToken,
  })

  if (parsedVersion.kind === 'release-tag') {
    await installReleaseVersion(installRequest, parsedVersion)
    return
  }

  await installMainSource(installRequest)
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
