import { getOctokit } from '@actions/github'

export async function resolveGitHubAccountLogin(
  token: string,
): Promise<string> {
  const octokit = getOctokit(token)
  const response = await octokit.rest.users.getAuthenticated()
  return response.data.login
}
