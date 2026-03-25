import * as core from '@actions/core'
import { readOptionalInput, readRequiredInput } from './action/inputs'
import { resolveInstallRequest } from './action/install-request'
import { emitInstallOutputs } from './action/outputs'
import { installMainSource } from './app/install-main-source'
import { installReleaseVersion } from './app/install-release'
import { parseVersionRef } from './domain/version-ref'

export function resolveInstallMode(versionRef: string): 'release-tag' | 'main' {
  return parseVersionRef(versionRef).kind
}

async function run(): Promise<void> {
  const token = readRequiredInput('token')
  const versionRef = readRequiredInput('version')
  const submoduleToken = readOptionalInput('submodule_token')

  const parsedVersion = parseVersionRef(versionRef)
  const installMode = parsedVersion.kind

  core.info(`Resolved version='${versionRef}' (${installMode}).`)

  emitInstallOutputs(versionRef, installMode)

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
      core.setFailed(error.stack || error.message)
      return
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      core.setFailed(error.message)
      return
    }

    core.setFailed(`Unhandled rejection: ${JSON.stringify(error)}`)
  })
}
