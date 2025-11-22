/**
 * Path Helpers - path handling, validation, and transformation
 */

import fs from 'fs'
import path from 'path'
import os from 'os'

// Expands ~/path to /Users/username/path
export function expandTilde(filePath: string): string {
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2))
  }
  return filePath
}

// Converts /Users/username/path to ~/path
export function getRelativePath(absolutePath: string): string {
  const homeDir = os.homedir()
  if (absolutePath.startsWith(homeDir)) {
    return '~' + absolutePath.slice(homeDir.length)
  }
  return absolutePath
}

export function pathExists(filePath: string): boolean {
  const absolutePath = expandTilde(filePath)
  return fs.existsSync(absolutePath)
}

export function isDirectory(filePath: string): boolean {
  const absolutePath = expandTilde(filePath)
  try {
    const stats = fs.statSync(absolutePath)
    return stats.isDirectory()
  } catch {
    return false
  }
}

export function isGitRepository(dirPath: string): boolean {
  const absolutePath = expandTilde(dirPath)
  const gitDir = path.join(absolutePath, '.git')
  return fs.existsSync(gitDir)
}

export function ensureDirectory(
  dirPath: string,
  options: { mode?: number; recursive?: boolean } = {},
): string {
  const absolutePath = expandTilde(dirPath)
  const { mode = 0o755, recursive = true } = options

  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { mode, recursive })
  }

  return absolutePath
}

export function getFileSize(filePath: string): number | undefined {
  const absolutePath = expandTilde(filePath)
  try {
    const stats = fs.statSync(absolutePath)
    if (stats.isFile()) {
      return stats.size
    }
    return undefined
  } catch {
    return undefined
  }
}

// Returns true if valid, error message string if invalid
export function validatePath(
  filePath: string,
  options: {
    mustExist?: boolean
    mustBeDirectory?: boolean
    mustBeFile?: boolean
    mustBeGitRepo?: boolean
  } = {},
): string | true {
  const {
    mustExist = true,
    mustBeDirectory = false,
    mustBeFile = false,
    mustBeGitRepo = false,
  } = options

  const absolutePath = expandTilde(filePath)

  if (mustExist && !fs.existsSync(absolutePath)) {
    return `Path does not exist: ${absolutePath}`
  }

  if (!fs.existsSync(absolutePath)) {
    return true // Path doesn't exist but that's ok if mustExist is false
  }

  const stats = fs.statSync(absolutePath)

  if (mustBeDirectory && !stats.isDirectory()) {
    return `Path is not a directory: ${absolutePath}`
  }

  if (mustBeFile && !stats.isFile()) {
    return `Path is not a file: ${absolutePath}`
  }

  if (mustBeGitRepo && !isGitRepository(absolutePath)) {
    return `Not a git repository: ${absolutePath}\nPlease provide a path to a valid git repository`
  }

  return true
}

export function joinPaths(...segments: string[]): string {
  if (segments.length === 0) return ''

  const [first, ...rest] = segments
  const expandedFirst = expandTilde(first)
  return path.join(expandedFirst, ...rest)
}

export function normalizePath(filePath: string): string {
  const expanded = expandTilde(filePath)
  return path.normalize(expanded)
}
