import * as core from '@actions/core'

export function emitInstallOutputs(
  versionToken: string,
  installMode: 'release-tag' | 'main',
): void {
  core.setOutput('version-token', versionToken)
  core.setOutput('install-mode', installMode)
}
