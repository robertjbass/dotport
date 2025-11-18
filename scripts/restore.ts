#!/usr/bin/env node

import inquirer from 'inquirer'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import os from 'os'
import ScriptSession from '../clients/script-session'

// Type definitions
import type { BackupSchema, DotfileConfig } from '../types/backup-schema'

// Utilities
import {
  expandTilde,
  pathExists,
  ensureDirectory,
  isDirectory,
} from '../utils/path-helpers'
import {
  displayWelcome,
  displayStepProgress,
  displaySuccess,
  displayWarning,
  displayError,
  displayInfo,
  selectFromList,
  confirmAction,
  promptInput,
  BACK_OPTION,
} from '../utils/prompt-helpers'
import {
  backupFileBeforeOverwrite,
  getBackupSummary,
  listAllBackups,
  restoreBackupEntry,
  findBackupEntriesForFile,
  getBackupDirectory,
  cleanupOldBackups,
  type BackupEntry,
} from '../utils/restore-backup'

/**
 * Restore Script - Interactive restoration of backed up configuration
 *
 * This script guides users through restoring their backed-up configuration:
 * - Dotfiles and config files
 * - Package managers and packages
 * - Runtime versions
 * - Editor extensions
 * - System settings
 *
 * Supports two modes:
 * - Normal mode: Restores files to their actual locations
 * - Test mode (--test): Restores to ~/backup-test for safe testing
 */

type RestoreMode = 'normal' | 'test'

type RestoreAction =
  | 'copy-expected'
  | 'copy-custom'
  | 'symlink-expected'
  | 'symlink-custom'
  | 'skip'

type RestoreConfig = {
  mode: RestoreMode
  testRoot: string
  data: BackupSchema | null
  platform: 'darwin' | 'linux'
}

/**
 * Parse command line arguments to determine restore mode
 */
function parseRestoreMode(): RestoreMode {
  const args = process.argv.slice(2)
  return args.includes('--test') ? 'test' : 'normal'
}

/**
 * Get the restore root directory based on mode
 */
function getRestoreRoot(mode: RestoreMode): string {
  if (mode === 'test') {
    return expandTilde('~/backup-test')
  }
  return os.homedir()
}

/**
 * Load the backup data from data.json
 */
