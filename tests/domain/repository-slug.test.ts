import { describe, expect, it } from 'vitest'
import { parseRepositorySlug } from '../../src/domain/repository-slug'

describe('parseRepositorySlug', () => {
  it('parses valid owner and repo formats', () => {
    const result = parseRepositorySlug('owner/repo')
    expect(result).toEqual({ owner: 'owner', repo: 'repo' })
  })

  it('throws an error if the slug is invalid', () => {
    expect(() => parseRepositorySlug('owner-repo')).toThrow(
      "Invalid repository 'owner-repo'. Expected '<owner>/<repo>' format.",
    )
  })

  it('throws an error if owner is empty', () => {
    expect(() => parseRepositorySlug('/repo')).toThrow(
      "Invalid repository '/repo'. Expected '<owner>/<repo>' format.",
    )
  })

  it('throws an error if repo is empty', () => {
    expect(() => parseRepositorySlug('owner/')).toThrow(
      "Invalid repository 'owner/'. Expected '<owner>/<repo>' format.",
    )
  })
})
