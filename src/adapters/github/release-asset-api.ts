import type { RepositorySlug } from '../../domain/repository-slug'
import { err, ok, type Result } from '../../domain/result'
import { z } from 'zod'

const ReleaseMetadataSchema = z
  .object({
    assets: z
      .array(
        z
          .object({
            id: z.number(),
            name: z.string(),
          })
          .loose(),
      )
      .optional(),
  })
  .loose()

export async function fetchReleaseAsset(options: {
  token: string
  releaseRepository: RepositorySlug
  tagVersion: string
  candidates: string[]
}): Promise<Result<{ name: string; contents: Buffer }>> {
  const { owner, repo } = options.releaseRepository
  const headers = {
    Authorization: `Bearer ${options.token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'setup-astm',
  }

  const metadataResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/tags/${options.tagVersion}`,
    { headers },
  )

  if (metadataResponse.status === 401 || metadataResponse.status === 403) {
    return err(
      new Error(
        `token cannot access release metadata in '${owner}/${repo}'. Ensure contents:read and organization SSO authorization.`,
      ),
    )
  }
  if (metadataResponse.status === 404) {
    return err(
      new Error(
        `Release '${options.tagVersion}' was not found (or is inaccessible) in '${owner}/${repo}'.`,
      ),
    )
  }
  if (!metadataResponse.ok) {
    return err(
      new Error(
        `Failed to query release metadata for '${options.tagVersion}' in '${owner}/${repo}' (HTTP ${metadataResponse.status}).`,
      ),
    )
  }

  const rawMetadata: unknown = await metadataResponse.json()
  const metadataParseResult = ReleaseMetadataSchema.safeParse(rawMetadata)
  if (!metadataParseResult.success) {
    return err(
      new Error(
        `Invalid release metadata structure received from GitHub API for '${options.tagVersion}' in '${owner}/${repo}'. Expected an object with an optional 'assets' array containing 'id' (number) and 'name' (string).`,
      ),
    )
  }
  const metadata = metadataParseResult.data
  const matchedAsset = options.candidates
    .map((candidate) =>
      metadata.assets?.find((asset) => asset.name === candidate),
    )
    .find((asset): asset is { id: number; name: string } => asset !== undefined)

  if (!matchedAsset) {
    return err(
      new Error(
        `No matching release asset for ${options.candidates.join(', ')} in '${owner}/${repo}'.`,
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
        `Failed to download release asset '${matchedAsset.name}' from '${owner}/${repo}' (HTTP ${downloadResponse.status}).`,
      ),
    )
  }

  return ok({
    name: matchedAsset.name,
    contents: Buffer.from(await downloadResponse.arrayBuffer()),
  })
}
