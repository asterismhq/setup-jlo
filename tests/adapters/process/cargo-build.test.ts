import { describe, expect, it, vi, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as childProcess from 'node:child_process'
import { buildCargoRelease } from '../../../src/adapters/process/cargo-build'

vi.mock('node:fs')
vi.mock('node:child_process')

describe('cargo-build adapter', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('buildCargoRelease', () => {
    it('throws error if build fails', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 1,
        stderr: 'compilation error\n',
      } as ReturnType<typeof childProcess.spawnSync>)

      expect(() =>
        buildCargoRelease({
          cwd: '/src',
          manifestPath: '/src/Cargo.toml',
          buildTargetDir: '/target',
        }),
      ).toThrowError('Failed to build astm from source: compilation error')
    })

    it('throws error if binary is not found after successful build', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
      } as ReturnType<typeof childProcess.spawnSync>)
      vi.mocked(fs.existsSync).mockReturnValue(false)

      expect(() =>
        buildCargoRelease({
          cwd: '/src',
          manifestPath: '/src/Cargo.toml',
          buildTargetDir: '/target',
        }),
      ).toThrowError(
        "Source build completed but binary not found at '/target/release/astm'.",
      )
    })

    it('returns path to built binary if build succeeds and binary exists', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
      } as ReturnType<typeof childProcess.spawnSync>)
      vi.mocked(fs.existsSync).mockImplementation(
        (path) => path === '/target/release/astm',
      )

      const result = buildCargoRelease({
        cwd: '/src',
        manifestPath: '/src/Cargo.toml',
        buildTargetDir: '/target',
      })

      expect(result).toBe('/target/release/astm')

      expect(childProcess.spawnSync).toHaveBeenCalledWith(
        'cargo',
        ['build', '--release', '--manifest-path', '/src/Cargo.toml'],
        expect.objectContaining({
          cwd: '/src',
          env: expect.objectContaining({
            CARGO_TARGET_DIR: '/target',
          }),
        }),
      )
    })
  })
})
