import { describe, expect, it } from 'vitest'
import {
  extractSemver,
  parseVersionToken,
} from '../../src/domain/version-token'

describe('setup-jlo extractSemver behavior', () => {
  it('extracts bare semver', () => {
    expect(extractSemver('0.5.2')).toBe('0.5.2')
  })

  it('extracts v-prefixed semver', () => {
    expect(extractSemver('v0.5.2')).toBe('0.5.2')
  })

  it('trims whitespace', () => {
    expect(extractSemver('  v1.2.3  ')).toBe('1.2.3')
  })

  it('returns undefined for invalid formats', () => {
    expect(extractSemver('latest')).toBeUndefined()
    expect(extractSemver('main')).toBeUndefined()
    expect(extractSemver('1.2')).toBeUndefined()
    expect(extractSemver('v1')).toBeUndefined()
  })
})

describe('setup-jlo version token behavior', () => {
  it('parses semver token to release payload', () => {
    expect(parseVersionToken('0.5.2')).toEqual({
      kind: 'release-tag',
      version: '0.5.2',
      tag: 'v0.5.2',
    })
  })

  it('accepts v-prefixed semver token', () => {
    expect(parseVersionToken('v0.5.2')).toEqual({
      kind: 'release-tag',
      version: '0.5.2',
      tag: 'v0.5.2',
    })
  })

  it('parses main token to main payload', () => {
    expect(parseVersionToken('main')).toEqual({
      kind: 'main',
      token: 'main',
    })
  })

  it('rejects invalid token values', () => {
    expect(() => parseVersionToken('latest')).toThrow(
      "Invalid version input 'latest'. Expected semver or 'main'.",
    )
  })
})
