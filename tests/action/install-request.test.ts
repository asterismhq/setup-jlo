import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveInstallRequest } from '../../src/action/install-request'

const ENV_KEYS = [
  'JLO_ALLOW_DARWIN_X86_64_FALLBACK',
  'JLO_CACHE_ROOT',
  'RUNNER_ENVIRONMENT',
  'RUNNER_TEMP',
  'RUNNER_TOOL_CACHE',
] as const

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('action install request normalization', () => {
  it('normalizes environment values and booleans', () => {
    for (const key of ENV_KEYS) {
      vi.stubEnv(key, '')
    }
    vi.stubEnv('JLO_ALLOW_DARWIN_X86_64_FALLBACK', 'true')
    vi.stubEnv('JLO_CACHE_ROOT', ' /tmp/cache ')
    vi.stubEnv('RUNNER_ENVIRONMENT', ' github-hosted ')
    vi.stubEnv('RUNNER_TEMP', ' /tmp/runner ')
    vi.stubEnv('RUNNER_TOOL_CACHE', ' /opt/toolcache ')

    const request = resolveInstallRequest({
      token: ' install-token ',
      submoduleToken: ' submodule-token ',
    })

    expect(request).toEqual({
      installToken: ' install-token ',
      installSubmoduleToken: 'submodule-token',
      allowDarwinX8664Fallback: true,
      cacheRootOverride: '/tmp/cache',
      runnerEnvironment: 'github-hosted',
      runnerTemp: '/tmp/runner',
      runnerToolCache: '/opt/toolcache',
    })
  })
})
