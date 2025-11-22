/**
 * Shell Config - handles shell RC file modifications for sourcing secret files
 */

import fs from 'fs'
import path from 'path'
import { expandTilde } from './path-helpers'

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
      return path.join(homeDir, `.${shell}rc`)
  }
}

export function checkRCFileSourcesSecret(
  shell: string,
  secretFilePath: string,
): boolean {
  const rcPath = getShellRCPath(shell)
  const expandedSecretPath = expandTilde(secretFilePath)

  if (!fs.existsSync(rcPath)) return false

  const rcContent = fs.readFileSync(rcPath, 'utf-8')

  const sourcePatterns = [
    `source ${secretFilePath}`,
    `source ${expandedSecretPath}`,
    `. ${secretFilePath}`,
    `. ${expandedSecretPath}`,
  ]

  return sourcePatterns.some((pattern) => rcContent.includes(pattern))
}

export function addSecretSourceToRC(
  shell: string,
  secretFilePath: string,
): { success: boolean; error?: string } {
  const rcPath = getShellRCPath(shell)

  try {
    if (!fs.existsSync(rcPath)) {
      const rcDir = path.dirname(rcPath)
      if (!fs.existsSync(rcDir)) {
        fs.mkdirSync(rcDir, { recursive: true })
      }
      fs.writeFileSync(rcPath, '', { mode: 0o644 })
    }

    const currentContent = fs.readFileSync(rcPath, 'utf-8')

    if (checkRCFileSourcesSecret(shell, secretFilePath)) {
      return { success: true }
    }

    const sourceBlock = `
# ============================================================================
# Environment Variables & Secrets
# ============================================================================
# Load environment variables (API keys, secrets, etc.)
if [ -f ${secretFilePath} ]; then
  source ${secretFilePath}
fi
`

    const newContent = currentContent.trimEnd() + '\n' + sourceBlock + '\n'
    fs.writeFileSync(rcPath, newContent, { mode: 0o644 })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

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

    if (!trimmed || trimmed.startsWith('#')) continue

    const hasExport = trimmed.startsWith('export ')
    if (hasExport) hasAnyExports = true

    const lineWithoutExport = trimmed.replace(/^export\s+/, '')
    const equalIndex = lineWithoutExport.indexOf('=')

    if (equalIndex > 0) {
      const key = lineWithoutExport.substring(0, equalIndex).trim()
      const value = lineWithoutExport.substring(equalIndex + 1).trim()
      entries.push({ key, value, hasExport })
    }
  }

  return { hasExports: hasAnyExports, entries }
}

export function convertEnvToEnvSh(
  sourceFilePath: string,
  targetFilePath: string,
): { success: boolean; error?: string } {
  try {
    const expandedSourcePath = expandTilde(sourceFilePath)
    const expandedTargetPath = expandTilde(targetFilePath)

    const parsed = parseEnvFile(sourceFilePath)

    if (parsed.entries.length === 0) {
      return { success: false, error: 'No environment variables found in source file' }
    }

    const lines: string[] = [
      '#!/bin/sh',
      '# Environment variables and secrets',
      '# Generated from ' + path.basename(expandedSourcePath),
      '',
    ]

    for (const entry of parsed.entries) {
      lines.push(`export ${entry.key}=${entry.value}`)
    }

    lines.push('')

    const targetDir = path.dirname(expandedTargetPath)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    fs.writeFileSync(expandedTargetPath, lines.join('\n'), { mode: 0o600 })

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
