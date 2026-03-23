import * as core from '@actions/core'

export function emitInstallOutputs(
  versionRef: string,
  installMode: 'release-tag' | 'main',
): void {
  core.setOutput('version-token', versionRef)
  core.setOutput('install-mode', installMode)
}
