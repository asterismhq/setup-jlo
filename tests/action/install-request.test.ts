import { afterEach, describe, expect, it } from 'vitest'
import { resolveInstallRequest } from '../../src/action/install-request'

const ENV_KEYS = [
  'JLO_MAIN_SOURCE_REMOTE_URL',
  'JLO_MAIN_SOURCE_REF',
  'JLO_MAIN_SOURCE_BRANCH',
  'JLO_ALLOW_DARWIN_X86_64_FALLBACK',
  'JLO_CACHE_ROOT',
  'RUNNER_ENVIRONMENT',
  'RUNNER_TEMP',
  'RUNNER_TOOL_CACHE'
] as const

const previousEnv = new Map<string, string | undefined>()
for (const key of ENV_KEYS) {
  previousEnv.set(key, process.env[key])
}

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = previousEnv.get(key)
    if (value === undefined) {
      delete process.env[key]
      continue
    }
    process.env[key] = value
  }
})

describe('action install request normalization', () => {
  it('normalizes environment values and booleans', () => {
    process.env.JLO_MAIN_SOURCE_REMOTE_URL = ' https://example.com/repo.git '
    process.env.JLO_MAIN_SOURCE_REF = ' refs/heads/main '
    process.env.JLO_MAIN_SOURCE_BRANCH = ' main '
    process.env.JLO_ALLOW_DARWIN_X86_64_FALLBACK = 'true'
    process.env.JLO_CACHE_ROOT = ' /tmp/cache '
    process.env.RUNNER_ENVIRONMENT = ' github-hosted '
    process.env.RUNNER_TEMP = ' /tmp/runner '
    process.env.RUNNER_TOOL_CACHE = ' /opt/toolcache '

    const request = resolveInstallRequest({
      token: ' install-token ',
      submoduleToken: ' submodule-token '
    })

    expect(request).toEqual({
      installToken: ' install-token ',
      installSubmoduleToken: 'submodule-token',
      mainSourceRemoteUrl: 'https://example.com/repo.git',
      mainSourceRef: 'refs/heads/main',
      mainSourceBranch: 'main',
      allowDarwinX8664Fallback: true,
      cacheRootOverride: '/tmp/cache',
      runnerEnvironment: 'github-hosted',
      runnerTemp: '/tmp/runner',
      runnerToolCache: '/opt/toolcache'
    })
  })
})