import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  buildReleaseAssetCandidates,
  detectPlatformTuple,
} from '../../src/domain/platform'
import * as child_process from 'node:child_process'

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
}))

describe('detectPlatformTuple', () => {
  let originalPlatform: NodeJS.Platform
  let originalArch: NodeJS.Architecture

  beforeEach(() => {
    originalPlatform = process.platform
    originalArch = process.arch
    vi.clearAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform })
    Object.defineProperty(process, 'arch', { value: originalArch })
  })

  const mockProcess = (platform: string, arch: string) => {
    Object.defineProperty(process, 'platform', { value: platform })
    Object.defineProperty(process, 'arch', { value: arch })
  }

  it.each([
    ['linux x86_64', 'linux', 'x64', { os: 'linux', arch: 'x86_64' }],
    ['linux aarch64', 'linux', 'arm64', { os: 'linux', arch: 'aarch64' }],
    ['darwin aarch64', 'darwin', 'arm64', { os: 'darwin', arch: 'aarch64' }],
  ])('detects %s correctly', (_, platform, arch, expected) => {
    mockProcess(platform, arch)
    expect(detectPlatformTuple()).toEqual(expected)
  })

  it('detects darwin x86_64 correctly without rosetta', () => {
    mockProcess('darwin', 'x64')
    vi.mocked(child_process.execFileSync).mockReturnValue('0\n')
    expect(detectPlatformTuple()).toEqual({ os: 'darwin', arch: 'x86_64' })
  })

  it('detects darwin aarch64 correctly with rosetta', () => {
    mockProcess('darwin', 'x64')
    vi.mocked(child_process.execFileSync).mockReturnValue('1\n')
    expect(detectPlatformTuple()).toEqual({ os: 'darwin', arch: 'aarch64' })
  })

  it('falls back to x86_64 on darwin if sysctl throws', () => {
    mockProcess('darwin', 'x64')
    vi.mocked(child_process.execFileSync).mockImplementation(() => {
      throw new Error('sysctl not found')
    })
    expect(detectPlatformTuple()).toEqual({ os: 'darwin', arch: 'x86_64' })
  })

  it.each([
    ['unsupported OS', 'win32', 'x64', 'Unsupported OS for setup-jlo: win32'],
    [
      'unsupported Architecture',
      'linux',
      'ia32',
      'Unsupported architecture for setup-jlo: ia32',
    ],
  ])('throws for %s', (_, platform, arch, message) => {
    mockProcess(platform, arch)
    expect(() => detectPlatformTuple()).toThrow(message)
  })
})

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
