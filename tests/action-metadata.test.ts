import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import yaml from 'js-yaml'

interface ActionFile {
  runs: {
    using: string
    main: string
  }
  inputs: Record<string, { required?: boolean }>
}

function loadActionFile(path: string): ActionFile {
  const source = readFileSync(resolve(process.cwd(), path), 'utf8')
  const parsed = yaml.load(source)
  return parsed as ActionFile
}

describe('action metadata contracts', () => {
  it('install-jlo declares node20 and dist entrypoint', () => {
    const action = loadActionFile('install-jlo/action.yml')
    expect(action.runs.using).toBe('node20')
    expect(action.runs.main).toBe('dist/index.js')
    expect(action.inputs.token.required).toBe(true)
  })

  it('wait-for-sync-pr-merge declares node20 and required PR input', () => {
    const action = loadActionFile('wait-for-sync-pr-merge/action.yml')
    expect(action.runs.using).toBe('node20')
    expect(action.runs.main).toBe('dist/index.js')
    expect(action.inputs.pr_number.required).toBe(true)
    expect(action.inputs.token.required).toBe(true)
  })
})
