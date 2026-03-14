import { getOctokit } from '@actions/github'

export interface RepoRef {
  owner: string
  repo: string
}

export function parseRepositorySlug(slug: string): RepoRef {
  const [owner, repo] = slug.split('/')
  if (!owner || !repo) {
    throw new Error(
      `Invalid repository '${slug}'. Expected '<owner>/<repo>' format.`
    )
  }
  return { owner, repo }
}

export async function readTextFileFromBranch(options: {
  token: string
  repository: string
  branch: string
  path: string
}): Promise<string> {
  const { token, repository, branch, path } = options
  const octokit = getOctokit(token)
  const repoRef = parseRepositorySlug(repository)

  const response = await octokit.rest.repos.getContent({
    owner: repoRef.owner,
    repo: repoRef.repo,
    path,
    ref: branch
  })

  if (!('content' in response.data) || !response.data.content) {
    throw new Error(`File '${path}' is not a regular text file in '${branch}'.`)
  }

  return Buffer.from(response.data.content, 'base64').toString('utf8')
}
