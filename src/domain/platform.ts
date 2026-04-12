import { execFileSync } from 'node:child_process'

export type InstallerOs = 'linux' | 'darwin'
export type InstallerArch = 'x86_64' | 'aarch64'

export interface PlatformTuple {
  os: InstallerOs
  arch: InstallerArch
}

export function detectPlatformTuple(
  platformStr: NodeJS.Platform = process.platform,
  archStr: NodeJS.Architecture = process.arch,
): PlatformTuple {
  const os = normalizeOs(platformStr)
  const arch = normalizeArch(archStr)

  if (os === 'darwin' && arch === 'x86_64' && detectRosettaArm64()) {
    return { os, arch: 'aarch64' }
  }

  return { os, arch }
}

export function buildReleaseAssetCandidates(
  platform: PlatformTuple,
  allowDarwinX8664Fallback: boolean,
): string[] {
  if (platform.arch === 'x86_64') {
    return [`astm-${platform.os}-x86_64`, `astm-${platform.os}-amd64`]
  }

  const candidates = [
    `astm-${platform.os}-aarch64`,
    `astm-${platform.os}-arm64`,
  ]
  if (platform.os === 'darwin' && allowDarwinX8664Fallback) {
    candidates.push(`astm-${platform.os}-x86_64`)
  }
  return candidates
}

function normalizeOs(raw: string): InstallerOs {
  switch (raw) {
    case 'linux':
      return 'linux'
    case 'darwin':
      return 'darwin'
    default:
      throw new Error(`Unsupported OS for setup-astm: ${raw}`)
  }
}

function normalizeArch(raw: string): InstallerArch {
  switch (raw) {
    case 'x64':
      return 'x86_64'
    case 'arm64':
      return 'aarch64'
    default:
      throw new Error(`Unsupported architecture for setup-astm: ${raw}`)
  }
}

function detectRosettaArm64(): boolean {
  try {
    const output = execFileSync('sysctl', ['-n', 'hw.optional.arm64'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return output.trim() === '1'
  } catch {
    return false
  }
}
