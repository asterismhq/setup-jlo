export type ParsedVersionToken =
  | { kind: 'release'; version: string; tag: string }
  | { kind: 'main'; token: 'main' }

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/

export function parseVersionToken(token: string): ParsedVersionToken {
  const normalized = token.trim()

  if (normalized === 'main') {
    return { kind: 'main', token: 'main' }
  }

  if (SEMVER_PATTERN.test(normalized)) {
    return { kind: 'release', version: normalized, tag: `v${normalized}` }
  }

  throw new Error(
    `Invalid .jlo/.jlo-version token '${normalized}'. Expected semver or 'main'.`
  )
}
