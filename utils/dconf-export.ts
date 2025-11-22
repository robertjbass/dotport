/**
 * Dconf Export - exports GNOME desktop settings for backup/restore
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

export async function isDconfAvailable(): Promise<boolean> {
  try {
    await execAsync('which dconf')
    return true
  } catch {
    return false
  }
}

async function exportDconfPath(
  dconfPath: string,
  outputFile: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const outputDir = path.dirname(outputFile)
    await fs.promises.mkdir(outputDir, { recursive: true })

    const { stdout, stderr } = await execAsync(`dconf dump "${dconfPath}"`)

    if (stderr && !stderr.includes('warning')) {
      return { success: false, error: stderr }
    }

    await fs.promises.writeFile(outputFile, stdout, 'utf-8')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

const DCONF_PATHS = [
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

export async function exportGnomeSettings(
  outputDir: string,
  options: { verbose?: boolean } = {},
): Promise<DconfExportResult> {
  const { verbose = true } = options

  if (verbose) {
    console.log(chalk.cyan('\n⚙️  Exporting GNOME settings from dconf...\n'))
  }

  const hasDconf = await isDconfAvailable()
  if (!hasDconf) {
    if (verbose) {
      console.log(
        chalk.yellow('⚠️  dconf not found - skipping GNOME settings export'),
      )
    }
    return { success: true, exportedPaths: [], errors: [] }
  }

  const exportedPaths: string[] = []
  const errors: Array<{ path: string; error: string }> = []

  for (const { path: dconfPath, file, description } of DCONF_PATHS) {
    const outputFile = path.join(outputDir, file)

    if (verbose) {
      console.log(chalk.gray(`   Exporting: ${description}`))
    }

    const result = await exportDconfPath(dconfPath, outputFile)

    if (result.success) {
      exportedPaths.push(outputFile)
      if (verbose) console.log(chalk.green(`   ✓ ${file}`))
    } else {
      errors.push({ path: dconfPath, error: result.error || 'Unknown error' })
      if (verbose) console.log(chalk.yellow(`   ⚠ ${file}: ${result.error}`))
    }
  }

  if (verbose) {
    console.log(
      chalk.green(`\n✅ Exported ${exportedPaths.length} GNOME settings files\n`),
    )
  }

  return { success: errors.length === 0, exportedPaths, errors }
}

export async function importDconfSettings(
  dconfPath: string,
  inputFile: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await fs.promises.access(inputFile)

    const { stderr } = await execAsync(
      `dconf load "${dconfPath}" < "${inputFile}"`,
    )

    if (stderr && !stderr.includes('warning')) {
      return { success: false, error: stderr }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function importGnomeSettings(
  inputDir: string,
  options: { verbose?: boolean } = {},
): Promise<DconfExportResult> {
  const { verbose = true } = options

  if (verbose) {
    console.log(chalk.cyan('\n⚙️  Importing GNOME settings to dconf...\n'))
  }

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

  for (const { path: dconfPath, file, description } of DCONF_PATHS) {
    const inputFile = path.join(inputDir, file)

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
      if (verbose) console.log(chalk.green(`   ✓ ${file}`))
    } else {
      errors.push({ path: dconfPath, error: result.error || 'Unknown error' })
      if (verbose) console.log(chalk.yellow(`   ⚠ ${file}: ${result.error}`))
    }
  }

  if (verbose) {
    console.log(
      chalk.green(`\n✅ Imported ${exportedPaths.length} GNOME settings\n`),
    )
  }

  return { success: errors.length === 0, exportedPaths, errors }
}
