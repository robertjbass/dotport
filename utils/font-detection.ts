/**
 * Font Detection Utility
 *
 * Detects installed fonts on macOS and Linux systems
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'
import type {
  FontLocation,
  FontInfo,
  FontLocationType,
  OperatingSystem,
  MachineFontsConfig,
} from '../types/backup-config'
import { expandTilde } from './path-helpers'

const execAsync = promisify(exec)

/**
 * Get font directory paths based on OS
 */
function getFontDirectories(os: OperatingSystem): {
  user: string
  system?: string
  local?: string
} {
  if (os === 'macos') {
    return {
      user: expandTilde('~/Library/Fonts'),
      system: '/Library/Fonts',
      // /System/Library/Fonts is intentionally excluded (system built-in fonts)
    }
  } else if (os === 'linux') {
    return {
      user: expandTilde('~/.local/share/fonts'),
      system: '/usr/share/fonts',
      local: '/usr/local/share/fonts',
    }
  }

  return { user: '' }
}

/**
 * Check if a directory exists
 */
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath)
    return stats.isDirectory()
  } catch {
    return false
  }
}

/**
 * Get font format from file extension
 */
function getFontFormat(filename: string): string {
  const ext = path.extname(filename).toLowerCase().slice(1)
  const formatMap: Record<string, string> = {
    ttf: 'TrueType',
    otf: 'OpenType',
    woff: 'WOFF',
    woff2: 'WOFF2',
    eot: 'EOT',
    dfont: 'DFont',
    ttc: 'TrueType Collection',
  }
  return formatMap[ext] || ext.toUpperCase()
}

/**
 * Parse font family and style from filename
 * Examples:
 *   Roboto-Regular.ttf -> { family: 'Roboto', style: 'Regular' }
 *   FiraCode-Bold.otf -> { family: 'FiraCode', style: 'Bold' }
 *   SourceCodePro-SemiboldIt.ttf -> { family: 'SourceCodePro', style: 'SemiboldIt' }
 */
function parseFontName(filename: string): { family: string; style: string } {
  const nameWithoutExt = path.basename(filename, path.extname(filename))

  // Try to split on common separators: hyphen, underscore, space
  const separators = ['-', '_', ' ']
  for (const sep of separators) {
    if (nameWithoutExt.includes(sep)) {
      const parts = nameWithoutExt.split(sep)
      const family = parts[0]
      const style = parts.slice(1).join(sep) || 'Regular'
      return { family, style }
    }
  }

  // If no separator found, assume the whole name is the family
  return { family: nameWithoutExt, style: 'Regular' }
}

/**
 * Recursively scan a directory for font files
 */
async function scanFontDirectory(dirPath: string): Promise<FontInfo[]> {
  const fonts: FontInfo[] = []
  const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2', '.eot', '.dfont', '.ttc']

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subFonts = await scanFontDirectory(fullPath)
        fonts.push(...subFonts)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (fontExtensions.includes(ext)) {
          try {
            const stats = await fs.stat(fullPath)
            const { family, style } = parseFontName(entry.name)

            fonts.push({
              name: entry.name,
              family,
              style,
              format: getFontFormat(entry.name),
              path: fullPath,
              size: stats.size,
              installedAt: stats.birthtime.toISOString(),
            })
          } catch (error) {
            // Skip files that can't be read
            continue
          }
        }
      }
    }
  } catch (error) {
    // Directory not accessible, return empty array
    return []
  }

  return fonts
}

/**
 * Detect font locations and their installed fonts
 */
export async function detectFontLocations(
  os: OperatingSystem,
): Promise<FontLocation[]> {
  const directories = getFontDirectories(os)
  const locations: FontLocation[] = []

  // Check user fonts directory
  if (directories.user && (await directoryExists(directories.user))) {
    const fonts = await scanFontDirectory(directories.user)
    locations.push({
      type: 'user',
      path: directories.user,
      enabled: true,
      fonts,
    })
  }

  // Check system fonts directory (optional)
  if (directories.system && (await directoryExists(directories.system))) {
    const fonts = await scanFontDirectory(directories.system)
    locations.push({
      type: 'system',
      path: directories.system,
      enabled: false, // Disabled by default to avoid large backups
      fonts,
    })
  }

  // Check local fonts directory (Linux only)
  if (directories.local && (await directoryExists(directories.local))) {
    const fonts = await scanFontDirectory(directories.local)
    locations.push({
      type: 'local',
      path: directories.local,
      enabled: true,
      fonts,
    })
  }

  return locations
}

