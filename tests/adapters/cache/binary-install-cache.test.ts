import { describe, expect, it, vi, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as childProcess from 'node:child_process'
import * as core from '@actions/core'
import {
  resolveCacheRoot,
  resolvePlatformCacheDirectory,
  ensureInstallDirectory,
  installBinaryOnPath,
  pruneSiblingInstallDirectories,
  isCachedBinaryForVersion,
  detectBinaryVersion,
  copyExecutableBinary,
  ensureExecutablePermissions,
} from '../../../src/adapters/cache/binary-install-cache'

vi.mock('node:fs')
vi.mock('node:child_process')
vi.mock('@actions/core')

describe('binary-install-cache adapter', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  describe('resolveCacheRoot', () => {
    it('returns override if provided', () => {
      expect(resolveCacheRoot({ cacheRootOverride: '/custom' })).toBe('/custom')
    })

    it('returns github-hosted root', () => {
      expect(
        resolveCacheRoot({
          runnerEnvironment: 'github-hosted',
          runnerTemp: '/tmp/runner',
        }),
      ).toBe('/tmp/runner/jlo-bin-cache')
    })

    it('returns github-hosted root with default tmp', () => {
      expect(
        resolveCacheRoot({
          runnerEnvironment: 'github-hosted',
        }),
      ).toBe('/tmp/jlo-bin-cache')
    })

    it('returns tool cache root if provided', () => {
      expect(
        resolveCacheRoot({
          runnerToolCache: '/toolcache',
        }),
      ).toBe('/toolcache/jlo-bin-cache')
    })

    it('returns home cache root if HOME is set', () => {
      vi.stubEnv('HOME', '/home/user')
      expect(resolveCacheRoot({})).toBe('/home/user/.cache/jlo-bin-cache')
    })

    it('returns default tmp cache root if HOME is not set', () => {
      vi.stubEnv('HOME', '')
      expect(resolveCacheRoot({})).toBe('/tmp/jlo-bin-cache')
    })
  })

  describe('resolvePlatformCacheDirectory', () => {
    it('resolves platform directory', () => {
      expect(
        resolvePlatformCacheDirectory('/cache', {
          os: 'linux',
          arch: 'x86_64',
        }),
      ).toBe('/cache/linux-x86_64')
    })
  })

  describe('ensureInstallDirectory', () => {
    it('creates and returns install directory', () => {
      expect(ensureInstallDirectory('/cache/linux-x86_64', 'key')).toBe(
        '/cache/linux-x86_64/key',
      )
      expect(fs.mkdirSync).toHaveBeenCalledWith('/cache/linux-x86_64', {
        recursive: true,
      })
      expect(fs.mkdirSync).toHaveBeenCalledWith('/cache/linux-x86_64/key', {
        recursive: true,
      })
    })
  })

  describe('installBinaryOnPath', () => {
    it('adds path to core', () => {
      installBinaryOnPath('/bin/dir')
      expect(core.addPath).toHaveBeenCalledWith('/bin/dir')
    })
  })

  describe('pruneSiblingInstallDirectories', () => {
    it('does nothing if platform directory does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      pruneSiblingInstallDirectories('/cache', 'keep')
      expect(fs.readdirSync).not.toHaveBeenCalled()
    })

    it('removes sibling directories', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'keep', isDirectory: () => true },
        { name: 'remove1', isDirectory: () => true },
        { name: 'remove2', isDirectory: () => false },
      ] as unknown as ReturnType<typeof fs.readdirSync>)

      pruneSiblingInstallDirectories('/cache', 'keep')

      expect(fs.rmSync).toHaveBeenCalledWith('/cache/remove1', {
        recursive: true,
        force: true,
      })
      expect(fs.rmSync).not.toHaveBeenCalledWith(
        '/cache/keep',
        expect.anything(),
      )
      expect(fs.rmSync).not.toHaveBeenCalledWith(
        '/cache/remove2',
        expect.anything(),
      )
    })
  })

  describe('isCachedBinaryForVersion', () => {
    it('returns false if binary does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      expect(isCachedBinaryForVersion('/bin', '1.0.0')).toBe(false)
    })

    it('returns false if binary execution fails', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 1,
      } as ReturnType<typeof childProcess.spawnSync>)
      expect(isCachedBinaryForVersion('/bin', '1.0.0')).toBe(false)
    })

    it('returns true if binary execution succeeds and version matches', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
        stdout: 'jlo 1.0.0',
      } as ReturnType<typeof childProcess.spawnSync>)
      expect(isCachedBinaryForVersion('/bin', '1.0.0')).toBe(true)
    })

    it('returns true if binary execution succeeds and version matches with v prefix', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
        stdout: 'jlo v1.0.0',
      } as ReturnType<typeof childProcess.spawnSync>)
      expect(isCachedBinaryForVersion('/bin', '1.0.0')).toBe(true)
    })

    it('returns false if binary execution succeeds and version mismatches', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
        stdout: 'jlo 2.0.0',
      } as ReturnType<typeof childProcess.spawnSync>)
      expect(isCachedBinaryForVersion('/bin', '1.0.0')).toBe(false)
    })

    it('returns false if version format is unrecognized', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
        stdout: 'jlo unknown',
      } as ReturnType<typeof childProcess.spawnSync>)
      expect(isCachedBinaryForVersion('/bin', '1.0.0')).toBe(false)
    })
  })

  describe('detectBinaryVersion', () => {
    it('returns unknown if execution fails', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 1,
      } as ReturnType<typeof childProcess.spawnSync>)
      expect(detectBinaryVersion('/bin')).toBe('version unknown')
    })

    it('returns unknown if output is empty', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
        stdout: '  ',
      } as ReturnType<typeof childProcess.spawnSync>)
      expect(detectBinaryVersion('/bin')).toBe('version unknown')
    })

    it('returns output if execution succeeds', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
        stdout: 'jlo 1.0.0\n',
      } as ReturnType<typeof childProcess.spawnSync>)
      expect(detectBinaryVersion('/bin')).toBe('jlo 1.0.0')
    })
  })

  describe('copyExecutableBinary', () => {
    it('copies file and sets permissions', () => {
      copyExecutableBinary('/src', '/dest')
      expect(fs.copyFileSync).toHaveBeenCalledWith('/src', '/dest')
      expect(fs.chmodSync).toHaveBeenCalledWith('/dest', 0o755)
    })
  })

  describe('ensureExecutablePermissions', () => {
    it('sets permissions', () => {
      ensureExecutablePermissions('/dest')
      expect(fs.chmodSync).toHaveBeenCalledWith('/dest', 0o755)
    })
  })
})
