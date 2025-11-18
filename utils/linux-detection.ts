/**
 * Linux System Detection Utility
 *
 * Detects Linux-specific system information like display server (X11/Wayland)
 * and desktop environment (GNOME, KDE, etc.)
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Detect the display server being used (X11, Wayland, or unknown)
 *
 * @returns Display server type
 */
export function detectDisplayServer(): 'x11' | 'wayland' | 'unknown' {
  // Check XDG_SESSION_TYPE environment variable
  const sessionType = process.env.XDG_SESSION_TYPE?.toLowerCase()

  if (sessionType === 'wayland') return 'wayland'
  if (sessionType === 'x11') return 'x11'

  // Fallback: Check if WAYLAND_DISPLAY is set
  if (process.env.WAYLAND_DISPLAY) return 'wayland'

  // Fallback: Check if DISPLAY is set (X11)
  if (process.env.DISPLAY) return 'x11'

  return 'unknown'
}

/**
 * Detect the desktop environment being used
 *
 * @returns Desktop environment name (lowercase) or undefined
 */
export function detectDesktopEnvironment(): string | undefined {
  // Check XDG_CURRENT_DESKTOP environment variable
  let desktop = process.env.XDG_CURRENT_DESKTOP?.toLowerCase()

  if (desktop) {
    // Handle composite values like "ubuntu:GNOME"
    if (desktop.includes(':')) {
      const parts = desktop.split(':')
      desktop = parts[parts.length - 1].toLowerCase()
    }

    return desktop
  }

  // Fallback: Check DESKTOP_SESSION
  const desktopSession = process.env.DESKTOP_SESSION?.toLowerCase()
  if (desktopSession) {
    return desktopSession
  }

  // Fallback: Try to detect from running processes
  // This is less reliable but can work as a last resort
  return undefined
}

/**
 * Get comprehensive Linux system metadata
 *
 * @returns Object with display server and desktop environment info
 */
export function getLinuxSystemMetadata(): {
  displayServer: 'x11' | 'wayland' | 'unknown'
  desktopEnvironment?: string
} {
  return {
    displayServer: detectDisplayServer(),
    desktopEnvironment: detectDesktopEnvironment(),
  }
}

/**
 * Detect Linux distribution name
 *
 * @returns Distribution name (e.g., 'debian', 'ubuntu', 'fedora') or 'linux'
 */
export async function detectLinuxDistro(): Promise<string> {
  try {
    // Try reading /etc/os-release
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)

    const { stdout } = await execAsync('cat /etc/os-release')

    // Parse ID field from os-release
    const idMatch = stdout.match(/^ID=(.+)$/m)
    if (idMatch) {
      const distro = idMatch[1].replace(/"/g, '').toLowerCase()
      return distro
    }
  } catch (error) {
    // Fallback: try lsb_release
    try {
      const { stdout } = await execAsync('lsb_release -is')
      return stdout.trim().toLowerCase()
    } catch {
      // If all else fails, return generic 'linux'
    }
  }

  return 'linux'
}
