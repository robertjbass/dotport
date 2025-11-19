import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

export type NodeVersionManager =
  | 'nvm'
  | 'fnm'
  | 'volta'
  | 'asdf'
  | 'nodenv'
  | 'nvm-windows'
  | 'system'
  | 'unknown'

export type Runtime = 'bun' | 'deno' | 'node' | 'unknown'
export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'unknown'

export function detectRuntime(): Runtime {
  if (typeof Bun !== 'undefined') return 'bun'
  if (typeof Deno !== 'undefined') return 'deno'
  if (process?.release?.name === 'node') return 'node'
  return 'unknown'
}

export function detectPackageManager(): PackageManager {
  const ua = process.env.npm_config_user_agent || ''
  if (ua.includes('pnpm')) return 'pnpm'
  if (ua.includes('npm')) return 'npm'
  if (ua.includes('yarn')) return 'yarn'
  return 'unknown'
}

export function detectRuntimeVersion(): string | null {
  const runtime = detectRuntime()

  try {
    switch (runtime) {
      case 'node':
        // Use process.version for Node.js (most reliable)
        return process.version.replace(/^v/, '')

      case 'bun':
        // Try Bun.version first (available in Bun runtime)
        if (typeof Bun !== 'undefined' && (Bun as any).version) {
          return (Bun as any).version
        }
        // Fallback to command
        try {
          const version = execSync('bun --version', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
          }).trim()
          return version
        } catch {
          return null
        }

      case 'deno':
        // Try Deno.version first (available in Deno runtime)
        if (typeof Deno !== 'undefined' && (Deno as any).version) {
          return (Deno as any).version.deno
        }
        // Fallback to command
        try {
          const output = execSync('deno --version', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
          })
          // Parse "deno 1.x.x" from first line
          const match = output.match(/deno (\d+\.\d+\.\d+)/)
          return match ? match[1] : null
        } catch {
          return null
        }

      case 'unknown':
      default:
        return null
    }
  } catch (error) {
    return null
  }
}

export function detectNodeVersionManager(): NodeVersionManager {
  const env = process.env
  const detectedManagers: NodeVersionManager[] = []

  // Check environment variables (most reliable)
  if (env.NVM_DIR) detectedManagers.push('nvm')
  if (env.FNM_DIR || env.FNM_VERSION_FILE) detectedManagers.push('fnm')
  if (env.VOLTA_HOME) detectedManagers.push('volta')
  if (env.ASDF_DIR || env.ASDF_DATA_DIR) detectedManagers.push('asdf')
  if (env.NODENV_ROOT) detectedManagers.push('nodenv')
  if (env.NVM_SYMLINK) detectedManagers.push('nvm-windows')

  // If we found env vars, return the first one (priority order)
  if (detectedManagers.length > 0) return detectedManagers[0]

  // Fallback: check where node is installed
  if (!process.execPath) return 'unknown'

  try {
    const realNodePath = fs.realpathSync(process.execPath)

    // Check for version managers in path
    if (realNodePath.includes('.nvm')) return 'nvm'
    if (realNodePath.includes('.fnm')) return 'fnm'
    if (realNodePath.includes(path.join('.asdf', 'installs', 'nodejs')))
      return 'asdf'
    if (realNodePath.includes(path.join('.nodenv', 'versions'))) return 'nodenv'
    if (realNodePath.toLowerCase().includes('volta')) return 'volta'

    // Check for Homebrew installation (macOS/Linux)
    if (
      realNodePath.includes('/homebrew/') ||
      realNodePath.includes('/Homebrew/') ||
      realNodePath.includes('/opt/homebrew/') ||
      realNodePath.includes('/usr/local/Cellar/')
    ) {
      return 'system'
    }

    // Check for common system paths
    if (
      realNodePath.startsWith('/usr/bin/') ||
      realNodePath.startsWith('/usr/local/bin/') ||
      realNodePath.startsWith('/bin/')
    ) {
      return 'system'
    }
  } catch (error) {
    // If we can't resolve the symlink, check PATH as last resort
    try {
      const pathEnv = env.PATH || ''
      if (pathEnv.includes('.nvm')) return 'nvm'
      if (pathEnv.includes('.fnm')) return 'fnm'
      if (pathEnv.includes('.volta')) return 'volta'
      if (pathEnv.includes('.asdf')) return 'asdf'
      if (pathEnv.includes('.nodenv')) return 'nodenv'
    } catch {
      // If all else fails, return unknown
      return 'unknown'
    }
  }

  // Default to system if nothing else matched
  return 'system'
}
