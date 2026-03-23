export type ParsedVersionRef =
  | { kind: 'release-tag'; version: string; tag: string }
  | { kind: 'main'; ref: 'main' }

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/

export function extractSemver(segment: string): string | undefined {
  const normalized = segment.trim()
  const semverCore = normalized.replace(/^v/, '')
  if (SEMVER_PATTERN.test(semverCore)) {
    return semverCore
  }
  return undefined
}

export function parseVersionRef(versionRef: string): ParsedVersionRef {
  const normalized = versionRef.trim()

  if (normalized === 'main') {
    return { kind: 'main', ref: 'main' }
  }

  const semverCore = extractSemver(normalized)
  if (semverCore !== undefined) {
    return { kind: 'release-tag', version: semverCore, tag: `v${semverCore}` }
  }

  throw new Error(
    `Invalid version input '${normalized}'. Expected semver or 'main'.`,
  )
}

export function extractFirstSemverTriplet(value: string): string | undefined {
  for (const token of value.split(/\s+/)) {
    const semverCore = extractSemver(token)
    if (semverCore !== undefined) {
      return semverCore
    }
  }
  return undefined
}
