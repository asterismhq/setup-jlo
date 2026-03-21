import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveInstallRequest } from '../../src/action/install-request'

const ENV_KEYS = [
  'HOME',
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
  it('normalizes token and boolean values', () => {
    for (const key of ENV_KEYS) {
      vi.stubEnv(key, '')
    }
    vi.stubEnv('JLO_ALLOW_DARWIN_X86_64_FALLBACK', 'true')

    const request = resolveInstallRequest({
      token: ' install-token ',
      submoduleToken: ' submodule-token ',
    })

    expect(request).toEqual({
      token: ' install-token ',
      submoduleToken: 'submodule-token',
      allowDarwinX8664Fallback: true,
      cacheRoot: '/tmp/jlo-bin-cache',
      tempDirectory: tmpdir(),
    })
  })

  it('resolves cacheRoot using JLO_CACHE_ROOT override', () => {
    for (const key of ENV_KEYS) {
      vi.stubEnv(key, '')
    }
    vi.stubEnv('JLO_CACHE_ROOT', ' /tmp/cache ')
    vi.stubEnv('RUNNER_ENVIRONMENT', ' github-hosted ')
    vi.stubEnv('RUNNER_TEMP', ' /tmp/runner ')

    const request = resolveInstallRequest({
      token: 'token',
    })

    expect(request.cacheRoot).toBe('/tmp/cache')
    expect(request.tempDirectory).toBe('/tmp/runner')
  })

  it('resolves cacheRoot for github-hosted runners', () => {
    for (const key of ENV_KEYS) {
      vi.stubEnv(key, '')
    }
    vi.stubEnv('RUNNER_ENVIRONMENT', ' github-hosted ')
    vi.stubEnv('RUNNER_TEMP', ' /tmp/runner ')

    const request = resolveInstallRequest({
      token: 'token',
    })

    expect(request.cacheRoot).toBe(resolve('/tmp/runner', 'jlo-bin-cache'))
  })

  it('resolves cacheRoot for self-hosted runners using RUNNER_TOOL_CACHE', () => {
    for (const key of ENV_KEYS) {
      vi.stubEnv(key, '')
    }
    vi.stubEnv('RUNNER_TOOL_CACHE', ' /opt/toolcache ')

    const request = resolveInstallRequest({
      token: 'token',
    })

    expect(request.cacheRoot).toBe(resolve('/opt/toolcache', 'jlo-bin-cache'))
  })

  it('resolves cacheRoot for local fallback using HOME', () => {
    for (const key of ENV_KEYS) {
      vi.stubEnv(key, '')
    }
    vi.stubEnv('HOME', ' /home/user ')

    const request = resolveInstallRequest({
      token: 'token',
    })

    expect(request.cacheRoot).toBe(
      resolve('/home/user/.cache', 'jlo-bin-cache'),
    )
  })
})
