export type ParsedVersionToken =
  | { kind: 'release-tag'; version: string; tag: string }
  | { kind: 'main'; token: 'main' }

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/

export function extractSemver(token: string): string | undefined {
  const normalized = token.trim()
  const semverCore = normalized.replace(/^v/, '')
  if (SEMVER_PATTERN.test(semverCore)) {
    return semverCore
  }
  return undefined
}

export function parseVersionToken(versionToken: string): ParsedVersionToken {
  const normalized = versionToken.trim()

  if (normalized === 'main') {
    return { kind: 'main', token: 'main' }
  }

  const semverCore = extractSemver(normalized)
  if (semverCore !== undefined) {
    return { kind: 'release-tag', version: semverCore, tag: `v${semverCore}` }
  }

  throw new Error(
    `Invalid version input '${normalized}'. Expected semver or 'main'.`,
  )
}
