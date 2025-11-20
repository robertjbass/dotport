/**
 * Shell Configuration Utility
 *
 * Handles shell RC file modifications for sourcing secret files
 */

import fs from 'fs'
import path from 'path'
import { expandTilde } from './path-helpers'

/**
 * Get the RC file path for a given shell
 *
 * @param shell - Shell name (zsh, bash, fish, etc.)
 * @returns Absolute path to the RC file
 */
export function getShellRCPath(shell: string): string {
  const homeDir = process.env.HOME || '~'

  switch (shell.toLowerCase()) {
    case 'zsh':
      return path.join(homeDir, '.zshrc')
    case 'bash':
      return path.join(homeDir, '.bashrc')
    case 'fish':
      return path.join(homeDir, '.config/fish/config.fish')
    default:
      // For unknown shells, try common pattern
      return path.join(homeDir, `.${shell}rc`)
  }
}

/**
 * Check if a shell RC file sources a given secret file
 *
 * @param shell - Shell name
 * @param secretFilePath - Path to secret file (can contain tilde)
 * @returns True if RC file sources the secret file
 */
export function checkRCFileSourcesSecret(
  shell: string,
  secretFilePath: string,
): boolean {
  const rcPath = getShellRCPath(shell)
  const expandedSecretPath = expandTilde(secretFilePath)

  if (!fs.existsSync(rcPath)) {
    return false
  }

  const rcContent = fs.readFileSync(rcPath, 'utf-8')

  // Check for various source patterns
  const sourcePatterns = [
    `source ${secretFilePath}`,
    `source ${expandedSecretPath}`,
    `. ${secretFilePath}`,
    `. ${expandedSecretPath}`,
  ]

  return sourcePatterns.some((pattern) => rcContent.includes(pattern))
}

/**
 * Add source command to shell RC file
 *
 * @param shell - Shell name
 * @param secretFilePath - Path to secret file (should use tilde notation)
 * @returns Success status
 */
export function addSecretSourceToRC(
  shell: string,
  secretFilePath: string,
): { success: boolean; error?: string } {
  const rcPath = getShellRCPath(shell)

  try {
    // Ensure RC file exists
    if (!fs.existsSync(rcPath)) {
      // Create the file if it doesn't exist
      const rcDir = path.dirname(rcPath)
      if (!fs.existsSync(rcDir)) {
        fs.mkdirSync(rcDir, { recursive: true })
      }
      fs.writeFileSync(rcPath, '', { mode: 0o644 })
    }

    // Read current content
    const currentContent = fs.readFileSync(rcPath, 'utf-8')

    // Check if already sources this file
    if (checkRCFileSourcesSecret(shell, secretFilePath)) {
      return { success: true }
    }

    // Prepare the source block to add
    const sourceBlock = `
# ============================================================================
# Environment Variables & Secrets
# ============================================================================
# Load environment variables (API keys, secrets, etc.)
if [ -f ${secretFilePath} ]; then
  source ${secretFilePath}
fi
`

    // Add to the end of the file with proper spacing
    const newContent = currentContent.trimEnd() + '\n' + sourceBlock + '\n'

    // Write back to file
    fs.writeFileSync(rcPath, newContent, { mode: 0o644 })

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Parse a .env file and check if it uses export syntax
 *
 * @param filePath - Path to .env file
 * @returns Object with hasExports boolean and parsed entries
 */
export function parseEnvFile(filePath: string): {
  hasExports: boolean
  entries: Array<{ key: string; value: string; hasExport: boolean }>
} {
  const expandedPath = expandTilde(filePath)

  if (!fs.existsSync(expandedPath)) {
    return { hasExports: true, entries: [] }
  }

  const content = fs.readFileSync(expandedPath, 'utf-8')
  const lines = content.split('\n')
  const entries: Array<{ key: string; value: string; hasExport: boolean }> = []
  let hasAnyExports = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    // Check if line has export
    const hasExport = trimmed.startsWith('export ')
    if (hasExport) {
      hasAnyExports = true
    }

    // Parse the line
    const lineWithoutExport = trimmed.replace(/^export\s+/, '')
    const equalIndex = lineWithoutExport.indexOf('=')

    if (equalIndex > 0) {
      const key = lineWithoutExport.substring(0, equalIndex).trim()
      const value = lineWithoutExport.substring(equalIndex + 1).trim()

      entries.push({ key, value, hasExport })
    }
  }

  return {
    hasExports: hasAnyExports,
    entries,
  }
}

/**
 * Convert .env file to .env.sh format with exports
 *
 * @param sourceFilePath - Path to source .env file
 * @param targetFilePath - Path to target .env.sh file
 * @returns Success status
 */
export function convertEnvToEnvSh(
  sourceFilePath: string,
  targetFilePath: string,
): { success: boolean; error?: string } {
  try {
    const expandedSourcePath = expandTilde(sourceFilePath)
    const expandedTargetPath = expandTilde(targetFilePath)

    // Parse the source file
    const parsed = parseEnvFile(sourceFilePath)

    if (parsed.entries.length === 0) {
      return {
        success: false,
        error: 'No environment variables found in source file',
      }
    }

    // Build the .env.sh content
    const lines: string[] = [
      '#!/bin/sh',
      '# Environment variables and secrets',
      '# Generated from ' + path.basename(expandedSourcePath),
      '',
    ]

    // Add all entries with export
    for (const entry of parsed.entries) {
      lines.push(`export ${entry.key}=${entry.value}`)
    }

    lines.push('') // Trailing newline

    // Write to target file
    const targetDir = path.dirname(expandedTargetPath)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    fs.writeFileSync(expandedTargetPath, lines.join('\n'), { mode: 0o600 })

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}