function loadBackupData(): BackupSchema | null {
  const dataPath = path.join(process.cwd(), 'data.json')

  if (!pathExists(dataPath)) {
    displayError(
      'Backup data not found',
      'Please run the setup script first to create data.json',
    )
    return null
  }

  try {
    const rawData = fs.readFileSync(dataPath, 'utf-8')
    const data = JSON.parse(rawData) as BackupSchema
    return data
  } catch (error) {
    displayError(
      'Failed to load backup data',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return null
  }
}

/**
 * Display restore mode banner
 */
function displayModeInfo(mode: RestoreMode, testRoot: string): void {
  if (mode === 'test') {
    displayWarning(
      'TEST MODE ENABLED',
      `All files will be restored to: ${testRoot}\nNo packages or runtimes will be installed.`,
    )
  } else {
    displayInfo(
      'Normal restore mode',
      'Files will be restored to their original locations.',
    )
  }
}

/**
 * Resolve the target path for a file based on mode
 */
function resolveTargetPath(
  sourcePath: string,
  restoreRoot: string,
  mode: RestoreMode,
): string {
  if (mode === 'test') {
    // In test mode, preserve the relative structure from home
    const homeDir = os.homedir()
    const expandedSource = expandTilde(sourcePath)
    const relativePath = expandedSource.replace(homeDir, '')
    return path.join(restoreRoot, relativePath)
  }

  // Normal mode: use the actual path
  return expandTilde(sourcePath)
}

/**
 * Prompt user for restore action for a single file
 */
async function promptFileRestoreAction(
  filename: string,
  expectedPath: string,
  backupPath: string,
  hasContent: boolean,
): Promise<{ action: RestoreAction; customPath?: string }> {
  if (!hasContent) {
    displayWarning(
      `Skipping ${filename}`,
      'No backed up content available for this file.',
    )
    return { action: 'skip' }
  }

  console.log(chalk.cyan(`\n┌${'─'.repeat(70)}┐`))
  console.log(chalk.cyan(`│ ${chalk.bold(filename)}${' '.repeat(70 - filename.length - 1)}│`))
  console.log(chalk.cyan(`├${'─'.repeat(70)}┤`))
  console.log(chalk.cyan(`│ ${chalk.gray('Expected path:')} ${expectedPath}${' '.repeat(Math.max(0, 70 - 16 - expectedPath.length - 1))}│`))
  console.log(chalk.cyan(`│ ${chalk.gray('Backup path:')}   ${backupPath}${' '.repeat(Math.max(0, 70 - 16 - backupPath.length - 1))}│`))
  console.log(chalk.cyan(`└${'─'.repeat(70)}┘\n`))

  const action = await selectFromList<RestoreAction>(
    `How would you like to restore ${chalk.bold(filename)}?`,
    [
      {
        name: `📋 Copy file to ${chalk.cyan(expectedPath)}`,
        value: 'copy-expected',
      },
      {
        name: '📝 Copy file to different path (enter manually)',
        value: 'copy-custom',
      },
      {
        name: `🔗 Create symlink at ${chalk.cyan(expectedPath)}`,
        value: 'symlink-expected',
      },
      {
        name: '🔗 Create symlink at different path (enter manually)',
        value: 'symlink-custom',
      },
      {
        name: '⏭️  Skip this file',
        value: 'skip',
      },
    ],
  )

  if (action === BACK_OPTION) {
    return { action: 'skip' }
  }

  if (action === 'copy-custom' || action === 'symlink-custom') {
    const customPath = await promptInput(
      'Enter the target path (supports ~ for home directory):',
      {
        defaultValue: expectedPath,
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Please enter a valid path'
          }
          return true
        },
      },
    )

    if (!customPath) {
      return { action: 'skip' }
    }

    return { action, customPath }
  }

  return { action }
}

/**
 * Copy or symlink a file to the target location
 */
function restoreFile(
  content: string,
  targetPath: string,
  action: RestoreAction,
  backupPath: string,
  mode: RestoreMode,
  testRoot: string,
): boolean {
  try {
    const absoluteTarget = expandTilde(targetPath)

    // Ensure parent directory exists
    const parentDir = path.dirname(absoluteTarget)
    ensureDirectory(parentDir)

    // Check if target already exists and back it up
    if (pathExists(absoluteTarget)) {
      // Use the comprehensive backup system
      const backupEntry = backupFileBeforeOverwrite(absoluteTarget)
      if (backupEntry) {
        displayInfo(
          'Existing file backed up safely',
          `Location: ${getBackupDirectory()}/${backupEntry.backupFilename}`,
        )
      } else {
        displayWarning(
          'Failed to backup existing file',
          'Continuing with restore operation...',
        )
      }
    }

    if (action === 'copy-expected' || action === 'copy-custom') {
      // Copy the file
      fs.writeFileSync(absoluteTarget, content, 'utf-8')
      displaySuccess(`Copied to: ${targetPath}`)
      return true
    } else if (action === 'symlink-expected' || action === 'symlink-custom') {
      // Create symlink
      // For symlink, we need the source to exist
      // In normal mode, the backup is in the repo
      // In test mode, we'll create a temp file with the content first

      let sourcePath: string

      if (mode === 'test') {
        // In test mode, create the source file in a .backup subdirectory
        const backupDir = path.join(testRoot, '.backup-files')
        ensureDirectory(backupDir)
        sourcePath = path.join(backupDir, path.basename(targetPath))
        fs.writeFileSync(sourcePath, content, 'utf-8')
      } else {
        // In normal mode, use the backup path from the repo
        // This assumes the backup repo is in the current directory or a known location
        // For now, we'll create a temp location
        const backupDir = expandTilde('~/.dev-machine-backup-files')
        ensureDirectory(backupDir)
        sourcePath = path.join(backupDir, path.basename(targetPath))
        fs.writeFileSync(sourcePath, content, 'utf-8')
      }

      // Remove existing file/symlink if present
      if (pathExists(absoluteTarget)) {
        fs.unlinkSync(absoluteTarget)
      }

      // Create symlink
      fs.symlinkSync(sourcePath, absoluteTarget)
      displaySuccess(`Symlinked: ${targetPath} → ${sourcePath}`)
      return true
    }

    return false
  } catch (error) {
    displayError(
      `Failed to restore file to ${targetPath}`,
      error instanceof Error ? error.message : 'Unknown error',
    )
    return false
  }
}

