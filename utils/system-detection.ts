/**
 * System Detection - OS, distro, shell, and runtime detection
 */

import fs from 'fs'
import { execSync } from 'child_process'
import ScriptSession from '../clients/script-session'
import type { OperatingSystem, Shell } from '../types/backup-config'
import type { RuntimeData } from '../types/user-system-config'
import {
  detectDisplayServer,
  detectDesktopEnvironment,
} from './linux-detection'
import { DISTRO_DISPLAY_NAMES } from '../constants/operating-systems'

export type DetectedSystemInfo = {
  os: OperatingSystem
  distro: string
  shell: Shell
  shellPath: string
  homeDirectory: string
  username: string
  runtimeData: RuntimeData
  displayServer?: 'x11' | 'wayland' | 'unknown'
  desktopEnvironment?: string
}

export function detectOS(): OperatingSystem {
  switch (ScriptSession.operatingSystem) {
    case 'darwin':
      return 'macos'
    case 'linux':
      return 'linux'
    case 'win32':
      return 'windows'
    default:
      return 'linux'
  }
}

export function detectLinuxDistro(): string {
  if (detectOS() !== 'linux') return 'unknown'

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

    // Check distro-specific files
    if (fs.existsSync('/etc/arch-release')) return 'arch'
    if (fs.existsSync('/etc/debian_version')) return 'debian'
    if (fs.existsSync('/etc/fedora-release')) return 'fedora'
    if (fs.existsSync('/etc/redhat-release')) return 'rhel'

    return 'unknown'
  } catch {
    return 'unknown'
  }
}

export function detectDistro(): string {
  const os = detectOS()
  if (os === 'macos') return 'darwin'
  if (os === 'linux') return detectLinuxDistro()
  return 'unknown'
}

export function detectShell(): Shell {
  const shellPath = ScriptSession.shell || process.env.SHELL || '/bin/bash'
  const shellName = shellPath.split('/').pop() || 'bash'

  if (shellName.includes('zsh')) return 'zsh'
  if (shellName.includes('bash')) return 'bash'
  if (shellName.includes('fish')) return 'fish'
  return 'other'
}

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

export function detectRuntimeData(): RuntimeData {
  return {
    node: {
      packageManager: ScriptSession.packageManager || 'npm',
      versionManager: ScriptSession.nodeVersionManager || 'none',
      version: ScriptSession.runtimeVersion || 'unknown',
    },
  }
}

export function detectAllSystemInfo(): DetectedSystemInfo {
  const os = detectOS()
  const distro = detectDistro()
  const shell = detectShell()
  const shellPath = ScriptSession.shell || process.env.SHELL || '/bin/bash'
  const homeDirectory = ScriptSession.homeDirectory || process.env.HOME || '~'
  const username = ScriptSession.username || process.env.USER || 'user'
  const runtimeData = detectRuntimeData()

  let displayServer: 'x11' | 'wayland' | 'unknown' | undefined
  let desktopEnvironment: string | undefined

  if (os === 'linux') {
    displayServer = detectDisplayServer()
    desktopEnvironment = detectDesktopEnvironment()
  }

  return {
    os,
    distro,
    shell,
    shellPath,
    homeDirectory,
    username,
    runtimeData,
    displayServer,
    desktopEnvironment,
  }
}

// Machine ID format: <os>-<distro>-<nickname>
export function generateMachineId(
  os: OperatingSystem,
  distro: string,
  nickname: string,
): string {
  return `${os}-${distro}-${nickname}`
}

export function generateDefaultNickname(os: OperatingSystem): string {
  return `my-${os}-environment`
}

// Converts to lowercase, replaces spaces with dashes, removes invalid characters
export function normalizeNickname(nickname: string): string {
  return nickname
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.-]/g, '')
}

export function validateNickname(nickname: string): boolean {
  if (!nickname || nickname.trim().length === 0) return false
  return /^[a-z0-9.-]+$/.test(nickname)
}

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

export function getDistroDisplayName(distro: string): string {
  return DISTRO_DISPLAY_NAMES[distro.toLowerCase()] || distro
}
