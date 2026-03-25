import { parseRepositorySlug } from '../../domain/repository-slug'
import { err, ok, type Result } from '../../domain/result'

function isReleaseMetadata(
  data: unknown,
): data is { assets?: Array<{ id: number; name: string }> } {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const obj = data as Record<string, unknown>

  if (obj.assets === undefined) {
    return true
  }

  return (
    Array.isArray(obj.assets) &&
    obj.assets.every((asset: unknown) => {
      if (typeof asset !== 'object' || asset === null) {
        return false
      }
      const assetObj = asset as Record<string, unknown>
      return (
        typeof assetObj.id === 'number' && typeof assetObj.name === 'string'
      )
    })
  )
}

export async function fetchReleaseAsset(options: {
  token: string
  releaseRepository: string
  tagVersion: string
  candidates: string[]
}): Promise<Result<{ name: string; contents: Buffer }>> {
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
    return err(
      new Error(
        `token cannot access release metadata in '${options.releaseRepository}'. Ensure contents:read and organization SSO authorization.`,
      ),
    )
  }
  if (metadataResponse.status === 404) {
    return err(
      new Error(
        `Release '${options.tagVersion}' was not found (or is inaccessible) in '${options.releaseRepository}'.`,
      ),
    )
  }
  if (!metadataResponse.ok) {
    return err(
      new Error(
        `Failed to query release metadata for '${options.tagVersion}' in '${options.releaseRepository}' (HTTP ${metadataResponse.status}).`,
      ),
    )
  }

  const rawMetadata: unknown = await metadataResponse.json()
  if (!isReleaseMetadata(rawMetadata)) {
    return err(
      new Error(
        `Invalid release metadata structure received from GitHub API for '${options.tagVersion}' in '${options.releaseRepository}'. Expected an object with an optional 'assets' array containing 'id' (number) and 'name' (string).`,
      ),
    )
  }
  const metadata = rawMetadata
  const matchedAsset = options.candidates
    .map((candidate) =>
      metadata.assets?.find((asset) => asset.name === candidate),
    )
    .find((asset): asset is { id: number; name: string } => asset !== undefined)

  if (!matchedAsset) {
    return err(
      new Error(
        `No matching release asset for ${options.candidates.join(', ')} in '${options.releaseRepository}'.`,
      ),
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
    return err(
      new Error(
        `Failed to download release asset '${matchedAsset.name}' from '${options.releaseRepository}' (HTTP ${downloadResponse.status}).`,
      ),
    )
  }

  return ok({
    name: matchedAsset.name,
    contents: Buffer.from(await downloadResponse.arrayBuffer()),
  })
}
