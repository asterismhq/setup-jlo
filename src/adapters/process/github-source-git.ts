import { spawnSync } from 'node:child_process'
import { err, ok, type Result } from '../../domain/result'

const GITHUB_HTTPS_BASE = 'https://github.com/'

export function commandExists(program: string): boolean {
  const result = spawnSync(program, ['--version'], {
    stdio: ['ignore', 'ignore', 'ignore'],
  })
  return result.status === 0
}

export function cloneGitHubBranch(options: {
  repository: string
  branch: string
  destination: string
  token: string
  username: string
}): Result<void> {
  const result = runGitHubCommand({
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
    operation: `clone ${options.repository}@${options.branch}`,
  })

  if (!result.ok) {
    return err(result.error)
  }

  return ok(undefined)
}

export function resolveGitWorktreeHeadSha(options: {
  cwd: string
}): Result<string> {
  const result = runGitHubCommand({
    cwd: options.cwd,
    args: ['rev-parse', 'HEAD'],
    operation: 'resolve cloned source head SHA',
  })

  if (!result.ok) {
    return err(result.error)
  }

  const output = result.value.trim()

  if (!isFullGitSha(output)) {
    return err(new Error('Failed to resolve cloned source head SHA.'))
  }

  return ok(output)
}

export function updateGitHubSubmodules(options: {
  cwd: string
  token: string
  username: string
}): Result<void> {
  const syncResult = runGitHubCommand({
    cwd: options.cwd,
    token: options.token,
    username: options.username,
    args: ['submodule', 'sync', '--recursive'],
    operation: 'sync git submodule configuration for source build',
  })

  if (!syncResult.ok) {
    return err(syncResult.error)
  }

  const updateResult = runGitHubCommand({
    cwd: options.cwd,
    token: options.token,
    username: options.username,
    args: ['submodule', 'update', '--init', '--recursive', '--depth=1'],
    operation: 'fetch git submodules for source build',
  })

  if (!updateResult.ok) {
    return err(updateResult.error)
  }

  return ok(undefined)
}

function runGitHubCommand(options: {
  cwd?: string
  token?: string
  username?: string
  args: string[]
  operation: string
}): Result<string> {
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

  if (result.error) {
    return err(
      new Error(`Failed to ${options.operation}: ${result.error.message}`),
    )
  }

  if (result.status === 0) {
    return ok(result.stdout)
  }

  const stderr = result.stderr.trim()
  if (stderr.length > 0) {
    return err(new Error(`Failed to ${options.operation}: ${stderr}`))
  }

  return err(
    new Error(`Failed to ${options.operation}: ${result.stdout.trim()}`),
  )
}

function buildGitHubRepositoryUrl(repository: string): string {
  return `${GITHUB_HTTPS_BASE}${repository}.git`
}

function buildAuthenticatedGitHubRepositoryUrl(options: {
  repository: string
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
