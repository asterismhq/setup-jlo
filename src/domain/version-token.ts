export type ParsedVersionToken =
  | { kind: 'release-tag'; version: string; tag: string }
  | { kind: 'main'; token: 'main' }

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/

export function parseVersionToken(versionToken: string): ParsedVersionToken {
  const normalized = versionToken.trim()
  const semverCore = normalized.replace(/^v/, '')

  if (normalized === 'main') {
    return { kind: 'main', token: 'main' }
  }

  if (SEMVER_PATTERN.test(semverCore)) {
    return { kind: 'release-tag', version: semverCore, tag: `v${semverCore}` }
  }

  throw new Error(
    `Invalid version input '${normalized}'. Expected semver or 'main'.`,
  )
}
