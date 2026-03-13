import * as core from '@actions/core'

export function getRequiredInput(name: string): string {
  const value = core.getInput(name)
  if (!value || value.trim().length === 0) {
    throw new Error(`Input '${name}' is required.`)
  }
  return value.trim()
}

export function getOptionalInput(name: string): string | undefined {
  const value = core.getInput(name)
  if (!value || value.trim().length === 0) {
    return undefined
  }
  return value.trim()
}

export function getPositiveIntegerInput(
  name: string,
  fallback: number
): number {
  const raw = getOptionalInput(name)
  if (!raw) {
    return fallback
  }

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Input '${name}' must be a positive integer.`)
  }

  return parsed
}
