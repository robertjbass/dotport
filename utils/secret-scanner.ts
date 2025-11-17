/**
 * Secret Scanner Utility
 *
 * Scans files for potential secrets before backup to prevent accidental exposure
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface SecretPattern {
  name: string
  regex: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface SecretMatch {
  pattern: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  line: number
  column: number
  match: string
  context: string  // Surrounding text for context
}

export interface ScanResult {
  filePath: string
  scanned: boolean
  containsSecrets: boolean
  matches: SecretMatch[]
  errors?: string[]
  scannedAt: string
}

/**
 * Load secret patterns from configuration
 */
function loadSecretPatterns(): SecretPattern[] {
  try {
    const configPath = path.join(__dirname, '..', 'config', 'file-discovery-patterns.json')
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    return config.secretPatterns?.patterns || []
  } catch (error: any) {
    console.error('Failed to load secret patterns:', error.message)
    return []
  }
}

/**
 * Expand tilde in file path
 */
function expandTilde(filePath: string): string {
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2))
  }
  return filePath
}

/**
 * Check if a file should be scanned (not binary)
 */
function isTextFile(filePath: string): boolean {
  try {
    const buffer = fs.readFileSync(filePath)
    // Check first 8000 bytes for null bytes (indicating binary)
    const chunk = buffer.slice(0, Math.min(8000, buffer.length))

    for (let i = 0; i < chunk.length; i++) {
      if (chunk[i] === 0) {
        return false // Found null byte, likely binary
      }
    }

    return true
  } catch (error) {
    return false
  }
}

/**
 * Scan a single file for secrets
 */
export function scanFile(filePath: string, patterns: SecretPattern[] = []): ScanResult {
  const result: ScanResult = {
    filePath,
    scanned: false,
    containsSecrets: false,
    matches: [],
    errors: [],
    scannedAt: new Date().toISOString(),
  }

  const expandedPath = expandTilde(filePath)

  // Check if file exists
  if (!fs.existsSync(expandedPath)) {
    result.errors!.push(`File not found: ${expandedPath}`)
    return result
  }

  // Check if it's a file (not directory)
  const stats = fs.statSync(expandedPath)
  if (!stats.isFile()) {
    result.errors!.push(`Not a file: ${expandedPath}`)
    return result
  }

  // Skip binary files
  if (!isTextFile(expandedPath)) {
    result.errors!.push('Binary file, skipping scan')
    return result
  }

  // Skip very large files (> 10MB)
  if (stats.size > 10 * 1024 * 1024) {
    result.errors!.push(`File too large (${Math.round(stats.size / 1024 / 1024)}MB), skipping scan`)
    return result
  }

  try {
    const content = fs.readFileSync(expandedPath, 'utf-8')
    const lines = content.split('\n')

    // Use provided patterns or load from config
    const patternsToUse = patterns.length > 0 ? patterns : loadSecretPatterns()

    // Scan each line
    lines.forEach((line, lineIndex) => {
      patternsToUse.forEach(pattern => {
        const regex = new RegExp(pattern.regex, 'gi')
        let match

        while ((match = regex.exec(line)) !== null) {
          result.matches.push({
            pattern: pattern.name,
            severity: pattern.severity,
            line: lineIndex + 1,
            column: match.index + 1,
            match: match[0],
            context: getContext(lines, lineIndex, match.index, match[0].length),
          })
        }
      })
    })

    result.scanned = true
    result.containsSecrets = result.matches.length > 0

  } catch (error: any) {
    result.errors!.push(`Error reading file: ${error.message}`)
  }

  return result
}

/**
 * Get surrounding context for a match
 */
function getContext(lines: string[], lineIndex: number, columnIndex: number, matchLength: number): string {
  const line = lines[lineIndex]
  const start = Math.max(0, columnIndex - 20)
  const end = Math.min(line.length, columnIndex + matchLength + 20)

  let context = line.slice(start, end)

  // Add ellipsis if truncated
  if (start > 0) context = '...' + context
  if (end < line.length) context = context + '...'

  return context
}

/**
 * Scan multiple files for secrets
 */
export function scanFiles(filePaths: string[], patterns?: SecretPattern[]): ScanResult[] {
  return filePaths.map(filePath => scanFile(filePath, patterns))
}

/**
 * Generate a summary report of scan results
 */
export function generateSummary(results: ScanResult[]): {
  totalFiles: number
  scannedFiles: number
  filesWithSecrets: number
  totalMatches: number
  bySeverity: {
    critical: number
    high: number
    medium: number
    low: number
  }
} {
  const summary = {
    totalFiles: results.length,
    scannedFiles: results.filter(r => r.scanned).length,
    filesWithSecrets: results.filter(r => r.containsSecrets).length,
    totalMatches: results.reduce((sum, r) => sum + r.matches.length, 0),
    bySeverity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
  }

  results.forEach(result => {
    result.matches.forEach(match => {
      summary.bySeverity[match.severity]++
    })
  })

  return summary
}

/**
 * Check if a file is a known secret file (should be excluded from backup)
 */
export function isKnownSecretFile(filePath: string): boolean {
  const secretFileNames = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    '.env.sh',
    '.secrets',
    '.zshsecrets',
    '.bashsecrets',
    'credentials.json',
    'service-account.json',
    '.npmrc',
    '.pypirc',
    'id_rsa',
    'id_ed25519',
    'id_ecdsa',
    'id_dsa',
    '.aws/credentials',
    '.docker/config.json',
  ]

  const fileName = path.basename(filePath)
  const normalizedPath = filePath.replace(/^~\//, '')

  return secretFileNames.some(secretFile =>
    fileName === secretFile || normalizedPath.endsWith(secretFile)
  )
}

/**
 * Get recommended action for a file with secrets
 */
export function getRecommendedAction(scanResult: ScanResult): {
  action: 'exclude' | 'review' | 'safe'
  reason: string
  severity: 'critical' | 'high' | 'medium' | 'low'
} {
  if (!scanResult.scanned) {
    return {
      action: 'review',
      reason: 'Could not scan file',
      severity: 'medium',
    }
  }

  if (!scanResult.containsSecrets) {
    return {
      action: 'safe',
      reason: 'No secrets detected',
      severity: 'low',
    }
  }

  // Check for critical secrets
  const hasCritical = scanResult.matches.some(m => m.severity === 'critical')
  const hasHigh = scanResult.matches.some(m => m.severity === 'high')

  if (hasCritical) {
    return {
      action: 'exclude',
      reason: `Contains critical secrets (${scanResult.matches.filter(m => m.severity === 'critical').length} matches)`,
      severity: 'critical',
    }
  }

  if (hasHigh || scanResult.matches.length >= 3) {
    return {
      action: 'exclude',
      reason: `Contains ${scanResult.matches.length} potential secret(s)`,
      severity: 'high',
    }
  }

  return {
    action: 'review',
    reason: `Contains ${scanResult.matches.length} potential secret(s) - review manually`,
    severity: 'medium',
  }
}
