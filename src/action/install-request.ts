import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

export interface InstallRequest {
  token: string
  submoduleToken?: string
  allowDarwinX8664Fallback: boolean
  cacheRoot: string
  tempDirectory: string
}

export function resolveInstallRequest(options: {
  token: string
  submoduleToken?: string
}): InstallRequest {
  const allowDarwinX8664Fallback = parseBooleanEnv(
    process.env.JLO_ALLOW_DARWIN_X86_64_FALLBACK,
  )
  const cacheRootOverride = normalizeOptional(process.env.JLO_CACHE_ROOT)
  const runnerEnvironment = normalizeOptional(process.env.RUNNER_ENVIRONMENT)
  const runnerTemp = normalizeOptional(process.env.RUNNER_TEMP)
  const runnerToolCache = normalizeOptional(process.env.RUNNER_TOOL_CACHE)
  const homeDirectory = normalizeOptional(process.env.HOME)

  const tempDirectory = runnerTemp ?? tmpdir()

  let cacheRoot: string
  if (cacheRootOverride) {
    cacheRoot = cacheRootOverride
  } else if (runnerEnvironment === 'github-hosted') {
    cacheRoot = resolve(runnerTemp ?? tmpdir(), 'jlo-bin-cache')
  } else {
    const base =
      runnerToolCache ??
      (homeDirectory ? resolve(homeDirectory, '.cache') : tmpdir())
    cacheRoot = resolve(base, 'jlo-bin-cache')
  }

  return {
    token: options.token,
    submoduleToken: normalizeOptional(options.submoduleToken),
    allowDarwinX8664Fallback,
    cacheRoot,
    tempDirectory,
  }
}

function normalizeOptional(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function parseBooleanEnv(value: string | undefined): boolean {
  if (!value) {
    return false
  }

  switch (value.trim().toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return true
    default:
      return false
  }
}
