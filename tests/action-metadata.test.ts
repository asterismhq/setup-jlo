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
  it('setup-jlo declares node20 and dist entrypoint', () => {
    const action = loadActionFile('action.yml')
    expect(action.runs.using).toBe('node20')
    expect(action.runs.main).toBe('dist/index.js')
    expect(action.inputs.token.required).toBe(true)
    expect(action.inputs.version.required).toBe(true)
  })
})