/**
 * Restore dotfiles from the backup
 */
async function restoreDotfiles(
  dotfiles: Record<string, DotfileConfig | undefined>,
  config: RestoreConfig,
): Promise<void> {
  const fileEntries = Object.entries(dotfiles)

  if (fileEntries.length === 0) {
    displayWarning('No dotfiles to restore', 'The backup contains no dotfiles.')
    return
  }

  displayInfo(
    `Found ${fileEntries.length} dotfile(s) to restore`,
    'You can choose how to restore each file.',
  )

  let restoredCount = 0
  let skippedCount = 0

  for (let i = 0; i < fileEntries.length; i++) {
    const [filename, dotfile] = fileEntries[i]

    if (!dotfile) {
      continue
    }

    displayStepProgress(i + 1, fileEntries.length, `Restoring ${filename}`)

    const expectedPath = resolveTargetPath(
      dotfile.path,
      config.testRoot,
      config.mode,
    )

    const { action, customPath } = await promptFileRestoreAction(
      filename,
      expectedPath,
      dotfile.backupPath,
      dotfile.content !== null,
    )

    if (action === 'skip') {
      skippedCount++
      displayInfo(`Skipped ${filename}`)
      continue
    }

    const targetPath = customPath || expectedPath
    const success = restoreFile(
      dotfile.content || '',
      targetPath,
      action,
      dotfile.backupPath,
      config.mode,
      config.testRoot,
    )

    if (success) {
      restoredCount++
    } else {
      skippedCount++
    }
  }

  console.log('\n')
  displaySuccess(
    'Dotfiles restoration complete',
    `Restored: ${restoredCount}, Skipped: ${skippedCount}`,
  )
}

/**
 * Restore packages (with test mode logging)
 */
async function restorePackages(
  packages: any,
  config: RestoreConfig,
): Promise<void> {
  console.log(chalk.cyan.bold('\n📦 Package Restoration\n'))

  if (config.mode === 'test') {
    displayWarning('Test Mode', 'Package installation is skipped in test mode.')
  }

  // Homebrew formulae
  if (packages.homebrew?.formulae?.length > 0) {
    const shouldInstall = await confirmAction(
      `Restore ${packages.homebrew.formulae.length} Homebrew formulae?`,
      true,
    )

    if (shouldInstall && shouldInstall !== BACK_OPTION) {
      if (config.mode === 'test') {
        displayInfo(
          'Test Mode - Not Installing Homebrew Formulae',
          `Would install: ${packages.homebrew.formulae.slice(0, 5).join(', ')}${packages.homebrew.formulae.length > 5 ? '...' : ''}`,
        )
      } else {
        displayInfo(
          'Installing Homebrew formulae',
          'This may take several minutes...',
        )
        // In normal mode, we would run: brew install <packages>
        displaySuccess('Homebrew formulae would be installed here')
      }
    }
  }

  // Homebrew casks
  if (packages.homebrew?.casks?.length > 0) {
    const shouldInstall = await confirmAction(
      `Restore ${packages.homebrew.casks.length} Homebrew casks?`,
      true,
    )

    if (shouldInstall && shouldInstall !== BACK_OPTION) {
      if (config.mode === 'test') {
        displayInfo(
          'Test Mode - Not Installing Homebrew Casks',
          `Would install: ${packages.homebrew.casks.slice(0, 5).join(', ')}${packages.homebrew.casks.length > 5 ? '...' : ''}`,
        )
      } else {
        displaySuccess('Homebrew casks would be installed here')
      }
    }
  }

  // npm global packages
  if (packages.npm?.global?.length > 0) {
    const shouldInstall = await confirmAction(
      `Restore ${packages.npm.global.length} npm global package(s)?`,
      true,
    )

    if (shouldInstall && shouldInstall !== BACK_OPTION) {
      if (config.mode === 'test') {
        displayInfo(
          'Test Mode - Not Installing npm Packages',
          `Would install: ${packages.npm.global.join(', ')}`,
        )
      } else {
        displaySuccess('npm global packages would be installed here')
      }
    }
  }

  // Add more package managers as needed (pnpm, yarn, pip, etc.)
}

