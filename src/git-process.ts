import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'

export function commandExists(program: string): boolean {
  const result = spawnSync(program, ['--version'], {
    stdio: ['ignore', 'ignore', 'ignore']
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
    'http.lowSpeedTime=30'
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
      GIT_TERMINAL_PROMPT: '0'
    }
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
  const payload = Buffer.from(`x-access-token:${token}`, 'utf8').toString('base64')
  return `Authorization: Basic ${payload}`
}

export function isFullGitSha(value: string): boolean {
  return /^[0-9a-fA-F]{40}$/.test(value)
}

export function normalizeSubmoduleUrlToHttps(submoduleUrl: string): string {
  if (submoduleUrl.startsWith('git@github.com:')) {
    return `https://github.com/${submoduleUrl.slice('git@github.com:'.length)}`
  }
  if (submoduleUrl.startsWith('ssh://git@github.com/')) {
    return `https://github.com/${submoduleUrl.slice('ssh://git@github.com/'.length)}`
  }
  return submoduleUrl
}

export function rewriteGitmodulesToHttps(
  clonePath: string,
  authHeader?: string
): void {
  const keyList = runGitWithOptionalAuth({
    cwd: clonePath,
    authHeader,
    args: [
      'config',
      '--file',
      '.gitmodules',
      '--name-only',
      '--get-regexp',
      '^submodule\\..*\\.url$'
    ],
    operation: 'enumerate submodule URLs from .gitmodules'
  })

  for (const key of keyList.split('\n').map((line) => line.trim()).filter(Boolean)) {
    const submoduleUrl = runGitWithOptionalAuth({
      cwd: clonePath,
      authHeader,
      args: ['config', '--file', '.gitmodules', '--get', key],
      operation: 'read submodule URL from .gitmodules'
    }).trim()

    const normalized = normalizeSubmoduleUrlToHttps(submoduleUrl)
    if (normalized === submoduleUrl) {
      continue
    }

    runGitWithOptionalAuth({
      cwd: clonePath,
      authHeader,
      args: ['config', '--file', '.gitmodules', key, normalized],
      operation: 'normalize submodule URL to HTTPS for source build'
    })
  }
}
