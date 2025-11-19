#!/usr/bin/env node

import inquirer from 'inquirer'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import os from 'os'
import ScriptSession from '../clients/script-session'

// Type definitions
import type {
  BackupConfig,
  TrackedFile,
  PackageManager,
  RuntimeVersion,
} from '../types/backup-config'

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
  data: BackupConfig | null
  platform: 'darwin' | 'linux'
  dotfilesRepoPath: string // Path to the cloned dotfiles repository
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
 * Find the dotfiles repository location
 * Searches common locations where the dotfiles repo might be cloned
 */
function findDotfilesRepo(): string | null {
  const homeDir = os.homedir()
  const commonLocations = [
    path.join(homeDir, 'dotfiles'),
    path.join(homeDir, '.dotfiles'),
    path.join(homeDir, 'dev', 'dotfiles'),
    path.join(homeDir, 'Developer', 'dotfiles'),
    path.join(homeDir, 'projects', 'dotfiles'),
  ]

  for (const location of commonLocations) {
    const configPath = path.join(location, 'schema', 'backup-config.json')
    if (pathExists(configPath)) {
      return location
    }
  }

  return null
}

/**
 * Load the backup configuration from the dotfiles repository
 */
async function loadBackupData(): Promise<{ config: BackupConfig; repoPath: string } | null> {
  let repoPath = findDotfilesRepo()

  if (!repoPath) {
    displayWarning(
      'Dotfiles repository not found automatically',
      'Searched common locations:\n' +
      '  ~/dotfiles, ~/.dotfiles, ~/dev/dotfiles\n' +
      '  ~/Developer/dotfiles, ~/projects/dotfiles',
    )

    const customPath = await promptInput(
      'Enter the path to your dotfiles repository (or press Ctrl+C to exit):',
      {
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Please enter a valid path'
          }
          const expandedPath = expandTilde(input)
          if (!pathExists(expandedPath)) {
            return `Path does not exist: ${expandedPath}`
          }
          if (!isDirectory(expandedPath)) {
            return `Path is not a directory: ${expandedPath}`
          }
          const configPath = path.join(expandedPath, 'schema', 'backup-config.json')
          if (!pathExists(configPath)) {
            return `schema/backup-config.json not found in: ${expandedPath}`
          }
          return true
        },
      },
    )

    if (!customPath) {
      displayError('No repository path provided', 'Cannot continue without a dotfiles repository.')
      return null
    }

    repoPath = expandTilde(customPath)
  }

  const configPath = path.join(repoPath, 'schema', 'backup-config.json')

  try {
    const rawData = fs.readFileSync(configPath, 'utf-8')
    const config = JSON.parse(rawData) as BackupConfig

    displaySuccess(
      'Loaded backup configuration',
      `Repository: ${repoPath}\nVersion: ${config.version}`,
    )

    return { config, repoPath }
  } catch (error) {
    displayError(
      'Failed to load backup configuration',
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
  mode: RestoreMode,
  testRoot: string,
): Promise<{ action: RestoreAction; customPath?: string }> {
  if (!hasContent) {
    displayWarning(
      `Skipping ${filename}`,
      'No backed up content available for this file.',
    )
    return { action: 'skip' }
  }

  const boxWidth = 35
  console.log(chalk.cyan(`\n┌${'─'.repeat(boxWidth)}┐`))
  console.log(chalk.cyan(`│ ${chalk.bold(filename)}${' '.repeat(boxWidth - filename.length - 1)}│`))
  console.log(chalk.cyan(`├${'─'.repeat(boxWidth)}┤`))
  console.log(chalk.cyan(`│ ${chalk.gray('Expected:')} ${expectedPath}${' '.repeat(Math.max(0, boxWidth - 11 - expectedPath.length - 1))}│`))
  console.log(chalk.cyan(`│ ${chalk.gray('Backup:')}  ${backupPath}${' '.repeat(Math.max(0, boxWidth - 11 - backupPath.length - 1))}│`))

  if (mode === 'test') {
    console.log(chalk.cyan(`├${'─'.repeat(boxWidth)}┤`))
    console.log(chalk.yellow(`│ ${chalk.bold('TEST MODE')}${' '.repeat(boxWidth - 11)}│`))
    console.log(chalk.yellow(`│ Actual: ${testRoot}${' '.repeat(Math.max(0, boxWidth - 10 - testRoot.length - 1))}│`))
  }

  console.log(chalk.cyan(`└${'─'.repeat(boxWidth)}┘\n`))

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
  trackedFiles: TrackedFile[],
  config: RestoreConfig,
): Promise<void> {
  if (trackedFiles.length === 0) {
    displayWarning('No dotfiles to restore', 'The backup contains no dotfiles.')
    return
  }

  displayInfo(
    `Found ${trackedFiles.length} dotfile(s) to restore`,
    'You can choose how to restore each file.',
  )

  let restoredCount = 0
  let skippedCount = 0

  for (let i = 0; i < trackedFiles.length; i++) {
    const file = trackedFiles[i]

    // Skip files that are not tracked
    if (!file.tracked) {
      continue
    }

    displayStepProgress(i + 1, trackedFiles.length, `Restoring ${file.name}`)

    const expectedPath = resolveTargetPath(
      file.sourcePath,
      config.testRoot,
      config.mode,
    )

    // Read file content from the dotfiles repository
    const repoFilePath = path.join(config.dotfilesRepoPath, file.repoPath)
    let fileContent = ''
    let hasContent = false

    if (pathExists(repoFilePath)) {
      try {
        fileContent = fs.readFileSync(repoFilePath, 'utf-8')
        hasContent = true
      } catch (error) {
        displayWarning(
          `Could not read ${file.name} from repository`,
          error instanceof Error ? error.message : 'Unknown error',
        )
      }
    }

    const { action, customPath } = await promptFileRestoreAction(
      file.name,
      expectedPath,
      repoFilePath,
      hasContent,
      config.mode,
      config.testRoot,
    )

    if (action === 'skip') {
      skippedCount++
      displayInfo(`Skipped ${file.name}`)
      continue
    }

    const targetPath = customPath || expectedPath
    const success = restoreFile(
      fileContent,
      targetPath,
      action,
      repoFilePath,
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
  packageManagers: PackageManager[],
  config: RestoreConfig,
): Promise<void> {
  console.log(chalk.cyan.bold('\n📦 Package Restoration\n'))

  if (config.mode === 'test') {
    displayWarning('Test Mode', 'Package installation is skipped in test mode.')
  }

  for (const manager of packageManagers) {
    if (!manager.enabled || manager.packages.length === 0) {
      continue
    }

    const packageList = manager.packages
      .slice(0, 5)
      .map((p) => p.name)
      .join(', ')
    const moreText = manager.packages.length > 5 ? '...' : ''

    const shouldInstall = await confirmAction(
      `Restore ${manager.packages.length} ${manager.type} package(s)?`,
      true,
    )

    if (shouldInstall && shouldInstall !== BACK_OPTION) {
      if (config.mode === 'test') {
        displayInfo(
          `Test Mode - Not Installing ${manager.type} Packages`,
          `Would install: ${packageList}${moreText}`,
        )
        if (manager.restoreCommand) {
          displayInfo(
            'Restore command',
            manager.restoreCommand,
          )
        }
      } else {
        displayInfo(
          `Installing ${manager.type} packages`,
          'This may take several minutes...',
        )
        if (manager.restoreCommand) {
          displayInfo('Would run', manager.restoreCommand)
          // In a real implementation, we would execute the restore command here
          displaySuccess(`${manager.type} packages would be installed here`)
        } else {
          displayWarning(
            `No restore command available for ${manager.type}`,
            'Manual installation may be required',
          )
        }
      }
    }
  }
}

/**
 * Restore runtimes (with test mode logging)
 */
async function restoreRuntimes(
  runtimes: RuntimeVersion[],
  config: RestoreConfig,
): Promise<void> {
  console.log(chalk.cyan.bold('\n🔧 Runtime Restoration\n'))

  if (config.mode === 'test') {
    displayWarning('Test Mode', 'Runtime installation is skipped in test mode.')
  }

  for (const runtime of runtimes) {
    if (runtime.versions.length === 0) {
      continue
    }

    const versionList = runtime.versions.join(', ')
    const managerInfo = runtime.manager ? ` via ${runtime.manager}` : ''

    const shouldInstall = await confirmAction(
      `Restore ${runtime.type} versions (${versionList})${managerInfo}?`,
      true,
    )

    if (shouldInstall && shouldInstall !== BACK_OPTION) {
      if (config.mode === 'test') {
        displayInfo(
          `Test Mode - Not Installing ${runtime.type}`,
          `Would install versions: ${versionList}${managerInfo}`,
        )
        if (runtime.defaultVersion) {
          displayInfo(
            'Test Mode - Not Setting Default Version',
            `Would set default: ${runtime.defaultVersion}`,
          )
        }
        if (runtime.installCommand) {
          displayInfo('Install command', runtime.installCommand)
        }
      } else {
        displayInfo(
          `Installing ${runtime.type} versions`,
          'This may take several minutes...',
        )
        if (runtime.installCommand) {
          displayInfo('Would run', runtime.installCommand)
          // In a real implementation, we would execute the install command here
          displaySuccess(`${runtime.type} versions would be installed here`)
        } else {
          displayWarning(
            `No install command available for ${runtime.type}`,
            'Manual installation may be required',
          )
        }
      }
    }
  }
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
 * Get the OS/distro key for the current platform
 */
function getOSKey(platform: 'darwin' | 'linux', config: BackupConfig): string {
  if (platform === 'darwin') {
    return 'macos'
  }

  // For Linux, we need to determine the distro
  // For now, we'll use the first available Linux entry in trackedFiles
  const trackedFilesKeys = Object.keys(config.dotfiles.trackedFiles)
  const linuxKey = trackedFilesKeys.find((key) => key !== 'macos')
  return linuxKey || 'linux'
}

/**
 * Main restore menu
 */
async function showRestoreMenu(
  config: RestoreConfig,
): Promise<'dotfiles' | 'packages' | 'runtimes' | 'all' | 'backups' | 'exit'> {
  if (!config.data) {
    return 'exit'
  }

  const osKey = getOSKey(config.platform, config.data)

  const choices: Array<{ name: string; value: 'dotfiles' | 'packages' | 'runtimes' | 'all' | 'backups' | 'exit' }> = []

  // Count available items
  const dotfilesData = config.data.dotfiles.trackedFiles[osKey]
  const dotfilesCount = dotfilesData?.files?.filter((f) => f.tracked).length || 0

  // Count packages
  const packagesData = config.data.packages.packageManagers[osKey]
  const packagesCount = packagesData?.length || 0

  // Count runtimes
  const runtimesData = config.data.runtimes.runtimes[osKey]
  const runtimesCount = runtimesData?.length || 0

  if (dotfilesCount > 0) {
    choices.push({
      name: `📄 Restore Dotfiles (${dotfilesCount} file${dotfilesCount !== 1 ? 's' : ''})`,
      value: 'dotfiles',
    })
  }

  if (packagesCount > 0) {
    choices.push({
      name: `📦 Restore Packages (${packagesCount} manager${packagesCount !== 1 ? 's' : ''})`,
      value: 'packages',
    })
  }

  if (runtimesCount > 0) {
    choices.push({
      name: `🔧 Restore Runtimes (${runtimesCount} runtime${runtimesCount !== 1 ? 's' : ''})`,
      value: 'runtimes',
    })
  }

  if (dotfilesCount > 0 || packagesCount > 0 || runtimesCount > 0) {
    choices.push({
      name: '🚀 Restore Everything',
      value: 'all',
    })
  }

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
  const result = await loadBackupData()
  if (!result) {
    process.exit(1)
  }

  const { config: backupConfig, repoPath } = result

  const config: RestoreConfig = {
    mode,
    testRoot,
    data: backupConfig,
    platform,
    dotfilesRepoPath: repoPath,
  }

  const osKey = getOSKey(platform, backupConfig)

  // Check if there's data for this OS
  const dotfilesData = backupConfig.dotfiles.trackedFiles[osKey]
  if (!dotfilesData) {
    displayError(
      `No backup data found for ${osKey}`,
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
      const trackedFiles = backupConfig.dotfiles.trackedFiles[osKey]?.files
      if (trackedFiles && trackedFiles.length > 0) {
        await restoreDotfiles(trackedFiles, config)
      }
    }

    if (selection === 'packages' || selection === 'all') {
      const packageManagers = backupConfig.packages.packageManagers[osKey]
      if (packageManagers && packageManagers.length > 0) {
        await restorePackages(packageManagers, config)
      }
    }

    if (selection === 'runtimes' || selection === 'all') {
      const runtimes = backupConfig.runtimes.runtimes[osKey]
      if (runtimes && runtimes.length > 0) {
        await restoreRuntimes(runtimes, config)
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

// Execute the restore function when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n👋 Restore cancelled. Goodbye!\n'))
    process.exit(0)
  })

  try {
    await restore()
  } catch (error) {
    if (error instanceof Error && error.message.includes('User force closed')) {
      console.log(chalk.yellow('\n\n👋 Restore cancelled. Goodbye!\n'))
      process.exit(0)
    }
    console.error(chalk.red('\n❌ An error occurred:'), error)
    process.exit(1)
  }
}
