import { err, ok, type Result } from '../../domain/result'

const GITHUB_API_USER_URL = 'https://api.github.com/user'
const GITHUB_APP_INSTALLATION_TOKEN_PREFIX = 'ghs_'

function isGitHubUser(
  data: unknown,
): data is { login?: string; type?: string } {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  if (
    'login' in data &&
    data.login !== undefined &&
    typeof data.login !== 'string'
  ) {
    return false
  }

  if (
    'type' in data &&
    data.type !== undefined &&
    typeof data.type !== 'string'
  ) {
    return false
  }

  return true
}

export async function resolveGitHubHttpUsername(
  token: string,
): Promise<Result<string>> {
  // GitHub App installation tokens authenticate git over HTTPS as x-access-token.
  if (token.startsWith(GITHUB_APP_INSTALLATION_TOKEN_PREFIX)) {
    return ok('x-access-token')
  }

  const response = await fetch(GITHUB_API_USER_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'setup-jlo',
    },
  })

  if (response.status === 401 || response.status === 403) {
    return err(
      new Error(
        'token cannot resolve GitHub identity for HTTPS git authentication. Ensure the token remains valid and authorized.',
      ),
    )
  }

  if (!response.ok) {
    return err(
      new Error(
        `Failed to resolve GitHub identity for HTTPS git authentication (HTTP ${response.status}).`,
      ),
    )
  }

  const rawUser: unknown = await response.json()
  if (!isGitHubUser(rawUser)) {
    return err(
      new Error(
        'Invalid user metadata structure received from GitHub API. Expected an object with optional string properties "login" and "type".',
      ),
    )
  }
  const user = rawUser
  // Bot-owned tokens also require x-access-token rather than the reported login.
  if (user.type === 'Bot') {
    return ok('x-access-token')
  }

  const username = user.login?.trim()

  if (!username) {
    return err(
      new Error(
        'GitHub identity response did not include a usable login for HTTPS git authentication.',
      ),
    )
  }

  return ok(username)
}
