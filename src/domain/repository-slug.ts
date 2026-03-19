export interface RepositorySlug {
  owner: string
  repo: string
}

export function parseRepositorySlug(slug: string): RepositorySlug {
  const [owner, repo] = slug.split('/')
  if (!owner || !repo) {
    throw new Error(
      `Invalid repository '${slug}'. Expected '<owner>/<repo>' format.`
    )
  }
  return { owner, repo }
}