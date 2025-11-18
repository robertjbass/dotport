/**
 * Dconf Export Utility
 *
 * Exports GNOME desktop settings (including keybindings) from dconf database
 * to portable configuration files that can be backed up and restored.
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

const execAsync = promisify(exec)

export type DconfExportResult = {
  success: boolean
  exportedPaths: string[]
  errors: Array<{ path: string; error: string }>
}

/**
 * Check if dconf is available on the system
 */
export async function isDconfAvailable(): Promise<boolean> {
  try {
    await execAsync('which dconf')
    return true
  } catch {
    return false
  }
}

/**
 * Export dconf settings for a specific path
 *
 * @param dconfPath - The dconf path to export (e.g., '/org/gnome/desktop/wm/keybindings/')
 * @param outputFile - Where to save the exported settings
 */
async function exportDconfPath(
  dconfPath: string,
  outputFile: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputFile)
    await fs.promises.mkdir(outputDir, { recursive: true })

    // Export the dconf path
    const { stdout, stderr } = await execAsync(`dconf dump "${dconfPath}"`)

    if (stderr && !stderr.includes('warning')) {
      return {
        success: false,
        error: stderr,
      }
    }

    // Write to file
    await fs.promises.writeFile(outputFile, stdout, 'utf-8')

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Export all important GNOME settings to configuration files
 *
 * Exports:
 * - Custom keybindings (Alt+Space for ulauncher, etc.)
 * - Built-in GNOME keybindings
 * - Desktop interface settings
 * - Window manager settings
 *
 * @param outputDir - Directory to save exported dconf files
 * @param options - Export options
 */
export async function exportGnomeSettings(
  outputDir: string,
  options: { verbose?: boolean } = {},
): Promise<DconfExportResult> {
  const { verbose = true } = options

  if (verbose) {
    console.log(chalk.cyan('\n⚙️  Exporting GNOME settings from dconf...\n'))
  }

  // Check if dconf is available
  const hasDconf = await isDconfAvailable()
  if (!hasDconf) {
    if (verbose) {
      console.log(
        chalk.yellow('⚠️  dconf not found - skipping GNOME settings export'),
      )
    }
    return {
      success: true,
      exportedPaths: [],
      errors: [],
    }
  }

  const exportedPaths: string[] = []
  const errors: Array<{ path: string; error: string }> = []

  // Define important dconf paths to export
  const dconfExports = [
    {
      path: '/org/gnome/settings-daemon/plugins/media-keys/',
      file: 'gnome-keybindings.conf',
      description: 'Custom keybindings (Alt+Space, etc.)',
    },
    {
      path: '/org/gnome/desktop/wm/keybindings/',
      file: 'gnome-wm-keybindings.conf',
      description: 'Window manager keybindings',
    },
    {
      path: '/org/gnome/shell/keybindings/',
      file: 'gnome-shell-keybindings.conf',
      description: 'GNOME Shell keybindings',
    },
    {
      path: '/org/gnome/desktop/interface/',
      file: 'gnome-interface.conf',
      description: 'Desktop interface settings',
    },
  ]

  // Export each dconf path
  for (const { path: dconfPath, file, description } of dconfExports) {
    const outputFile = path.join(outputDir, file)

    if (verbose) {
      console.log(chalk.gray(`   Exporting: ${description}`))
    }

    const result = await exportDconfPath(dconfPath, outputFile)

    if (result.success) {
      exportedPaths.push(outputFile)
      if (verbose) {
        console.log(chalk.green(`   ✓ ${file}`))
      }
    } else {
      errors.push({ path: dconfPath, error: result.error || 'Unknown error' })
      if (verbose) {
        console.log(chalk.yellow(`   ⚠ ${file}: ${result.error}`))
      }
    }
  }

  if (verbose) {
    console.log(
      chalk.green(
        `\n✅ Exported ${exportedPaths.length} GNOME settings files\n`,
      ),
    )
  }

  return {
    success: errors.length === 0,
    exportedPaths,
    errors,
  }
}

/**
 * Import dconf settings from a file
 *
 * @param dconfPath - The dconf path to import to
 * @param inputFile - File containing exported dconf settings
 */
export async function importDconfSettings(
  dconfPath: string,
  inputFile: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if file exists
    await fs.promises.access(inputFile)

    // Import the dconf settings
    const { stderr } = await execAsync(
      `dconf load "${dconfPath}" < "${inputFile}"`,
    )

    if (stderr && !stderr.includes('warning')) {
      return {
        success: false,
        error: stderr,
      }
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Import all GNOME settings from a directory
 *
 * @param inputDir - Directory containing exported dconf files
 * @param options - Import options
 */
export async function importGnomeSettings(
  inputDir: string,
  options: { verbose?: boolean } = {},
): Promise<DconfExportResult> {
  const { verbose = true } = options

  if (verbose) {
    console.log(chalk.cyan('\n⚙️  Importing GNOME settings to dconf...\n'))
  }

  // Check if dconf is available
  const hasDconf = await isDconfAvailable()
  if (!hasDconf) {
    if (verbose) {
      console.log(chalk.yellow('⚠️  dconf not found - skipping import'))
    }
    return {
      success: false,
      exportedPaths: [],
      errors: [{ path: '', error: 'dconf not available' }],
    }
  }

  const exportedPaths: string[] = []
  const errors: Array<{ path: string; error: string }> = []

  // Define dconf paths to import (matches export paths)
  const dconfImports = [
    {
      path: '/org/gnome/settings-daemon/plugins/media-keys/',
      file: 'gnome-keybindings.conf',
      description: 'Custom keybindings',
    },
    {
      path: '/org/gnome/desktop/wm/keybindings/',
      file: 'gnome-wm-keybindings.conf',
      description: 'Window manager keybindings',
    },
    {
      path: '/org/gnome/shell/keybindings/',
      file: 'gnome-shell-keybindings.conf',
      description: 'GNOME Shell keybindings',
    },
    {
      path: '/org/gnome/desktop/interface/',
      file: 'gnome-interface.conf',
      description: 'Desktop interface settings',
    },
  ]

  // Import each dconf file
  for (const { path: dconfPath, file, description } of dconfImports) {
    const inputFile = path.join(inputDir, file)

    // Check if file exists
    try {
      await fs.promises.access(inputFile)
    } catch {
      if (verbose) {
        console.log(chalk.gray(`   Skipping: ${description} (file not found)`))
      }
      continue
    }

    if (verbose) {
      console.log(chalk.gray(`   Importing: ${description}`))
    }

    const result = await importDconfSettings(dconfPath, inputFile)

    if (result.success) {
      exportedPaths.push(inputFile)
      if (verbose) {
        console.log(chalk.green(`   ✓ ${file}`))
      }
    } else {
      errors.push({ path: dconfPath, error: result.error || 'Unknown error' })
      if (verbose) {
        console.log(chalk.yellow(`   ⚠ ${file}: ${result.error}`))
      }
    }
  }

  if (verbose) {
    console.log(
      chalk.green(`\n✅ Imported ${exportedPaths.length} GNOME settings\n`),
    )
  }

  return {
    success: errors.length === 0,
    exportedPaths,
    errors,
  }
}
