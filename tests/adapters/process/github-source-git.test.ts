import * as childProcess from 'node:child_process'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cloneGitHubBranch,
  commandExists,
  resolveGitWorktreeHeadSha,
  updateGitHubSubmodules,
} from '../../../src/adapters/process/github-source-git'

vi.mock('node:child_process')

describe('github-source-git adapter', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('commandExists', () => {
    it('returns true if command succeeds', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
      } as ReturnType<typeof childProcess.spawnSync>)
      expect(commandExists('git')).toBe(true)
    })

    it('returns false if command fails', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 1,
      } as ReturnType<typeof childProcess.spawnSync>)
      expect(commandExists('git')).toBe(false)
    })
  })

  describe('cloneGitHubBranch', () => {
    it('returns error if clone fails due to stderr', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 1,
        stderr: 'fatal: Authentication failed',
        stdout: '',
      } as ReturnType<typeof childProcess.spawnSync>)

      const result = cloneGitHubBranch({
        repository: { owner: 'owner', repo: 'repo' },
        branch: 'main',
        destination: '/dest',
        token: 'secret',
        username: 'jlo-bot',
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe(
          'Failed to clone owner/repo@main: fatal: Authentication failed',
        )
      }
    })

    it('returns error if clone fails and stderr is empty but stdout exists', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 1,
        stderr: '  ',
        stdout: 'Error message in stdout',
      } as ReturnType<typeof childProcess.spawnSync>)

      const result = cloneGitHubBranch({
        repository: { owner: 'owner', repo: 'repo' },
        branch: 'main',
        destination: '/dest',
        token: 'secret',
        username: 'jlo-bot',
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe(
          'Failed to clone owner/repo@main: Error message in stdout',
        )
      }
    })

    it('succeeds on successful clone', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
        stdout: '',
        stderr: '',
      } as ReturnType<typeof childProcess.spawnSync>)

      const result = cloneGitHubBranch({
        repository: { owner: 'owner', repo: 'repo' },
        branch: 'main',
        destination: '/dest',
        token: 'secret',
        username: 'jlo-bot',
      })

      expect(result.ok).toBe(true)
      expect(childProcess.spawnSync).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining([
          'clone',
          '--quiet',
          '--depth=1',
          '--branch',
          'main',
          '--',
          'https://jlo-bot:secret@github.com/owner/repo.git',
          '/dest',
        ]),
        expect.anything(),
      )
    })
  })

  describe('resolveGitWorktreeHeadSha', () => {
    it('returns error if command fails', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 1,
        stderr: 'Not a git repository',
        stdout: '',
      } as ReturnType<typeof childProcess.spawnSync>)

      const result = resolveGitWorktreeHeadSha({ cwd: '/src' })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe(
          'Failed to resolve cloned source head SHA: Not a git repository',
        )
      }
    })

    it('returns error if sha format is invalid', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
        stdout: 'shortsha',
        stderr: '',
      } as ReturnType<typeof childProcess.spawnSync>)

      const result = resolveGitWorktreeHeadSha({ cwd: '/src' })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe(
          'Failed to resolve cloned source head SHA.',
        )
      }
    })

    it('returns sha if format is valid', () => {
      const sha = '1234567890abcdef1234567890abcdef12345678'
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
        stdout: `${sha}\n`,
        stderr: '',
      } as ReturnType<typeof childProcess.spawnSync>)

      const result = resolveGitWorktreeHeadSha({ cwd: '/src' })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toBe(sha)
      }
    })
  })

  describe('updateGitHubSubmodules', () => {
    it('returns error if sync fails', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValueOnce({
        status: 1,
        stderr: 'fatal: no submodule mapping found',
        stdout: '',
      } as ReturnType<typeof childProcess.spawnSync>)

      const result = updateGitHubSubmodules({
        cwd: '/src',
        token: 'secret',
        username: 'jlo-bot',
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe(
          'Failed to sync git submodule configuration for source build: fatal: no submodule mapping found',
        )
      }
    })

    it('returns error if update fails', () => {
      vi.mocked(childProcess.spawnSync)
        .mockReturnValueOnce({
          status: 0,
          stdout: '',
          stderr: '',
        } as ReturnType<typeof childProcess.spawnSync>)
        .mockReturnValueOnce({
          status: 1,
          stderr: 'fatal: update failed',
          stdout: '',
        } as ReturnType<typeof childProcess.spawnSync>)

      const result = updateGitHubSubmodules({
        cwd: '/src',
        token: 'secret',
        username: 'jlo-bot',
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe(
          'Failed to fetch git submodules for source build: fatal: update failed',
        )
      }
    })

    it('succeeds on sync and update', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        status: 0,
        stdout: '',
        stderr: '',
      } as ReturnType<typeof childProcess.spawnSync>)

      const result = updateGitHubSubmodules({
        cwd: '/src',
        token: 'secret',
        username: 'jlo-bot',
      })

      expect(result.ok).toBe(true)
      expect(childProcess.spawnSync).toHaveBeenCalledTimes(2)
      expect(childProcess.spawnSync).toHaveBeenNthCalledWith(
        1,
        'git',
        expect.arrayContaining(['submodule', 'sync', '--recursive']),
        expect.anything(),
      )
      expect(childProcess.spawnSync).toHaveBeenNthCalledWith(
        2,
        'git',
        expect.arrayContaining([
          'submodule',
          'update',
          '--init',
          '--recursive',
          '--depth=1',
        ]),
        expect.anything(),
      )
    })
  })
  describe('runGitHubCommand error handling', () => {
    it('returns error if spawnSync itself fails (e.g. binary not found)', () => {
      vi.mocked(childProcess.spawnSync).mockReturnValue({
        error: new Error('spawn git ENOENT'),
        status: null,
      } as ReturnType<typeof childProcess.spawnSync>)

      const result = cloneGitHubBranch({
        repository: { owner: 'owner', repo: 'repo' },
        branch: 'main',
        destination: '/dest',
        token: 'secret',
        username: 'jlo-bot',
      })

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.message).toBe(
          'Failed to clone owner/repo@main: spawn git ENOENT',
        )
      }
    })
  })
})