/**
 * Restore runtimes (with test mode logging)
 */
async function restoreRuntimes(
  runtimes: any,
  config: RestoreConfig,
): Promise<void> {
  console.log(chalk.cyan.bold('\n🔧 Runtime Restoration\n'))

  if (config.mode === 'test') {
    displayWarning('Test Mode', 'Runtime installation is skipped in test mode.')
  }

  // Node.js versions
  if (runtimes.node?.installedVersions?.length > 0) {
    const shouldInstall = await confirmAction(
      `Restore Node.js versions (${runtimes.node.installedVersions.join(', ')})?`,
      true,
    )

    if (shouldInstall && shouldInstall !== BACK_OPTION) {
      if (config.mode === 'test') {
        displayInfo(
          'Test Mode - Not Installing Node.js',
          `Would install versions: ${runtimes.node.installedVersions.join(', ')}`,
        )
        if (runtimes.node.defaultVersion) {
          displayInfo(
            'Test Mode - Not Setting Default Version',
            `Would set default: ${runtimes.node.defaultVersion}`,
          )
        }
      } else {
        displaySuccess('Node.js versions would be installed here')
      }
    }
  }

  // Add more runtimes as needed (Python, Ruby, Go, etc.)
}

/**
 * Manage backups menu - view, restore, and manage backed up files
 */
