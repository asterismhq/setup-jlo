const GITHUB_API_USER_URL = 'https://api.github.com/user'
const GITHUB_APP_INSTALLATION_TOKEN_PREFIX = 'ghs_'

export async function resolveGitHubHttpUsername(
  token: string,
): Promise<string> {
  // GitHub App installation tokens authenticate git over HTTPS as x-access-token.
  if (token.startsWith(GITHUB_APP_INSTALLATION_TOKEN_PREFIX)) {
    return 'x-access-token'
  }

  const response = await fetch(GITHUB_API_USER_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'setup-jlo',
    },
  })

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      'token cannot resolve GitHub identity for HTTPS git authentication. Ensure the token remains valid and authorized.',
    )
  }

  if (!response.ok) {
    throw new Error(
      `Failed to resolve GitHub identity for HTTPS git authentication (HTTP ${response.status}).`,
    )
  }

  const user = (await response.json()) as { login?: string; type?: string }
  // Bot-owned tokens also require x-access-token rather than the reported login.
  if (user.type === 'Bot') {
    return 'x-access-token'
  }

  const username = user.login?.trim()

  if (!username) {
    throw new Error(
      'GitHub identity response did not include a usable login for HTTPS git authentication.',
    )
  }

  return username
}
