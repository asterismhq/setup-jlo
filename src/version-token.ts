export type ParsedVersionToken =
  | { kind: 'release'; version: string; tag: string }
  | { kind: 'main'; token: 'main' }

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/

export function parseVersionToken(token: string): ParsedVersionToken {
  const normalized = token.trim()
  const semverCore = normalized.replace(/^v/, '')

  if (normalized === 'main') {
    return { kind: 'main', token: 'main' }
  }

  if (SEMVER_PATTERN.test(semverCore)) {
    return { kind: 'release', version: semverCore, tag: `v${semverCore}` }
  }

  throw new Error(
    `Invalid .jlo/.jlo-version token '${normalized}'. Expected semver or 'main'.`
  )
}
