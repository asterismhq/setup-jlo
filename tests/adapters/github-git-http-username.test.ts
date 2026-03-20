import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveGitHubHttpUsername } from '../../src/adapters/github/github-git-http-username'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('github git http username resolution', () => {
  it('uses x-access-token for GitHub App installation tokens', async () => {
    await expect(resolveGitHubHttpUsername('ghs_example')).resolves.toBe(
      'x-access-token',
    )
  })

  it('resolves the authenticated login for personal access tokens', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ login: 'jlo-user', type: 'User' }),
      }),
    )

    await expect(resolveGitHubHttpUsername('github_pat_example')).resolves.toBe(
      'jlo-user',
    )
  })

  it('uses x-access-token for bot-owned tokens', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ login: 'jlo-bot', type: 'Bot' }),
      }),
    )

    await expect(resolveGitHubHttpUsername('github_pat_bot')).resolves.toBe(
      'x-access-token',
    )
  })

  it('throws on invalid JSON response structure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ login: 123, type: null }),
      }),
    )

    await expect(
      resolveGitHubHttpUsername('github_pat_invalid'),
    ).rejects.toThrow(/invalid/i)
  })
})
