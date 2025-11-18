/**
 * Path Manipulation Utilities
 *
 * Centralized utilities for path handling, validation, and transformation.
 * These utilities provide consistent path manipulation across the entire codebase.
 */

import fs from 'fs'
import path from 'path'
import os from 'os'

/**
 * Expand tilde (~) in a path to the user's home directory
 *
 * @param filePath - Path that may contain a leading tilde
 * @returns Absolute path with tilde expanded
 *
 * @example
 * expandTilde('~/.zshrc') // => '/Users/bob/.zshrc'
 * expandTilde('~/dev/project') // => '/Users/bob/dev/project'
 * expandTilde('/absolute/path') // => '/absolute/path' (unchanged)
 */
export function expandTilde(filePath: string): string {
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2))
  }
  return filePath
}

/**
 * Convert an absolute path to a home-relative path with tilde notation
 *
 * @param absolutePath - Absolute file system path
 * @returns Path relative to home directory with leading tilde
 *
 * @example
 * getRelativePath('/Users/bob/.zshrc') // => '~/.zshrc'
 * getRelativePath('/Users/bob/dev/project') // => '~/dev/project'
 * getRelativePath('/etc/hosts') // => '/etc/hosts' (unchanged if not in home)
 */
export function getRelativePath(absolutePath: string): string {
  const homeDir = os.homedir()
  if (absolutePath.startsWith(homeDir)) {
    return '~' + absolutePath.slice(homeDir.length)
  }
  return absolutePath
}

/**
 * Check if a file or directory exists
 *
 * @param filePath - Path to check (can contain tilde)
 * @returns True if the path exists
 *
 * @example
 * pathExists('~/.zshrc') // => true
 * pathExists('~/nonexistent') // => false
 */
export function pathExists(filePath: string): boolean {
  const absolutePath = expandTilde(filePath)
  return fs.existsSync(absolutePath)
}

/**
 * Check if a path is a directory
 *
 * @param filePath - Path to check (can contain tilde)
 * @returns True if the path exists and is a directory
 *
 * @example
 * isDirectory('~/.ssh') // => true
 * isDirectory('~/.zshrc') // => false
 */
export function isDirectory(filePath: string): boolean {
  const absolutePath = expandTilde(filePath)
  try {
    const stats = fs.statSync(absolutePath)
    return stats.isDirectory()
  } catch {
    return false
  }
}

/**
 * Check if a path is a git repository
 *
 * @param dirPath - Directory path to check (can contain tilde)
 * @returns True if the directory contains a .git folder
 *
 * @example
 * isGitRepository('~/dev/dotfiles') // => true
 * isGitRepository('~/dev/random-folder') // => false
 */
export function isGitRepository(dirPath: string): boolean {
  const absolutePath = expandTilde(dirPath)
  const gitDir = path.join(absolutePath, '.git')
  return fs.existsSync(gitDir)
}

/**
 * Ensure a directory exists, creating it if necessary
 *
 * @param dirPath - Directory path (can contain tilde)
 * @param options - Options for directory creation
 * @returns Absolute path of the created/existing directory
 *
 * @example
 * ensureDirectory('~/.config/myapp') // Creates if doesn't exist
 * ensureDirectory('~/.config/myapp', { mode: 0o700 }) // With custom permissions
 */
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

/**
 * Get file size in bytes
 *
 * @param filePath - Path to file (can contain tilde)
 * @returns File size in bytes, or undefined if file doesn't exist or is a directory
 *
 * @example
 * getFileSize('~/.zshrc') // => 1234
 * getFileSize('~/nonexistent') // => undefined
 */
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

/**
 * Validate that a path exists and optionally check type
 *
 * @param filePath - Path to validate (can contain tilde)
 * @param options - Validation options
 * @returns Error message if invalid, true if valid
 *
 * @example
 * validatePath('~/.zshrc') // => true
 * validatePath('~/nonexistent') // => 'Path does not exist: /Users/bob/nonexistent'
 * validatePath('~/.zshrc', { mustBeDirectory: true }) // => 'Path is not a directory'
 */
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

/**
 * Join paths and automatically expand tilde in the first segment
 *
 * @param segments - Path segments to join
 * @returns Joined absolute path
 *
 * @example
 * joinPaths('~', '.config', 'myapp') // => '/Users/bob/.config/myapp'
 * joinPaths('~/dev', 'project', 'src') // => '/Users/bob/dev/project/src'
 */
export function joinPaths(...segments: string[]): string {
  if (segments.length === 0) return ''

  const [first, ...rest] = segments
  const expandedFirst = expandTilde(first)
  return path.join(expandedFirst, ...rest)
}

/**
 * Normalize a path by expanding tilde and resolving relative segments
 *
 * @param filePath - Path to normalize (can contain tilde, .., .)
 * @returns Normalized absolute path
 *
 * @example
 * normalizePath('~/dev/../config') // => '/Users/bob/config'
 * normalizePath('~/.') // => '/Users/bob'
 */
export function normalizePath(filePath: string): string {
  const expanded = expandTilde(filePath)
  return path.normalize(expanded)
}
