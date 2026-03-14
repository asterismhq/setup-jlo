import { describe, expect, it } from 'vitest'
import { resolveInstallMode } from '../src/index'
import { parseVersionToken } from '../src/version-token'

describe('setup-jlo version token behavior', () => {
  it('resolves semver token to release-tag mode', () => {
    expect(resolveInstallMode('0.5.2')).toBe('release-tag')
  })

  it('resolves main token to main mode', () => {
    expect(resolveInstallMode('main')).toBe('main')
  })

  it('rejects invalid token values', () => {
    expect(() => parseVersionToken('latest')).toThrow(/Invalid/)
  })
})
