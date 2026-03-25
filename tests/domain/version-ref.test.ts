import { describe, expect, it } from 'vitest'
import {
  extractFirstSemverTriplet,
  extractSemver,
  parseVersionRef,
} from '../../src/domain/version-ref'

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

describe('setup-jlo extractFirstSemverTriplet behavior', () => {
  it('extracts semver from a single valid token', () => {
    expect(extractFirstSemverTriplet('1.2.3')).toBe('1.2.3')
  })

  it('extracts semver from a valid v-prefixed token', () => {
    expect(extractFirstSemverTriplet('v1.2.3')).toBe('1.2.3')
  })

  it('extracts the first valid semver from multiple tokens', () => {
    expect(extractFirstSemverTriplet('jlo version 1.2.3')).toBe('1.2.3')
    expect(extractFirstSemverTriplet('jlo v1.2.3 (abcdef)')).toBe('1.2.3')
  })

  it('ignores invalid tokens and finds the first valid semver', () => {
    expect(extractFirstSemverTriplet('version unknown but maybe 1.2.3')).toBe(
      '1.2.3',
    )
  })

  it('returns undefined if no valid semver is found', () => {
    expect(extractFirstSemverTriplet('version unknown')).toBeUndefined()
    expect(extractFirstSemverTriplet('jlo 1.2')).toBeUndefined()
    expect(extractFirstSemverTriplet('')).toBeUndefined()
  })

  it('handles irregular whitespace', () => {
    expect(extractFirstSemverTriplet('  jlo   \t  v1.2.3 \n ')).toBe('1.2.3')
  })
})
