import { describe, expect, it } from 'vitest'
import { resolveInstallMode } from '../src/index'
import { parseVersionToken } from '../src/version-token'

describe('setup-jlo version token behavior', () => {
  it('resolves semver token to release-tag mode', () => {
    expect(resolveInstallMode('0.5.2')).toBe('release-tag')
  })

  it('accepts v-prefixed semver token', () => {
    expect(parseVersionToken('v0.5.2')).toEqual({
      kind: 'release',
      version: '0.5.2',
      tag: 'v0.5.2'
    })
  })

  it('resolves main token to main mode', () => {
    expect(resolveInstallMode('main')).toBe('main')
  })

  it('rejects invalid token values', () => {
    expect(() => parseVersionToken('latest')).toThrow(
      "Invalid version input 'latest'. Expected semver or 'main'."
    )
  })
})
