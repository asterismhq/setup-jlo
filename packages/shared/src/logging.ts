import * as core from '@actions/core'

export function info(message: string): void {
  core.info(message)
}

export function warning(message: string): void {
  core.warning(message)
}

export function debug(message: string): void {
  core.debug(message)
}

export function failure(message: string): never {
  throw new Error(message)
}
