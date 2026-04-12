import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveGitHubHttpUsername } from '../../../src/adapters/github/github-git-http-username'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('github git http username resolution', () => {
  it('uses x-access-token for GitHub App installation tokens', async () => {
    const result = await resolveGitHubHttpUsername('ghs_example')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('x-access-token')
    }
  })

  it('resolves the authenticated login for personal access tokens', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ login: 'astm-user', type: 'User' }),
      }),
    )

    const result = await resolveGitHubHttpUsername('github_pat_example')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('astm-user')
    }
  })

  it('uses x-access-token for bot-owned tokens', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ login: 'astm-bot', type: 'Bot' }),
      }),
    )

    const result = await resolveGitHubHttpUsername('github_pat_bot')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toBe('x-access-token')
    }
  })

  it.each([
    { json: null, desc: 'null payload' },
    { json: 'string-payload', desc: 'primitive string payload' },
    { json: 123, desc: 'primitive number payload' },
    { json: { login: 123, type: 'User' }, desc: 'login is a number' },
    { json: { login: 'astm-user', type: null }, desc: 'type is null' },
    { json: { login: 'astm-user', type: 123 }, desc: 'type is a number' },
  ])('returns error on invalid JSON response structure: $desc', async ({
    json,
  }) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => json,
      }),
    )

    const result = await resolveGitHubHttpUsername('github_pat_invalid')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toMatch(/invalid/i)
    }
  })

  it.each([
    { status: 401, description: 'unauthorized' },
    { status: 403, description: 'forbidden' },
  ])('returns error on $status $description', async ({ status }) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status,
      }),
    )

    const result = await resolveGitHubHttpUsername('github_pat_invalid')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toBe(
        'token cannot resolve GitHub identity for HTTPS git authentication. Ensure the token remains valid and authorized.',
      )
    }
  })

  it('returns error on other non-ok status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    )

    const result = await resolveGitHubHttpUsername('github_pat_error')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toBe(
        'Failed to resolve GitHub identity for HTTPS git authentication (HTTP 500).',
      )
    }
  })

  it('returns error if login is missing from successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ type: 'User' }),
      }),
    )

    const result = await resolveGitHubHttpUsername('github_pat_missing_login')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toBe(
        'GitHub identity response did not include a usable login for HTTPS git authentication.',
      )
    }
  })

  it('returns error if login is empty from successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ login: '  ', type: 'User' }),
      }),
    )

    const result = await resolveGitHubHttpUsername('github_pat_empty_login')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toBe(
        'GitHub identity response did not include a usable login for HTTPS git authentication.',
      )
    }
  })
})
