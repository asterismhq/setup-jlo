import { describe, expect, it, vi, afterEach } from 'vitest'
import { fetchReleaseAsset } from '../../../src/adapters/github/release-asset-api'

describe('release-asset-api adapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('fetchReleaseAsset', () => {
    it('returns error on invalid JSON metadata', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ assets: [{ id: 'not a number', name: 123 }] }),
        }),
      )

      const result = await fetchReleaseAsset({
        token: 'token',
        releaseRepository: 'owner/repo',
        tagVersion: 'v1.0.0',
        candidates: ['jlo-linux-x86_64'],
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toMatch(
          /Invalid release metadata structure/i,
        )
      }
    })

    it.each([
      { status: 401, description: 'unauthorized' },
      { status: 403, description: 'forbidden' },
    ])('returns error on $status $description metadata fetch', async ({
      status,
    }) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status,
        }),
      )

      const result = await fetchReleaseAsset({
        token: 'secret',
        releaseRepository: 'owner/repo',
        tagVersion: 'v1.0.0',
        candidates: ['asset-linux'],
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe(
          "token cannot access release metadata in 'owner/repo'. Ensure contents:read and organization SSO authorization.",
        )
      }
    })

    it('returns error on 404 not found metadata fetch', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
        }),
      )

      const result = await fetchReleaseAsset({
        token: 'secret',
        releaseRepository: 'owner/repo',
        tagVersion: 'v1.0.0',
        candidates: ['asset-linux'],
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe(
          "Release 'v1.0.0' was not found (or is inaccessible) in 'owner/repo'.",
        )
      }
    })

    it('returns error on other non-ok metadata fetch', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
        }),
      )

      const result = await fetchReleaseAsset({
        token: 'secret',
        releaseRepository: 'owner/repo',
        tagVersion: 'v1.0.0',
        candidates: ['asset-linux'],
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe(
          "Failed to query release metadata for 'v1.0.0' in 'owner/repo' (HTTP 500).",
        )
      }
    })

    it('returns error if no candidate matches', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            assets: [
              { id: 1, name: 'other-asset' },
              { id: 2, name: 'another-asset' },
            ],
          }),
        }),
      )

      const result = await fetchReleaseAsset({
        token: 'secret',
        releaseRepository: 'owner/repo',
        tagVersion: 'v1.0.0',
        candidates: ['asset-linux', 'fallback-linux'],
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe(
          "No matching release asset for asset-linux, fallback-linux in 'owner/repo'.",
        )
      }
    })

    it('returns error if asset download fails', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(async (url) => {
          if (url.includes('/releases/tags/')) {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                assets: [{ id: 42, name: 'asset-linux' }],
              }),
            }
          }

          if (url.includes('/releases/assets/')) {
            return {
              ok: false,
              status: 500,
            }
          }

          return { ok: false, status: 404 }
        }),
      )

      const result = await fetchReleaseAsset({
        token: 'secret',
        releaseRepository: 'owner/repo',
        tagVersion: 'v1.0.0',
        candidates: ['asset-linux'],
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe(
          "Failed to download release asset 'asset-linux' from 'owner/repo' (HTTP 500).",
        )
      }
    })

    it('succeeds and returns ok result on valid response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(async (url) => {
          if (url.includes('/releases/tags/')) {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                assets: [
                  { id: 1, name: 'ignored-asset' },
                  { id: 42, name: 'fallback-linux' },
                ],
              }),
            }
          }

          if (url.includes('/releases/assets/')) {
            return {
              ok: true,
              status: 200,
              arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
            }
          }

          return { ok: false, status: 404 }
        }),
      )

      const result = await fetchReleaseAsset({
        token: 'secret',
        releaseRepository: 'owner/repo',
        tagVersion: 'v1.0.0',
        candidates: ['asset-linux', 'fallback-linux'],
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.name).toBe('fallback-linux')
        expect(result.value.contents).toEqual(Buffer.from([1, 2, 3]))
      }

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        'https://api.github.com/repos/owner/repo/releases/tags/v1.0.0',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer secret',
          }),
        }),
      )
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        'https://api.github.com/repos/owner/repo/releases/assets/42',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer secret',
            Accept: 'application/octet-stream',
          }),
        }),
      )
    })
  })
})
