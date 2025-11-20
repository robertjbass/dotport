/**
 * File Discovery Utility
 *
 * Scans the user's home directory for common dotfiles and config files
 */

import fs from 'fs'
import { OperatingSystem } from '../types/backup-config'
import { expandTilde, getRelativePath } from './path-helpers'
import {
  COMMON_FILES,
  MACOS_FILES,
  LINUX_FILES,
} from '../constants/discoverable-files'

export type DiscoveredFile = {
  name: string // Display name (e.g., '.zshrc', 'Ghostty config')
  path: string // Absolute path (e.g., '/Users/bob/.zshrc')
  relativePath: string // Relative to home (e.g., '~/.zshrc')
  category:
    | 'shell'
    | 'secrets'
    | 'git'
    | 'devtools'
    | 'ssh'
    | 'editor'
    | 'terminal'
    | 'app-config'
    | 'keybinding'
    | 'other'
  exists: boolean // Whether file actually exists
  size?: number // File size in bytes
  isDirectory: boolean // Whether it's a directory
}

/**
 * Check if a file or directory exists and get its details
 */
function checkFileExists(filePath: string): {
  exists: boolean
  size?: number
  isDirectory: boolean
} {
  const absolutePath = expandTilde(filePath)

  try {
    const stats = fs.statSync(absolutePath)
    return {
      exists: true,
      size: stats.isDirectory() ? undefined : stats.size,
      isDirectory: stats.isDirectory(),
    }
  } catch (error) {
    return {
      exists: false,
      isDirectory: false,
    }
  }
}

/**
 * Discover common dotfiles and config files
 */
export function discoverConfigFiles(osType: OperatingSystem): DiscoveredFile[] {
  const discovered: DiscoveredFile[] = []

  // Add common files
  Object.entries(COMMON_FILES).forEach(([category, files]) => {
    files.forEach((file) => {
      const absolutePath = expandTilde(file.path)
      const fileInfo = checkFileExists(file.path)

      discovered.push({
        name: file.name,
        path: absolutePath,
        relativePath: getRelativePath(absolutePath),
        category: category as any,
        ...fileInfo,
      })
    })
  })

  // Add OS-specific files
  if (osType === 'macos') {
    Object.entries(MACOS_FILES).forEach(([category, files]) => {
      files.forEach((file) => {
        const absolutePath = expandTilde(file.path)
        const fileInfo = checkFileExists(file.path)

        discovered.push({
          name: file.name,
          path: absolutePath,
          relativePath: getRelativePath(absolutePath),
          category: category === 'homebrew' ? 'app-config' : 'app-config',
          ...fileInfo,
        })
      })
    })
  } else if (osType === 'linux') {
    Object.entries(LINUX_FILES).forEach(([category, files]) => {
      files.forEach((file) => {
        const absolutePath = expandTilde(file.path)
        const fileInfo = checkFileExists(file.path)

        discovered.push({
          name: file.name,
          path: absolutePath,
          relativePath: getRelativePath(absolutePath),
          category: category === 'scripts' ? 'other' : 'app-config',
          ...fileInfo,
        })
      })
    })
  }

  return discovered
}

/**
 * Get only files that exist
 */
export function getExistingFiles(osType: OperatingSystem): DiscoveredFile[] {
  return discoverConfigFiles(osType).filter((file) => file.exists)
}

/**
 * Group files by category
 */
export function groupFilesByCategory(
  files: DiscoveredFile[],
): Map<string, DiscoveredFile[]> {
  const grouped = new Map<string, DiscoveredFile[]>()

  files.forEach((file) => {
    const category = file.category
    if (!grouped.has(category)) {
      grouped.set(category, [])
    }
    grouped.get(category)!.push(file)
  })

  return grouped
}

/**
 * Format file for display in selection list
 */
export function formatFileForDisplay(file: DiscoveredFile): string {
  const sizeStr = file.isDirectory
    ? '(dir)'
    : file.size
      ? `(${formatBytes(file.size)})`
      : ''

  return `${file.name} ${sizeStr} - ${file.relativePath}`
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    shell: 'Shell Configuration',
    secrets: 'Secret Files (NOT tracked in git)',
    git: 'Git Configuration',
    devtools: 'Developer Tools & Languages',
    ssh: 'SSH Configuration',
    editor: 'Editor & IDE Configuration',
    terminal: 'Terminal Emulator Configuration',
    'app-config': 'Application Configuration',
    keybinding: 'Key Bindings',
    other: 'Other',
  }

  return names[category] || category
}
