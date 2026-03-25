import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import * as childProcess from 'node:child_process'
import * as core from '@actions/core'
import {
  resolvePlatformCacheDirectory,
  ensureInstallDirectory,
  installBinaryOnPath,
  pruneSiblingInstallDirectories,
  isCachedBinaryForVersion,
  detectBinaryVersion,
  copyExecutableBinary,
  ensureExecutablePermissions,
} from '../../../src/adapters/cache/binary-install-cache'

vi.mock('node:child_process')
vi.mock('@actions/core')

describe('binary-install-cache adapter', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'binary-install-cache-test-'))
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
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
      const platformDir = path.join(tempDir, 'linux-x86_64')
      const installKey = 'key'
      const expectedDir = path.join(platformDir, installKey)

      expect(ensureInstallDirectory(platformDir, installKey)).toBe(expectedDir)

      expect(fs.existsSync(platformDir)).toBe(true)
      expect(fs.existsSync(expectedDir)).toBe(true)
      expect(fs.statSync(expectedDir).isDirectory()).toBe(true)
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
      const platformDir = path.join(tempDir, 'non-existent')
      // Shouldn't throw
      pruneSiblingInstallDirectories(platformDir, 'keep')
    })

    it('removes sibling directories', () => {
      const platformDir = path.join(tempDir, 'cache')
      fs.mkdirSync(platformDir)

      const keepDir = path.join(platformDir, 'keep')
      fs.mkdirSync(keepDir)

      const removeDir1 = path.join(platformDir, 'remove1')
      fs.mkdirSync(removeDir1)

      const removeFile = path.join(platformDir, 'remove2')
      fs.writeFileSync(removeFile, 'data')

      pruneSiblingInstallDirectories(platformDir, 'keep')

      expect(fs.existsSync(removeDir1)).toBe(false)
      expect(fs.existsSync(keepDir)).toBe(true)
      expect(fs.existsSync(removeFile)).toBe(true) // it only removes directories
    })
  })

  describe('isCachedBinaryForVersion', () => {
    it('returns false if binary does not exist', () => {
      const nonExistentBin = path.join(tempDir, 'missing-bin')
      expect(isCachedBinaryForVersion(nonExistentBin, '1.0.0')).toBe(false)
    })

    it('returns false if binary execution fails', () => {
      const binPath = path.join(tempDir, 'bin1')
      fs.writeFileSync(binPath, '')
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 1,
      } as ReturnType<typeof childProcess.spawnSync>)
      expect(isCachedBinaryForVersion(binPath, '1.0.0')).toBe(false)
    })

    it('returns true if binary execution succeeds and version matches', () => {
      const binPath = path.join(tempDir, 'bin2')
      fs.writeFileSync(binPath, '')
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
        stdout: 'jlo 1.0.0',
      } as ReturnType<typeof childProcess.spawnSync>)
      expect(isCachedBinaryForVersion(binPath, '1.0.0')).toBe(true)
    })

    it('returns true if binary execution succeeds and version matches with v prefix', () => {
      const binPath = path.join(tempDir, 'bin3')
      fs.writeFileSync(binPath, '')
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
        stdout: 'jlo v1.0.0',
      } as ReturnType<typeof childProcess.spawnSync>)
      expect(isCachedBinaryForVersion(binPath, '1.0.0')).toBe(true)
    })

    it('returns false if binary execution succeeds and version mismatches', () => {
      const binPath = path.join(tempDir, 'bin4')
      fs.writeFileSync(binPath, '')
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
        stdout: 'jlo 2.0.0',
      } as ReturnType<typeof childProcess.spawnSync>)
      expect(isCachedBinaryForVersion(binPath, '1.0.0')).toBe(false)
    })

    it('returns false if version format is unrecognized', () => {
      const binPath = path.join(tempDir, 'bin5')
      fs.writeFileSync(binPath, '')
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
        stdout: 'jlo unknown',
      } as ReturnType<typeof childProcess.spawnSync>)
      expect(isCachedBinaryForVersion(binPath, '1.0.0')).toBe(false)
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
      const srcPath = path.join(tempDir, 'src-bin')
      fs.writeFileSync(srcPath, 'executable content')
      const destPath = path.join(tempDir, 'dest-bin')

      copyExecutableBinary(srcPath, destPath)

      expect(fs.existsSync(destPath)).toBe(true)
      expect(fs.readFileSync(destPath, 'utf8')).toBe('executable content')
      if (os.platform() !== 'win32') {
        const stats = fs.statSync(destPath)
        expect((stats.mode & 0o777)).toBe(0o755)
      }
    })
  })

  describe('ensureExecutablePermissions', () => {
    it('sets permissions', () => {
      const targetPath = path.join(tempDir, 'target-bin')
      fs.writeFileSync(targetPath, 'content')
      if (os.platform() !== 'win32') {
        fs.chmodSync(targetPath, 0o644) // start with rw-r--r--
      }

      ensureExecutablePermissions(targetPath)

      if (os.platform() !== 'win32') {
        const stats = fs.statSync(targetPath)
        expect((stats.mode & 0o777)).toBe(0o755)
      }
    })
  })
})
