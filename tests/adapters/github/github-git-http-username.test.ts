import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveGitHubHttpUsername } from '../../../src/adapters/github/github-git-http-username'

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

  it.each([
    { status: 401, description: 'unauthorized' },
    { status: 403, description: 'forbidden' },
  ])('throws error on $status $description', async ({ status }) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status,
      }),
    )

    await expect(
      resolveGitHubHttpUsername('github_pat_invalid'),
    ).rejects.toThrowError(
      'token cannot resolve GitHub identity for HTTPS git authentication. Ensure the token remains valid and authorized.',
    )
  })

  it('throws error on other non-ok status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    )

    await expect(
      resolveGitHubHttpUsername('github_pat_error'),
    ).rejects.toThrowError(
      'Failed to resolve GitHub identity for HTTPS git authentication (HTTP 500).',
    )
  })

  it('throws error if login is missing from successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ type: 'User' }),
      }),
    )

    await expect(
      resolveGitHubHttpUsername('github_pat_missing_login'),
    ).rejects.toThrowError(
      'GitHub identity response did not include a usable login for HTTPS git authentication.',
    )
  })

  it('throws error if login is empty from successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ login: '  ', type: 'User' }),
      }),
    )

    await expect(
      resolveGitHubHttpUsername('github_pat_empty_login'),
    ).rejects.toThrowError(
      'GitHub identity response did not include a usable login for HTTPS git authentication.',
    )
  })
})