async function manageBackupsMenu(): Promise<void> {
  while (true) {
    console.log(chalk.cyan.bold('\n🗄️  Backup Management\n'))

    const summary = getBackupSummary()

    if (summary.totalBackups === 0) {
      displayInfo(
        'No backups found',
        `Backup directory: ${summary.backupDirectory}\nBackups will be created automatically when you restore files that already exist.`,
      )

      const shouldReturn = await confirmAction('Return to main menu?', true)
      if (shouldReturn) return
      continue
    }

    // Display summary
    console.log(chalk.gray(`Backup Directory: ${summary.backupDirectory}`))
    console.log(chalk.gray(`Total Backups: ${summary.totalBackups}`))
    console.log(chalk.gray(`Total Size: ${(summary.totalSize / 1024).toFixed(2)} KB`))
    if (summary.oldestBackup) {
      console.log(chalk.gray(`Oldest: ${new Date(summary.oldestBackup).toLocaleString()}`))
    }
    if (summary.newestBackup) {
      console.log(chalk.gray(`Newest: ${new Date(summary.newestBackup).toLocaleString()}`))
    }
    console.log()

    const action = await selectFromList<'list' | 'restore' | 'cleanup' | 'back'>(
      'What would you like to do?',
      [
        { name: '📋 List all backups', value: 'list' },
        { name: '♻️  Restore a backup', value: 'restore' },
        { name: '🧹 Clean up old backups', value: 'cleanup' },
        { name: '← Back to main menu', value: 'back' },
      ],
    )

    if (action === BACK_OPTION || action === 'back') {
      return
    }

    if (action === 'list') {
      const backups = listAllBackups(true)

      console.log(chalk.cyan.bold(`\n📋 All Backups (${backups.length})\n`))

      backups.forEach((backup, index) => {
        const date = new Date(backup.backedUpAt).toLocaleString()
        const size = backup.originalSize ? `${(backup.originalSize / 1024).toFixed(2)} KB` : 'Unknown'
        console.log(chalk.white(`${index + 1}. ${backup.filename}`))
        console.log(chalk.gray(`   Location: ${backup.location}`))
        console.log(chalk.gray(`   Backed up: ${date}`))
        console.log(chalk.gray(`   Size: ${size}`))
        console.log()
      })

      await confirmAction('Press Enter to continue...', true)
    } else if (action === 'restore') {
      const backups = listAllBackups(true)

      const choices = backups.map((backup, index) => ({
        name: `${backup.filename} (${new Date(backup.backedUpAt).toLocaleString()})`,
        value: index,
      }))

      const selectedIndex = await selectFromList<number>(
        'Select a backup to restore:',
        choices,
      )

      if (selectedIndex !== BACK_OPTION) {
        const backup = backups[selectedIndex]

        displayWarning(
          'Restore Backup',
          `This will restore:\n  ${backup.location}\n  From: ${backup.backedUpAt}`,
        )

        const shouldRestore = await confirmAction(
          'Are you sure you want to restore this backup?',
          false,
        )

        if (shouldRestore && shouldRestore !== BACK_OPTION) {
          const success = restoreBackupEntry(backup, false)

          if (success) {
            displaySuccess('Backup restored successfully', backup.location)

            const shouldDelete = await confirmAction(
              'Delete the backup file now that it has been restored?',
              false,
            )

            if (shouldDelete && shouldDelete !== BACK_OPTION) {
              restoreBackupEntry(backup, true)
              displaySuccess('Backup file deleted')
            }
          } else {
            displayError('Failed to restore backup')
          }
        }
      }
    } else if (action === 'cleanup') {
      const daysInput = await promptInput(
        'Delete backups older than how many days?',
        {
          defaultValue: '30',
          validate: (input: string) => {
            const num = parseInt(input, 10)
            if (isNaN(num) || num < 1) {
              return 'Please enter a valid number of days (minimum 1)'
            }
            return true
          },
        },
      )

      if (daysInput) {
        const days = parseInt(daysInput, 10)
        const cleanedCount = cleanupOldBackups(days)

        if (cleanedCount > 0) {
          displaySuccess(
            `Cleaned up ${cleanedCount} old backup(s)`,
            `Deleted backups older than ${days} days`,
          )
        } else {
          displayInfo('No old backups to clean up', `All backups are newer than ${days} days`)
        }
      }
    }
  }
}

/**
 * Main restore menu
 */
