import { resolve } from 'node:path'

export interface InstallContext {
  installToken: string
  installSubmoduleToken?: string
  targetBranch: string
  releaseRepository: string
  mainSourceRemoteUrl?: string
  mainSourceRef?: string
  mainSourceBranch?: string
  allowDarwinX8664Fallback: boolean
  cacheRootOverride?: string
  runnerEnvironment?: string
  runnerTemp?: string
  runnerToolCache?: string
}

export function resolveInstallContext(options: {
  token: string
  submoduleToken?: string
  targetBranch: string
  releaseRepository: string
}): InstallContext {
  return {
    installToken: options.token,
    installSubmoduleToken: normalizeOptionalEnv(options.submoduleToken),
    targetBranch: options.targetBranch,
    releaseRepository: options.releaseRepository,
    mainSourceRemoteUrl: normalizeOptionalEnv(process.env.JLO_MAIN_SOURCE_REMOTE_URL),
    mainSourceRef: normalizeOptionalEnv(process.env.JLO_MAIN_SOURCE_REF),
    mainSourceBranch: normalizeOptionalEnv(process.env.JLO_MAIN_SOURCE_BRANCH),
    allowDarwinX8664Fallback: parseBooleanEnv(
      process.env.JLO_ALLOW_DARWIN_X86_64_FALLBACK
    ),
    cacheRootOverride: normalizeOptionalEnv(process.env.JLO_CACHE_ROOT),
    runnerEnvironment: normalizeOptionalEnv(process.env.RUNNER_ENVIRONMENT),
    runnerTemp: normalizeOptionalEnv(process.env.RUNNER_TEMP),
    runnerToolCache: normalizeOptionalEnv(process.env.RUNNER_TOOL_CACHE)
  }
}

export function resolveCacheRoot(context: InstallContext): string {
  if (context.cacheRootOverride) {
    return context.cacheRootOverride
  }

  if (context.runnerEnvironment === 'github-hosted') {
    return resolve(context.runnerTemp ?? '/tmp', 'jlo-bin-cache')
  }

  const homeDirectory = normalizeOptionalEnv(process.env.HOME)
  const base =
    context.runnerToolCache ??
    (homeDirectory ? resolve(homeDirectory, '.cache') : '/tmp')

  return resolve(base, 'jlo-bin-cache')
}

function normalizeOptionalEnv(value: string | undefined): string | undefined {
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
