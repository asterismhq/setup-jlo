import * as core from '@actions/core'

export function emitInstallOutputs(
  versionRef: string,
  installMode: 'release-tag' | 'main',
): void {
  core.setOutput('version-ref', versionRef)
  core.setOutput('install-mode', installMode)
}
