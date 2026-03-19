import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'

export function commandExists(program: string): boolean {
  const result = spawnSync(program, ['--version'], {
    stdio: ['ignore', 'ignore', 'ignore'],
  })
  return result.status === 0
}

export function runGitWithOptionalAuth(options: {
  cwd?: string
  authHeader?: string
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

  if (options.authHeader) {
    gitArgs.push('-c', `http.extraheader=${options.authHeader}`)
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

export function basicAuthHeader(token: string): string {
  const username = normalizeGitHttpUsername(process.env.GITHUB_ACTOR)
  const payload = Buffer.from(`${username}:${token}`, 'utf8').toString('base64')
  return `Authorization: Basic ${payload}`
}

export function isFullGitSha(value: string): boolean {
  return /^[0-9a-fA-F]{40}$/.test(value)
}

function normalizeGitHttpUsername(value: string | undefined): string {
  if (!value) {
    return 'git'
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : 'git'
}
