import { parseRepositorySlug } from '../../domain/repository-slug'

export async function fetchReleaseAsset(options: {
  token: string
  releaseRepository: string
  tagVersion: string
  candidates: string[]
}): Promise<{ name: string; contents: Buffer }> {
  const { owner, repo } = parseRepositorySlug(options.releaseRepository)
  const headers = {
    Authorization: `Bearer ${options.token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'setup-jlo',
  }

  const metadataResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/tags/${options.tagVersion}`,
    { headers },
  )

  if (metadataResponse.status === 401 || metadataResponse.status === 403) {
    throw new Error(
      `token cannot access release metadata in '${options.releaseRepository}'. Ensure contents:read and organization SSO authorization.`,
    )
  }
  if (metadataResponse.status === 404) {
    throw new Error(
      `Release '${options.tagVersion}' was not found (or is inaccessible) in '${options.releaseRepository}'.`,
    )
  }
  if (!metadataResponse.ok) {
    throw new Error(
      `Failed to query release metadata for '${options.tagVersion}' in '${options.releaseRepository}' (HTTP ${metadataResponse.status}).`,
    )
  }

  const metadata = (await metadataResponse.json()) as {
    assets?: Array<{ id: number; name: string }>
  }
  const matchedAsset = options.candidates
    .map((candidate) =>
      metadata.assets?.find((asset) => asset.name === candidate),
    )
    .find((asset): asset is { id: number; name: string } => asset !== undefined)

  if (!matchedAsset) {
    throw new Error(
      `No matching release asset for ${options.candidates.join(', ')} in '${options.releaseRepository}'.`,
    )
  }

  const downloadResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/assets/${matchedAsset.id}`,
    {
      headers: {
        ...headers,
        Accept: 'application/octet-stream',
      },
    },
  )

  if (!downloadResponse.ok) {
    throw new Error(
      `Failed to download release asset '${matchedAsset.name}' from '${options.releaseRepository}' (HTTP ${downloadResponse.status}).`,
    )
  }

  return {
    name: matchedAsset.name,
    contents: Buffer.from(await downloadResponse.arrayBuffer()),
  }
}
