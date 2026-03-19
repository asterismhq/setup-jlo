export interface InstallRequest {
  installToken: string
  installSubmoduleToken?: string
  mainSourceRemoteUrl?: string
  mainSourceRef?: string
  mainSourceBranch?: string
  allowDarwinX8664Fallback: boolean
  cacheRootOverride?: string
  runnerEnvironment?: string
  runnerTemp?: string
  runnerToolCache?: string
}

export function resolveInstallRequest(options: {
  token: string
  submoduleToken?: string
}): InstallRequest {
  return {
    installToken: options.token,
    installSubmoduleToken: normalizeOptional(options.submoduleToken),
    mainSourceRemoteUrl: normalizeOptional(
      process.env.JLO_MAIN_SOURCE_REMOTE_URL,
    ),
    mainSourceRef: normalizeOptional(process.env.JLO_MAIN_SOURCE_REF),
    mainSourceBranch: normalizeOptional(process.env.JLO_MAIN_SOURCE_BRANCH),
    allowDarwinX8664Fallback: parseBooleanEnv(
      process.env.JLO_ALLOW_DARWIN_X86_64_FALLBACK,
    ),
    cacheRootOverride: normalizeOptional(process.env.JLO_CACHE_ROOT),
    runnerEnvironment: normalizeOptional(process.env.RUNNER_ENVIRONMENT),
    runnerTemp: normalizeOptional(process.env.RUNNER_TEMP),
    runnerToolCache: normalizeOptional(process.env.RUNNER_TOOL_CACHE),
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
