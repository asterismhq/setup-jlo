export interface RepositorySlug {
  owner: string
  repo: string
}

export function parseRepositorySlug(slug: string): RepositorySlug {
  const parts = slug.split('/')
  if (parts.length !== 2) {
    throw new Error(
      `Invalid repository '${slug}'. Expected '<owner>/<repo>' format.`,
    )
  }

  const [owner, repo] = parts
  if (!owner || !repo) {
    throw new Error(
      `Invalid repository '${slug}'. Expected '<owner>/<repo>' format.`,
    )
  }
  return { owner, repo }
}