async function showRestoreMenu(
  config: RestoreConfig,
): Promise<'dotfiles' | 'packages' | 'runtimes' | 'all' | 'backups' | 'exit'> {
  const platformData = config.platform === 'darwin' ? config.data?.darwin : config.data?.linux

  const choices: Array<{ name: string; value: 'dotfiles' | 'packages' | 'runtimes' | 'all' | 'backups' | 'exit' }> = []

  // Count available items
  const dotfilesCount = platformData?.dotfiles
    ? Object.keys(platformData.dotfiles).length
    : 0
  const packagesCount = platformData?.packages ? 1 : 0 // Simplified count
  const runtimesCount = platformData?.runtimes ? 1 : 0 // Simplified count

  if (dotfilesCount > 0) {
    choices.push({
      name: `📄 Restore Dotfiles (${dotfilesCount} file${dotfilesCount !== 1 ? 's' : ''})`,
      value: 'dotfiles',
    })
  }

  if (packagesCount > 0) {
    choices.push({
      name: '📦 Restore Packages',
      value: 'packages',
    })
  }

  if (runtimesCount > 0) {
    choices.push({
      name: '🔧 Restore Runtimes',
      value: 'runtimes',
    })
  }

  choices.push({
    name: '🚀 Restore Everything',
    value: 'all',
  })

  // Get backup summary to show count
  const backupSummary = getBackupSummary()
  const backupLabel = backupSummary.totalBackups > 0
    ? `🗄️  Manage Backups (${backupSummary.totalBackups} backup${backupSummary.totalBackups !== 1 ? 's' : ''})`
    : '🗄️  Manage Backups'

  choices.push({
    name: backupLabel,
    value: 'backups',
  })

  choices.push({
    name: '🚪 Exit',
    value: 'exit',
  })

  const selection = await selectFromList<
    'dotfiles' | 'packages' | 'runtimes' | 'all' | 'backups' | 'exit'
  >('What would you like to restore?', choices)

  if (selection === BACK_OPTION) {
    return 'exit'
  }

  return selection
}

/**
 * Main restore function
 */
export default async function restore(): Promise<void> {
  const mode = parseRestoreMode()
  const testRoot = getRestoreRoot(mode)
  const platform = ScriptSession.operatingSystem as 'darwin' | 'linux'

  // Display welcome banner
  displayWelcome(
    'Dev Machine Backup & Restore - Restore Wizard',
    'This wizard will help you restore your backed-up configuration.\nChoose what to restore and how to restore each item.',
  )

  displayModeInfo(mode, testRoot)

  // In test mode, ensure the test directory exists
  if (mode === 'test') {
    if (pathExists(testRoot)) {
      const shouldClean = await confirmAction(
        `Test directory ${testRoot} already exists. Clean it first?`,
        false,
      )

      if (shouldClean && shouldClean !== BACK_OPTION) {
        fs.rmSync(testRoot, { recursive: true, force: true })
        displaySuccess('Test directory cleaned')
      }
    }

    ensureDirectory(testRoot)
    displaySuccess('Test directory created', testRoot)
  }

  // Load backup data
  const data = loadBackupData()
  if (!data) {
    process.exit(1)
  }

  const config: RestoreConfig = {
    mode,
    testRoot,
    data,
    platform,
  }

  const platformData = platform === 'darwin' ? data.darwin : data.linux

  if (!platformData) {
    displayError(
      `No backup data found for ${platform}`,
      'Please run the setup script on this platform first.',
    )
    process.exit(1)
  }

  // Main restore loop
  while (true) {
    const selection = await showRestoreMenu(config)

    if (selection === 'exit') {
      displaySuccess('Restore process exited', 'Goodbye!')
      break
    }

    if (selection === 'backups') {
      await manageBackupsMenu()
      continue // Return to main menu after backup management
    }

    if (selection === 'dotfiles' || selection === 'all') {
      if (platformData.dotfiles) {
        await restoreDotfiles(platformData.dotfiles, config)
      }
    }

    if (selection === 'packages' || selection === 'all') {
      if (platformData.packages) {
        await restorePackages(platformData.packages, config)
      }
    }

    if (selection === 'runtimes' || selection === 'all') {
      if (platformData.runtimes) {
        await restoreRuntimes(platformData.runtimes, config)
      }
    }

    if (selection === 'all') {
      displaySuccess(
        'All items processed',
        'Restoration complete! Review the output above for details.',
      )
      break
    }

    // After processing, ask if they want to continue
    const shouldContinue = await confirmAction(
      'Would you like to restore more items?',
      true,
    )

    if (!shouldContinue || shouldContinue === BACK_OPTION) {
      displaySuccess('Restore process complete', 'Goodbye!')
      break
    }
  }
}