/**
 * Create fonts configuration for a machine
 */
export async function createFontsConfig(
  os: OperatingSystem,
  machineId: string,
): Promise<MachineFontsConfig> {
  const locations = await detectFontLocations(os)
  const hasFonts = locations.some((loc) => loc.fonts.length > 0)

  return {
    enabled: hasFonts,
    locations,
    exportPath: hasFonts ? `.config/fonts.json` : undefined,
  }
}

/**
 * Get total font count across all locations
 */
export function getTotalFontCount(config: MachineFontsConfig): number {
  return config.locations.reduce((total, loc) => total + loc.fonts.length, 0)
}

/**
 * Get font count by location type
 */
export function getFontCountByLocation(
  config: MachineFontsConfig,
  locationType: FontLocationType,
): number {
  const location = config.locations.find((loc) => loc.type === locationType)
  return location ? location.fonts.length : 0
}

/**
 * Filter enabled font locations
 */
export function getEnabledFontLocations(
  config: MachineFontsConfig,
): FontLocation[] {
  return config.locations.filter((loc) => loc.enabled)
}

/**
 * Export font configuration to JSON file
 */
export async function exportFontsToFile(
  config: MachineFontsConfig,
  repoPath: string,
): Promise<void> {
  if (!config.exportPath) return

  const exportPath = path.join(repoPath, config.exportPath)
  const exportDir = path.dirname(exportPath)

  // Ensure directory exists
  await fs.mkdir(exportDir, { recursive: true })

  // Create simplified export data
  const exportData = {
    enabled: config.enabled,
    locations: config.locations.map((loc) => ({
      type: loc.type,
      path: loc.path,
      enabled: loc.enabled,
      fontCount: loc.fonts.length,
      fonts: loc.fonts.map((font) => ({
        name: font.name,
        family: font.family,
        style: font.style,
        format: font.format,
      })),
    })),
  }

  await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2), 'utf-8')
}

/**
 * Refresh font cache (Linux only)
 */
export async function refreshFontCache(): Promise<void> {
  try {
    // fc-cache is the standard tool on Linux to refresh font cache
    await execAsync('fc-cache -f -v')
  } catch (error) {
    // Silently fail if fc-cache is not available
  }
}

/**
 * Backup font files to repository
 */
export async function backupFontsToRepo(
  config: MachineFontsConfig,
  repoPath: string,
  machineId: string,
): Promise<{ success: boolean; count: number; errors: string[] }> {
  const errors: string[] = []
  let count = 0

  try {
    // Get enabled font locations
    const enabledLocations = getEnabledFontLocations(config)

    for (const location of enabledLocations) {
      if (location.fonts.length === 0) continue

      // Create directory for this location type in the repo
      const fontBackupDir = path.join(
        repoPath,
        machineId,
        '.fonts',
        location.type,
      )

      // Ensure directory exists
      await fs.mkdir(fontBackupDir, { recursive: true })

      // Copy each font file
      for (const font of location.fonts) {
        try {
          // Get relative path from the location base path
          const relativePath = path.relative(location.path, font.path)
          const destPath = path.join(fontBackupDir, relativePath)

          // Ensure parent directory exists
          await fs.mkdir(path.dirname(destPath), { recursive: true })

          // Copy the font file
          await fs.copyFile(font.path, destPath)
          count++
        } catch (error: any) {
          errors.push(`Failed to backup ${font.name}: ${error.message}`)
        }
      }
    }

    return { success: errors.length === 0, count, errors }
  } catch (error: any) {
    errors.push(`Font backup failed: ${error.message}`)
    return { success: false, count, errors }
  }
}
