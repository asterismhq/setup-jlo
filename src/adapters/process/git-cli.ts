import { spawnSync } from 'node:child_process'

export function commandExists(program: string): boolean {
  const result = spawnSync(program, ['--version'], {
    stdio: ['ignore', 'ignore', 'ignore'],
  })
  return result.status === 0
}

export function runGitWithOptionalAuth(options: {
  cwd?: string
  authToken?: string
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

  if (options.authToken) {
    gitArgs.push(
      '-c',
      `credential.helper=${credentialHelperScript(options.authToken)}`,
      '-c',
      'credential.useHttpPath=true',
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

export function isFullGitSha(value: string): boolean {
  return /^[0-9a-fA-F]{40}$/.test(value)
}

function credentialHelperScript(token: string): string {
  const username = normalizeGitHttpUsername(process.env.GITHUB_ACTOR)
  const escapedToken = token.replaceAll("'", "'\"'\"'")
  const escapedUsername = username.replaceAll("'", "'\"'\"'")
  return `!f() { test "$1" = get || exit 0; echo 'username=${escapedUsername}'; echo 'password=${escapedToken}'; }; f`
}

function normalizeGitHttpUsername(value: string | undefined): string {
  if (!value) {
    return 'git'
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : 'git'
}
