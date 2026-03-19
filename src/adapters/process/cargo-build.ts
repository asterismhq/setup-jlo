import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

export function buildCargoRelease(options: {
  cwd: string
  manifestPath: string
  buildTargetDir: string
  sourceBranch: string
  sourceRemoteUrl: string
}): string {
  const buildResult = spawnSync(
    'cargo',
    ['build', '--release', '--manifest-path', options.manifestPath],
    {
      cwd: options.cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        CARGO_TARGET_DIR: options.buildTargetDir,
      },
    },
  )

  if (buildResult.status !== 0) {
    throw new Error(
      `Failed to build jlo from source branch '${options.sourceBranch}' in '${options.sourceRemoteUrl}': ${buildResult.stderr.trim()}`,
    )
  }

  const builtBinary = join(options.buildTargetDir, 'release', 'jlo')
  if (!existsSync(builtBinary)) {
    throw new Error(
      `Source build completed but binary not found at '${builtBinary}'.`,
    )
  }

  return builtBinary
}
