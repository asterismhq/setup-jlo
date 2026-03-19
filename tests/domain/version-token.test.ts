import { describe, expect, it } from 'vitest'
import { parseVersionToken } from '../../src/domain/version-token'

describe('setup-jlo version token behavior', () => {
  it('parses semver token to release payload', () => {
    expect(parseVersionToken('0.5.2')).toEqual({
      kind: 'release',
      version: '0.5.2',
      tag: 'v0.5.2'
    })
  })

  it('accepts v-prefixed semver token', () => {
    expect(parseVersionToken('v0.5.2')).toEqual({
      kind: 'release',
      version: '0.5.2',
      tag: 'v0.5.2'
    })
  })

  it('parses main token to main payload', () => {
    expect(parseVersionToken('main')).toEqual({
      kind: 'main',
      token: 'main'
    })
  })

  it('rejects invalid token values', () => {
    expect(() => parseVersionToken('latest')).toThrow(
      "Invalid version input 'latest'. Expected semver or 'main'."
    )
  })
})
