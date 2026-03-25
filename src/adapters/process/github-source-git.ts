import { spawnSync } from 'node:child_process'
import type { RepositorySlug } from '../../domain/repository-slug'

const GITHUB_HTTPS_BASE = 'https://github.com/'

export function commandExists(program: string): boolean {
  const result = spawnSync(program, ['--version'], {
    stdio: ['ignore', 'ignore', 'ignore'],
  })
  return result.status === 0
}

export function cloneGitHubBranch(options: {
  repository: RepositorySlug
  branch: string
  destination: string
  token: string
  username: string
}): void {
  runGitHubCommand({
    args: [
      'clone',
      '--quiet',
      '--depth=1',
      '--branch',
      options.branch,
      '--',
      buildAuthenticatedGitHubRepositoryUrl({
        repository: options.repository,
        username: options.username,
        token: options.token,
      }),
      options.destination,
    ],
    operation: `clone ${options.repository.owner}/${options.repository.repo}@${options.branch}`,
  })
}

export function resolveGitWorktreeHeadSha(options: { cwd: string }): string {
  const output = runGitHubCommand({
    cwd: options.cwd,
    args: ['rev-parse', 'HEAD'],
    operation: 'resolve cloned source head SHA',
  }).trim()

  if (!isFullGitSha(output)) {
    throw new Error('Failed to resolve cloned source head SHA.')
  }

  return output
}

export function updateGitHubSubmodules(options: {
  cwd: string
  token: string
  username: string
}): void {
  runGitHubCommand({
    cwd: options.cwd,
    token: options.token,
    username: options.username,
    args: ['submodule', 'sync', '--recursive'],
    operation: 'sync git submodule configuration for source build',
  })

  runGitHubCommand({
    cwd: options.cwd,
    token: options.token,
    username: options.username,
    args: ['submodule', 'update', '--init', '--recursive', '--depth=1'],
    operation: 'fetch git submodules for source build',
  })
}

function runGitHubCommand(options: {
  cwd?: string
  token?: string
  username?: string
  args: string[]
  operation: string
}): string {
  const gitArgs = [
    '-c',
    'credential.helper=',
    '-c',
    'http.connectTimeout=15',
    '-c',
    'http.lowSpeedLimit=1024',
    '-c',
    'http.lowSpeedTime=30',
  ]

  if (options.token) {
    const authenticatedBase = buildAuthenticatedGitHubBase({
      username: options.username ?? 'x-access-token',
      token: options.token,
    })
    gitArgs.push(
      '-c',
      `url.${authenticatedBase}.insteadOf=${GITHUB_HTTPS_BASE}`,
      '-c',
      `url.${authenticatedBase}.insteadOf=git@github.com:`,
      '-c',
      `url.${authenticatedBase}.insteadOf=ssh://git@github.com/`,
    )
  }

  gitArgs.push(...options.args)

  const result = spawnSync('git', gitArgs, {
    cwd: options.cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
    },
  })

  if (result.status === 0) {
    return result.stdout
  }

  const stderr = result.stderr.trim()
  if (stderr.length > 0) {
    throw new Error(`Failed to ${options.operation}: ${stderr}`)
  }

  throw new Error(`Failed to ${options.operation}: ${result.stdout.trim()}`)
}

function buildGitHubRepositoryUrl(repository: RepositorySlug): string {
  return `${GITHUB_HTTPS_BASE}${repository.owner}/${repository.repo}.git`
}

function buildAuthenticatedGitHubRepositoryUrl(options: {
  repository: RepositorySlug
  username: string
  token: string
}): string {
  return buildGitHubRepositoryUrl(options.repository).replace(
    GITHUB_HTTPS_BASE,
    buildAuthenticatedGitHubBase({
      username: options.username,
      token: options.token,
    }),
  )
}

function buildAuthenticatedGitHubBase(options: {
  username: string
  token: string
}): string {
  const encodedUsername = encodeURIComponent(options.username)
  const encodedToken = encodeURIComponent(options.token)
  return `https://${encodedUsername}:${encodedToken}@github.com/`
}

function isFullGitSha(value: string): boolean {
  return /^[0-9a-fA-F]{40}$/.test(value)
}
