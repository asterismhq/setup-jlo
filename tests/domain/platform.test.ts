import { describe, expect, it } from 'vitest'
import { buildReleaseAssetCandidates } from '../../src/domain/platform'

describe('setup-jlo release asset candidates', () => {
  it('builds linux x86_64 runtime asset candidates', () => {
    expect(
      buildReleaseAssetCandidates(
        {
          os: 'linux',
          arch: 'x86_64',
        },
        false,
      ),
    ).toEqual(['jlo-linux-x86_64', 'jlo-linux-amd64'])
  })

  it('builds darwin arm64 candidates with x86_64 fallback', () => {
    expect(
      buildReleaseAssetCandidates(
        {
          os: 'darwin',
          arch: 'aarch64',
        },
        true,
      ),
    ).toEqual(['jlo-darwin-aarch64', 'jlo-darwin-arm64', 'jlo-darwin-x86_64'])
  })
})
