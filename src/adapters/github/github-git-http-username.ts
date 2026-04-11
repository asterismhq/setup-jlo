import { z } from 'zod'

const GITHUB_API_USER_URL = 'https://api.github.com/user'
const GITHUB_APP_INSTALLATION_TOKEN_PREFIX = 'ghs_'

const GitHubUserSchema = z
  .object({
    login: z.string().optional(),
    type: z.string().optional(),
  })
  .loose()

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

  const rawUser: unknown = await response.json()
  const userParseResult = GitHubUserSchema.safeParse(rawUser)
  if (!userParseResult.success) {
    throw new Error(
      'Invalid user metadata structure received from GitHub API. Expected an object with optional string properties "login" and "type".',
    )
  }
  const user = userParseResult.data
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
