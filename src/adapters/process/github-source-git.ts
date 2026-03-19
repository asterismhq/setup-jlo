import { spawnSync } from 'node:child_process'

const GITHUB_HTTPS_BASE = 'https://github.com/'
const GITHUB_AUTH_USERNAME = 'x-access-token'

export function commandExists(program: string): boolean {
  const result = spawnSync(program, ['--version'], {
    stdio: ['ignore', 'ignore', 'ignore'],
  })
  return result.status === 0
}

export function resolveGitHubBranchHeadSha(options: {
  repository: string
  branch: string
  token: string
}): string {
  const output = runGitHubCommand({
    token: options.token,
    args: [
      'ls-remote',
      '--exit-code',
      '--heads',
      buildGitHubRepositoryUrl(options.repository),
      options.branch,
    ],
    operation: `resolve ${options.repository}@${options.branch} head SHA`,
  }).trim()

  const sha = output.split(/\s+/)[0] ?? ''
  if (!isFullGitSha(sha)) {
    throw new Error(
      `Failed to resolve ${options.repository}@${options.branch} head SHA.`,
    )
  }

  return sha
}

export function cloneGitHubBranch(options: {
  repository: string
  branch: string
  destination: string
  token: string
}): void {
  runGitHubCommand({
    token: options.token,
    args: [
      'clone',
      '--quiet',
      '--depth=1',
      '--branch',
      options.branch,
      '--',
      buildGitHubRepositoryUrl(options.repository),
      options.destination,
    ],
    operation: `clone ${options.repository}@${options.branch}`,
  })
}

export function updateGitHubSubmodules(options: {
  cwd: string
  token: string
}): void {
  runGitHubCommand({
    cwd: options.cwd,
    token: options.token,
    args: ['submodule', 'sync', '--recursive'],
    operation: 'sync git submodule configuration for source build',
  })

  runGitHubCommand({
    cwd: options.cwd,
    token: options.token,
    args: ['submodule', 'update', '--init', '--recursive', '--depth=1'],
    operation: 'fetch git submodules for source build',
  })
}

function runGitHubCommand(options: {
  cwd?: string
  token?: string
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
    const authenticatedBase = buildAuthenticatedGitHubBase(options.token)
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

function buildGitHubRepositoryUrl(repository: string): string {
  return `${GITHUB_HTTPS_BASE}${repository}.git`
}

function buildAuthenticatedGitHubBase(token: string): string {
  const encodedToken = encodeURIComponent(token)
  return `https://${GITHUB_AUTH_USERNAME}:${encodedToken}@github.com/`
}

function isFullGitSha(value: string): boolean {
  return /^[0-9a-fA-F]{40}$/.test(value)
}
