import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchReleaseAsset } from '../../src/adapters/github/release-asset-api'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('release asset api', () => {
  it('throws on invalid JSON metadata', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ assets: [{ id: 'not a number', name: 123 }] }),
      }),
    )

    await expect(
      fetchReleaseAsset({
        token: 'token',
        releaseRepository: 'owner/repo',
        tagVersion: 'v1.0.0',
        candidates: ['jlo-linux-x86_64'],
      }),
    ).rejects.toThrow(/invalid/i)
  })
})
