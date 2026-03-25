import { describe, expect, it } from 'vitest'
import { extractSemver, parseVersionRef } from '../../src/domain/version-ref'

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

describe('setup-jlo version ref behavior', () => {
  it('parses semver ref to release payload', () => {
    expect(parseVersionRef('0.5.2')).toEqual({
      kind: 'release-tag',
      version: '0.5.2',
      tag: 'v0.5.2',
    })
  })

  it('accepts v-prefixed semver ref', () => {
    expect(parseVersionRef('v0.5.2')).toEqual({
      kind: 'release-tag',
      version: '0.5.2',
      tag: 'v0.5.2',
    })
  })

  it('parses main ref to main payload', () => {
    expect(parseVersionRef('main')).toEqual({
      kind: 'main',
      ref: 'main',
    })
  })

  it('rejects invalid ref values', () => {
    expect(() => parseVersionRef('latest')).toThrow(
      "Invalid version input 'latest'. Expected semver or 'main'.",
    )
  })
})
