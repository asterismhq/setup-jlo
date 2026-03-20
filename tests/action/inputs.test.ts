import { describe, expect, it, vi, beforeEach } from 'vitest'
import * as core from '@actions/core'
import { readRequiredInput, readOptionalInput } from '../../src/action/inputs'

vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
}))

describe('inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('readRequiredInput', () => {
    it('returns the trimmed input if present', () => {
      vi.mocked(core.getInput).mockReturnValue('  some-value  ')
      const result = readRequiredInput('my-input')
      expect(core.getInput).toHaveBeenCalledWith('my-input')
      expect(result).toBe('some-value')
    })

    it('throws an error if the input is missing', () => {
      vi.mocked(core.getInput).mockReturnValue('')
      expect(() => readRequiredInput('my-input')).toThrow(
        "Input 'my-input' is required.",
      )
    })

    it('throws an error if the input is only whitespace', () => {
      vi.mocked(core.getInput).mockReturnValue('   ')
      expect(() => readRequiredInput('my-input')).toThrow(
        "Input 'my-input' is required.",
      )
    })
  })

  describe('readOptionalInput', () => {
    it('returns the trimmed input if present', () => {
      vi.mocked(core.getInput).mockReturnValue('  optional-value  ')
      const result = readOptionalInput('my-optional-input')
      expect(core.getInput).toHaveBeenCalledWith('my-optional-input')
      expect(result).toBe('optional-value')
    })

    it('returns undefined if the input is missing', () => {
      vi.mocked(core.getInput).mockReturnValue('')
      const result = readOptionalInput('my-optional-input')
      expect(result).toBeUndefined()
    })

    it('returns undefined if the input is only whitespace', () => {
      vi.mocked(core.getInput).mockReturnValue('   ')
      const result = readOptionalInput('my-optional-input')
      expect(result).toBeUndefined()
    })
  })
})
