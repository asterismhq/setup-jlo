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
