/**
 * File Pattern Loader - loads file discovery patterns from JSON configuration
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { OperatingSystem } from '../types/backup-config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

type FilePattern = {
  path: string
  name: string
  description: string
  autoExclude?: boolean
  warnSecrets?: boolean
}

type FilePatternConfig = {
  version: string
  description?: string
  common: { [category: string]: FilePattern[] }
  macos?: { [category: string]: FilePattern[] }
  linux?: { [category: string]: FilePattern[] }
}

let cachedConfig: FilePatternConfig | null = null

export function loadFilePatterns(): FilePatternConfig {
  if (cachedConfig) return cachedConfig

  try {
    const configPath = path.join(
      __dirname,
      '..',
      'config',
      'file-discovery-patterns.json',
    )
    const content = fs.readFileSync(configPath, 'utf-8')
    cachedConfig = JSON.parse(content)
    return cachedConfig!
  } catch (error: any) {
    throw new Error(
      `Could not load file discovery configuration: ${error.message}`,
    )
  }
}

export function getFilePatternsForOS(
  osType: OperatingSystem,
): Map<string, FilePattern[]> {
  const config = loadFilePatterns()
  const patterns = new Map<string, FilePattern[]>()

  Object.entries(config.common).forEach(([category, files]) => {
    patterns.set(category, files)
  })

  if (osType === 'macos' && config.macos) {
    Object.entries(config.macos).forEach(([category, files]) => {
      const existing = patterns.get(category) || []
      patterns.set(category, [...existing, ...files])
    })
  } else if (osType === 'linux' && config.linux) {
    Object.entries(config.linux).forEach(([category, files]) => {
      const existing = patterns.get(category) || []
      patterns.set(category, [...existing, ...files])
    })
  }

  return patterns
}

export function getAllFilePatterns(osType: OperatingSystem): FilePattern[] {
  const patternsMap = getFilePatternsForOS(osType)
  const allPatterns: FilePattern[] = []

  patternsMap.forEach((patterns) => {
    allPatterns.push(...patterns)
  })

  return allPatterns
}

export function filterAutoExcluded(patterns: FilePattern[]): {
  safe: FilePattern[]
  excluded: FilePattern[]
} {
  const safe: FilePattern[] = []
  const excluded: FilePattern[] = []

  patterns.forEach((pattern) => {
    if (pattern.autoExclude) {
      excluded.push(pattern)
    } else {
      safe.push(pattern)
    }
  })

  return { safe, excluded }
}

export function getSecretWarningPatterns(
  patterns: FilePattern[],
): FilePattern[] {
  return patterns.filter((p) => p.warnSecrets)
}

export function validateConfig(config: FilePatternConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!config.version) errors.push('Missing version field')
  if (!config.common) errors.push('Missing common field')

  const validatePatterns = (
    patterns: FilePattern[],
    category: string,
    os: string,
  ) => {
    patterns.forEach((pattern, index) => {
      if (!pattern.path) errors.push(`${os}.${category}[${index}]: missing path`)
      if (!pattern.name) errors.push(`${os}.${category}[${index}]: missing name`)
      if (!pattern.description)
        errors.push(`${os}.${category}[${index}]: missing description`)
      if (pattern.path && !pattern.path.startsWith('~/'))
        errors.push(`${os}.${category}[${index}]: path must start with ~/`)
    })
  }

  if (config.common) {
    Object.entries(config.common).forEach(([category, patterns]) => {
      validatePatterns(patterns, category, 'common')
    })
  }

  if (config.macos) {
    Object.entries(config.macos).forEach(([category, patterns]) => {
      validatePatterns(patterns, category, 'macos')
    })
  }

  if (config.linux) {
    Object.entries(config.linux).forEach(([category, patterns]) => {
      validatePatterns(patterns, category, 'linux')
    })
  }

  return { valid: errors.length === 0, errors }
}
