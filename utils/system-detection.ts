/**
 * System Detection Utility
 *
 * Consolidates all system detection logic including OS, distro, shell,
 * runtime, package manager, and version manager detection.
 */

import fs from 'fs'
import { execSync } from 'child_process'
import ScriptSession from '../clients/script-session'
import type { OperatingSystem, Shell } from '../types/backup-config'
import type { RuntimeData } from '../types/user-system-config'

export type DetectedSystemInfo = {
  os: OperatingSystem
  distro: string
  shell: Shell
  shellPath: string
  homeDirectory: string
  username: string
  runtimeData: RuntimeData
}

/**
 * Detect operating system
 */
export function detectOS(): OperatingSystem {
  const platform = ScriptSession.operatingSystem

  if (platform === 'darwin') return 'macos'
  if (platform === 'linux') return 'linux'
  if (platform === 'win32') return 'windows'

  return 'linux' // fallback
}

/**
 * Detect Linux distribution
 * Returns the distribution name (ubuntu, arch, debian, etc.)
 */
export function detectLinuxDistro(): string {
  const os = detectOS()

  if (os !== 'linux') {
    return 'unknown'
  }

  try {
    // Try /etc/os-release first (most modern distros)
    if (fs.existsSync('/etc/os-release')) {
      const content = fs.readFileSync('/etc/os-release', 'utf-8')
      const idMatch = content.match(/^ID=(.+)$/m)

      if (idMatch) {
        return idMatch[1].replace(/"/g, '').toLowerCase()
      }
    }

    // Try lsb_release command
    const lsbRelease = execSync('lsb_release -is 2>/dev/null || echo unknown', {
      encoding: 'utf-8',
    }).trim()

    if (lsbRelease && lsbRelease !== 'unknown') {
      return lsbRelease.toLowerCase()
    }

    // Check specific files
    if (fs.existsSync('/etc/arch-release')) return 'arch'
    if (fs.existsSync('/etc/debian_version')) return 'debian'
    if (fs.existsSync('/etc/fedora-release')) return 'fedora'
    if (fs.existsSync('/etc/redhat-release')) return 'rhel'

    return 'unknown'
  } catch (error) {
    return 'unknown'
  }
}

/**
 * Detect distribution
 * Returns 'darwin' for macOS, or the actual distro name for Linux
 */
export function detectDistro(): string {
  const os = detectOS()

  if (os === 'macos') {
    return 'darwin'
  }

  if (os === 'linux') {
    return detectLinuxDistro()
  }

  return 'unknown'
}

/**
 * Detect default shell
 */
export function detectShell(): Shell {
  const shellPath = ScriptSession.shell || process.env.SHELL || '/bin/bash'

  // Extract shell name from path
  const shellName = shellPath.split('/').pop() || 'bash'

  // Map to Shell type
  if (shellName.includes('zsh')) return 'zsh'
  if (shellName.includes('bash')) return 'bash'
  if (shellName.includes('fish')) return 'fish'

  return 'other'
}

/**
 * Get shell config file based on detected shell
 */
export function getShellConfigFile(shell: Shell): string {
  switch (shell) {
    case 'zsh':
      return '.zshrc'
    case 'bash':
      return '.bashrc'
    case 'fish':
      return '.config/fish/config.fish'
    default:
      return '.bashrc'
  }
}

/**
 * Detect runtime data (Node.js info)
 */
export function detectRuntimeData(): RuntimeData {
  return {
    node: {
      packageManager: ScriptSession.packageManager || 'npm',
      versionManager: ScriptSession.nodeVersionManager || 'none',
      version: ScriptSession.runtimeVersion || 'unknown',
    },
  }
}

/**
 * Detect all system information
 * This is the main function that consolidates all detection
 */
export function detectAllSystemInfo(): DetectedSystemInfo {
  const os = detectOS()
  const distro = detectDistro()
  const shell = detectShell()
  const shellPath = ScriptSession.shell || process.env.SHELL || '/bin/bash'
  const homeDirectory = ScriptSession.homeDirectory || process.env.HOME || '~'
  const username = ScriptSession.username || process.env.USER || 'user'
  const runtimeData = detectRuntimeData()

  return {
    os,
    distro,
    shell,
    shellPath,
    homeDirectory,
    username,
    runtimeData,
  }
}

/**
 * Generate machine ID from system info
 * Format: <os>-<distro>-<nickname>
 */
export function generateMachineId(
  os: OperatingSystem,
  distro: string,
  nickname: string
): string {
  return `${os}-${distro}-${nickname}`
}

/**
 * Generate a default machine nickname
 * Format: my-<os>-environment
 */
export function generateDefaultNickname(os: OperatingSystem): string {
  return `my-${os}-environment`
}

/**
 * Validate machine nickname
 * Nicknames can only contain letters, numbers, dots, hyphens, and underscores
 */
export function validateNickname(nickname: string): boolean {
  if (!nickname || nickname.trim().length === 0) {
    return false
  }

  // Check for valid characters only
  return /^[a-zA-Z0-9._-]+$/.test(nickname)
}

/**
 * Get a friendly display name for the OS
 */
export function getOSDisplayName(os: OperatingSystem): string {
  switch (os) {
    case 'macos':
      return 'macOS'
    case 'linux':
      return 'Linux'
    case 'windows':
      return 'Windows'
    default:
      return 'Unknown'
  }
}

/**
 * Get a friendly display name for the distro
 */
export function getDistroDisplayName(distro: string): string {
  const distroMap: Record<string, string> = {
    darwin: 'Darwin',
    ubuntu: 'Ubuntu',
    debian: 'Debian',
    arch: 'Arch Linux',
    manjaro: 'Manjaro',
    fedora: 'Fedora',
    rhel: 'Red Hat Enterprise Linux',
    centos: 'CentOS',
    opensuse: 'openSUSE',
    unknown: 'Unknown',
  }

  return distroMap[distro.toLowerCase()] || distro
}
