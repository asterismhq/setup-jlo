export interface RetryOptions {
  maxAttempts: number
  delayMs: number
}

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxAttempts, delayMs } = options
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt === maxAttempts) {
        break
      }
      await sleep(delayMs)
    }
  }

  throw lastError
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
