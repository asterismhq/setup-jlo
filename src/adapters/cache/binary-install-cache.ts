import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import * as core from '@actions/core'
import type { PlatformTuple } from '../../domain/platform'
import { extractSemver } from '../../domain/version-token'

export function resolvePlatformCacheDirectory(
  cacheRoot: string,
  platform: PlatformTuple,
): string {
  return join(cacheRoot, `${platform.os}-${platform.arch}`)
}

export function ensureInstallDirectory(
  platformDir: string,
  installKey: string,
): string {
  mkdirSync(platformDir, { recursive: true })
  const installDir = join(platformDir, installKey)
  mkdirSync(installDir, { recursive: true })
  return installDir
}

export function installBinaryOnPath(installDir: string): void {
  core.addPath(installDir)
}

export function pruneSiblingInstallDirectories(
  platformDir: string,
  keepName: string,
): void {
  if (!existsSync(platformDir)) {
    return
  }

  for (const entry of readdirSync(platformDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === keepName) {
      continue
    }
    rmSync(join(platformDir, entry.name), { recursive: true, force: true })
  }
}

export function isCachedBinaryForVersion(
  binaryPath: string,
  expectedVersion: string,
): boolean {
  if (!existsSync(binaryPath)) {
    return false
  }

  const result = spawnSync(binaryPath, ['--version'], { encoding: 'utf8' })
  if (result.status !== 0) {
    return false
  }

  return extractFirstSemverTriplet(result.stdout) === expectedVersion
}

export function detectBinaryVersion(binaryPath: string): string {
  const result = spawnSync(binaryPath, ['--version'], { encoding: 'utf8' })
  if (result.status !== 0) {
    return 'version unknown'
  }
  const rendered = result.stdout.trim()
  return rendered.length > 0 ? rendered : 'version unknown'
}

export function copyExecutableBinary(
  sourcePath: string,
  targetPath: string,
): void {
  copyFileSync(sourcePath, targetPath)
  ensureExecutablePermissions(targetPath)
}

export function ensureExecutablePermissions(path: string): void {
  chmodSync(path, 0o755)
}

function extractFirstSemverTriplet(value: string): string | undefined {
  for (const token of value.split(/\s+/)) {
    const semverCore = extractSemver(token)
    if (semverCore !== undefined) {
      return semverCore
    }
  }
  return undefined
}
