/**
 * Linux Detection - detects display server and desktop environment
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export function detectDisplayServer(): 'x11' | 'wayland' | 'unknown' {
  const sessionType = process.env.XDG_SESSION_TYPE?.toLowerCase()

  if (sessionType === 'wayland') return 'wayland'
  if (sessionType === 'x11') return 'x11'
  if (process.env.WAYLAND_DISPLAY) return 'wayland'
  if (process.env.DISPLAY) return 'x11'

  return 'unknown'
}

export function detectDesktopEnvironment(): string | undefined {
  let desktop = process.env.XDG_CURRENT_DESKTOP?.toLowerCase()

  if (desktop) {
    // Handle composite values like "ubuntu:GNOME"
    if (desktop.includes(':')) {
      const parts = desktop.split(':')
      desktop = parts[parts.length - 1].toLowerCase()
    }
    return desktop
  }

  const desktopSession = process.env.DESKTOP_SESSION?.toLowerCase()
  if (desktopSession) return desktopSession

  return undefined
}

export function getLinuxSystemMetadata(): {
  displayServer: 'x11' | 'wayland' | 'unknown'
  desktopEnvironment?: string
} {
  return {
    displayServer: detectDisplayServer(),
    desktopEnvironment: detectDesktopEnvironment(),
  }
}

export async function detectLinuxDistro(): Promise<string> {
  try {
    const { stdout } = await execAsync('cat /etc/os-release')

    const idMatch = stdout.match(/^ID=(.+)$/m)
    if (idMatch) {
      return idMatch[1].replace(/"/g, '').toLowerCase()
    }
  } catch {
    try {
      const { stdout } = await execAsync('lsb_release -is')
      return stdout.trim().toLowerCase()
    } catch {
      // lsb_release not available
    }
  }

  return 'linux'
}
