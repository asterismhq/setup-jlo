export type ParsedVersionToken =
  | { kind: 'release'; version: string; tag: string }
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

export function parseVersionToken(token: string): ParsedVersionToken {
  const normalized = token.trim()

  if (normalized === 'main') {
    return { kind: 'main', token: 'main' }
  }

  const semverCore = extractSemver(normalized)
  if (semverCore !== undefined) {
    return { kind: 'release', version: semverCore, tag: `v${semverCore}` }
  }

  throw new Error(
    `Invalid version input '${normalized}'. Expected semver or 'main'.`,
  )
}
