import { getOctokit } from '@actions/github'

export async function resolveGitHttpUsername(token: string): Promise<string> {
  const octokit = getOctokit(token)
  const response = await octokit.rest.users.getAuthenticated()
  if (response.data.type === 'Bot') {
    return 'x-access-token'
  }

  return response.data.login
}
