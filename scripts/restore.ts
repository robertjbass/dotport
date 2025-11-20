#!/usr/bin/env node

import inquirer from 'inquirer'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import os from 'os'
import ScriptSession from '../clients/script-session'
import { detectPackageManager } from '../utils/detect-runtime'

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
    const configPath = path.join(location, 'schema.json')
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
          const configPath = path.join(expandedPath, 'schema.json')
          if (!pathExists(configPath)) {
            return `schema.json not found in: ${expandedPath}`
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

  const configPath = path.join(repoPath, 'schema.json')

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
 * Prompt user for restore action for a single file or directory
 */
async function promptFileRestoreAction(
  filename: string,
  expectedPath: string,
  backupPath: string,
  hasContent: boolean,
  mode: RestoreMode,
  testRoot: string,
  isDirectory: boolean = false,
): Promise<{ action: RestoreAction; customPath?: string }> {
  if (!hasContent) {
    displayWarning(
      `Skipping ${filename}`,
      'No backed up content available for this file.',
    )
    return { action: 'skip' }
  }

  // Calculate dynamic box width based on content
  const minBoxWidth = 35
  const maxLineLength = Math.max(
    filename.length,
    11 + expectedPath.length, // "Expected: " + path
    11 + backupPath.length,   // "Backup:  " + path
    mode === 'test' ? 10 + testRoot.length : 0, // "Actual: " + path
  )
  const boxWidth = Math.max(minBoxWidth, maxLineLength + 2) // +2 for padding

  console.log(chalk.cyan(`\n┌${'─'.repeat(boxWidth)}┐`))
  console.log(chalk.cyan(`│ ${chalk.bold(filename)}${' '.repeat(boxWidth - filename.length - 1)}│`))
  console.log(chalk.cyan(`├${'─'.repeat(boxWidth)}┤`))
  console.log(chalk.cyan(`│ ${chalk.gray('Expected:')} ${expectedPath}${' '.repeat(boxWidth - 11 - expectedPath.length - 1)}│`))
  console.log(chalk.cyan(`│ ${chalk.gray('Backup:')}  ${backupPath}${' '.repeat(boxWidth - 11 - backupPath.length - 1)}│`))

  if (mode === 'test') {
    console.log(chalk.cyan(`├${'─'.repeat(boxWidth)}┤`))
    console.log(chalk.yellow(`│ ${chalk.bold('TEST MODE')}${' '.repeat(boxWidth - 11)}│`))
    console.log(chalk.yellow(`│ Actual: ${testRoot}${' '.repeat(boxWidth - 10 - testRoot.length - 1)}│`))
  }

  console.log(chalk.cyan(`└${'─'.repeat(boxWidth)}┘\n`))

  const itemType = isDirectory ? 'directory' : 'file'
  const action = await selectFromList<RestoreAction>(
    `How would you like to restore ${chalk.bold(filename)}?`,
    [
      {
        name: `📋 Restore ${itemType} to ${chalk.cyan(expectedPath)}`,
        value: 'copy-expected',
      },
      {
        name: `📝 Restore ${itemType} to different path (enter manually)`,
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
        name: `⏭️  Skip this ${itemType}`,
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
 * Recursively copy a directory
 */
function copyDirectoryRecursive(sourcePath: string, targetPath: string): void {
  ensureDirectory(targetPath)

  const entries = fs.readdirSync(sourcePath, { withFileTypes: true })

  for (const entry of entries) {
    const sourceEntry = path.join(sourcePath, entry.name)
    const targetEntry = path.join(targetPath, entry.name)

    if (entry.isDirectory()) {
      copyDirectoryRecursive(sourceEntry, targetEntry)
    } else {
      fs.copyFileSync(sourceEntry, targetEntry)
    }
  }
}

/**
 * Copy or symlink a file/directory to the target location
 */
function restoreFile(
  content: string,
  targetPath: string,
  action: RestoreAction,
  backupPath: string,
  mode: RestoreMode,
  testRoot: string,
  isDir: boolean = false,
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
      if (isDir) {
        // Copy the entire directory recursively
        copyDirectoryRecursive(backupPath, absoluteTarget)
        displaySuccess(`Copied directory to: ${targetPath}`)
      } else {
        // Copy the file
        fs.writeFileSync(absoluteTarget, content, 'utf-8')
        displaySuccess(`Copied to: ${targetPath}`)
      }
      return true
    } else if (action === 'symlink-expected' || action === 'symlink-custom') {
      // Create symlink
      let sourcePath: string

      if (isDir) {
        // For directories, symlink directly to the backup directory
        sourcePath = backupPath
      } else {
        // For files, we need the source to exist
        // In normal mode, the backup is in the repo
        // In test mode, we'll create a temp file with the content first

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
      }

      // Remove existing file/symlink if present
      if (pathExists(absoluteTarget)) {
        if (isDirectory(absoluteTarget)) {
          fs.rmSync(absoluteTarget, { recursive: true, force: true })
        } else {
          fs.unlinkSync(absoluteTarget)
        }
      }

      // Create symlink
      fs.symlinkSync(sourcePath, absoluteTarget)
      displaySuccess(`Symlinked: ${targetPath} → ${sourcePath}`)
      return true
    }

    return false
  } catch (error) {
    displayError(
      `Failed to restore to ${targetPath}`,
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
    let isDir = false

    if (pathExists(repoFilePath)) {
      try {
        // Check if it's a directory
        if (isDirectory(repoFilePath)) {
          isDir = true
          hasContent = true
        } else {
          fileContent = fs.readFileSync(repoFilePath, 'utf-8')
          hasContent = true
        }
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
      isDir,
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
      isDir,
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

  // Detect system's default package manager
  const systemDefaultPackageManager = detectPackageManager()

  // Check if there are multiple Node.js package managers with global packages
  const nodePackageManagers = packageManagers.filter(
    (m) => ['npm', 'pnpm', 'yarn'].includes(m.type) && m.enabled && m.packages.length > 0,
  )

  // If there are multiple Node.js package managers, ask user for preference
  if (nodePackageManagers.length > 1) {
    // Calculate total packages
    const totalNodePackages = nodePackageManagers.reduce((sum, m) => sum + m.packages.length, 0)

    // Build summary of packages by manager
    const packageSummary = nodePackageManagers
      .map((m) => `${m.packages.length} global ${m.type} package${m.packages.length !== 1 ? 's' : ''} backed up`)
      .join('\n')

    displayInfo(
      'Multiple Node.js Package Managers Detected',
      packageSummary,
    )

    // Determine if system default is one of the backed-up managers
    const systemDefaultInList = nodePackageManagers.some((m) => m.type === systemDefaultPackageManager)
    const defaultManagerText = systemDefaultInList
      ? ` (${systemDefaultPackageManager} - your system default)`
      : ''

    const installChoice = await selectFromList<'default' | 'respective' | 'skip'>(
      'How would you like to install global Node.js packages?',
      [
        {
          name: `🔄 Install all ${totalNodePackages} packages with one package manager${defaultManagerText}`,
          value: 'default',
        },
        {
          name: `📦 Install each package manager's packages separately (${nodePackageManagers.map(m => m.packages.length).join(', ')})`,
          value: 'respective',
        },
        {
          name: '⏭️  Skip all Node.js packages',
          value: 'skip',
        },
      ],
    )

    if (installChoice === BACK_OPTION || installChoice === 'skip') {
      // Skip all Node.js packages
      // Mark all as skipped so they won't be prompted for installation
      for (const manager of packageManagers) {
        if (['npm', 'pnpm', 'yarn'].includes(manager.type)) {
          manager.enabled = false
        }
      }
    } else if (installChoice === 'respective') {
      // User wants to install each manager's packages separately - nothing to do here
      // The loop below will handle each manager individually
    } else {
      // User chose to consolidate - determine which package manager to use
      let defaultPackageManagerChoice: 'npm' | 'pnpm' | 'yarn' | null = null

      // If system default is in the list, use it automatically
      if (systemDefaultInList) {
        defaultPackageManagerChoice = systemDefaultPackageManager as 'npm' | 'pnpm' | 'yarn'
        displayInfo(
          `Using ${systemDefaultPackageManager} (system default)`,
          'Installing all global Node.js packages with your system default package manager',
        )
      } else {
        // System default not available, ask user to choose
        const choices = nodePackageManagers.map((m) => ({
          name: `${m.type} - ${m.packages.length} package${m.packages.length !== 1 ? 's' : ''}`,
          value: m.type as 'npm' | 'pnpm' | 'yarn',
        }))

        const managerChoice = await selectFromList<'npm' | 'pnpm' | 'yarn'>(
          'Which package manager would you like to use for all global packages?',
          choices,
        )

        if (managerChoice === BACK_OPTION) {
          defaultPackageManagerChoice = null
        } else {
          defaultPackageManagerChoice = managerChoice
        }
      }

      // If we chose a package manager, install all Node packages now
      if (defaultPackageManagerChoice) {
        const allNodePackages = nodePackageManagers.flatMap((m) => m.packages)
        const uniquePackages = Array.from(
          new Map(allNodePackages.map((p) => [p.name, p])).values(),
        )

        const packageNames = uniquePackages.map((p) => p.name).join(' ')
        const installCommand = `${defaultPackageManagerChoice} add --global ${packageNames}`

        displayInfo(
          `Installing all global Node.js packages with ${defaultPackageManagerChoice}`,
          `Total: ${uniquePackages.length} package(s)`,
        )

        if (config.mode === 'test') {
          displayInfo(
            `Test Mode - Not Installing ${defaultPackageManagerChoice} Packages`,
            `Would install: ${uniquePackages.slice(0, 5).map((p) => p.name).join(', ')}${uniquePackages.length > 5 ? '...' : ''}`,
          )
          displayInfo('Restore command', installCommand)
        } else {
          displayInfo(
            `Installing ${defaultPackageManagerChoice} packages`,
            'This may take several minutes...',
          )
          displayInfo('Would run', installCommand)
          displaySuccess(`${defaultPackageManagerChoice} packages would be installed here`)
        }

        // Mark all Node package managers as disabled so we don't prompt for them again
        for (const manager of packageManagers) {
          if (['npm', 'pnpm', 'yarn'].includes(manager.type)) {
            manager.enabled = false
          }
        }
      }
    }
  }

  // Process remaining package managers (non-Node or if user chose "respective")
  for (const manager of packageManagers) {
    if (!manager.enabled || manager.packages.length === 0) {
      continue
    }

    const installChoice = await selectFromList<'yes' | 'no' | 'select'>(
      `Restore ${manager.packages.length} ${manager.type} package(s)?`,
      [
        { name: 'Yes', value: 'yes' },
        { name: 'No', value: 'no' },
        { name: '📋 Select packages manually', value: 'select' },
      ],
    )

    if (installChoice === BACK_OPTION || installChoice === 'no') {
      continue
    }

    if (installChoice === 'yes' || installChoice === 'select') {
      // Determine which packages to install
      let packagesToInstall = manager.packages
      let installCommand = manager.restoreCommand
      const isNodePackageManager = ['npm', 'pnpm', 'yarn'].includes(manager.type)

      // If manual selection, prompt user to select packages
      if (installChoice === 'select') {
        const { selectedPackages } = await inquirer.prompt<{ selectedPackages: string[] }>([
          {
            type: 'checkbox',
            name: 'selectedPackages',
            message: `Select ${manager.type} packages to install:`,
            choices: packagesToInstall.map(pkg => ({
              name: pkg.version ? `${pkg.name} (${pkg.version})` : pkg.name,
              value: pkg.name,
              checked: false,
            })),
            pageSize: 15,
          },
        ])

        if (selectedPackages.length === 0) {
          displayInfo('No packages selected', 'Skipping package installation')
          continue
        }

        // Filter to only selected packages
        packagesToInstall = packagesToInstall.filter(pkg => selectedPackages.includes(pkg.name))

        // Update install command for selected packages
        if (isNodePackageManager) {
          installCommand = `${manager.type} add --global ${selectedPackages.join(' ')}`
        }
      }

      if (config.mode === 'test') {
        displayInfo(
          `Test Mode - Not Installing ${manager.type} Packages`,
          `Would install: ${packagesToInstall.slice(0, 5).map((p) => p.name).join(', ')}${packagesToInstall.length > 5 ? '...' : ''}`,
        )
        if (installCommand) {
          displayInfo(
            'Restore command',
            installCommand,
          )
        }
      } else {
        displayInfo(
          `Installing ${manager.type} packages`,
          'This may take several minutes...',
        )
        if (installCommand) {
          displayInfo('Would run', installCommand)
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
 * Get the machine ID key for the current platform
 * With the new flat structure, machine IDs follow the pattern: <os>-<distro>-<nickname>
 * This function will prompt the user to select which machine configuration to restore from
 */
function getMachineIdKey(platform: 'darwin' | 'linux', config: BackupConfig): string {
  const machineIds = Object.keys(config.dotfiles)

  // Filter keys that match the current platform
  const platformPrefix = platform === 'darwin' ? 'macos-' : 'linux-'
  const matchingKeys = machineIds.filter((key) => key.startsWith(platformPrefix))

  if (matchingKeys.length === 0) {
    // No matching configurations found
    return ''
  }

  // If there's only one match, return it
  if (matchingKeys.length === 1) {
    return matchingKeys[0]
  }

  // Multiple matches - for now return the first one
  // TODO: Prompt user to select which machine configuration to restore
  return matchingKeys[0]
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

  const machineId = getMachineIdKey(config.platform, config.data)

  const choices: Array<{ name: string; value: 'dotfiles' | 'packages' | 'runtimes' | 'all' | 'backups' | 'exit' }> = []

  // Count available items
  const machineConfig = config.data.dotfiles[machineId]
  const dotfilesCount = machineConfig?.['tracked-files']?.files?.filter((f) => f.tracked).length || 0

  // Count packages
  const packagesCount = machineConfig?.packages?.packageManagers?.length || 0

  // Count runtimes
  const runtimesCount = machineConfig?.runtimes?.runtimes?.length || 0

  // Add "Restore Everything" first if there's anything to restore
  if (dotfilesCount > 0 || packagesCount > 0 || runtimesCount > 0) {
    choices.push({
      name: '🚀 Restore Everything',
      value: 'all',
    })
  }

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
        true,
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

  const machineId = getMachineIdKey(platform, backupConfig)

  // Check if there's data for this machine
  const machineConfig = backupConfig.dotfiles[machineId]
  if (!machineConfig) {
    displayError(
      `No backup data found for ${machineId}`,
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
      const trackedFiles = backupConfig.dotfiles[machineId]?.['tracked-files']?.files
      if (trackedFiles && trackedFiles.length > 0) {
        await restoreDotfiles(trackedFiles, config)
      }
    }

    if (selection === 'packages' || selection === 'all') {
      const packageManagers = backupConfig.dotfiles[machineId]?.packages?.packageManagers
      if (packageManagers && packageManagers.length > 0) {
        await restorePackages(packageManagers, config)
      }
    }

    if (selection === 'runtimes' || selection === 'all') {
      const runtimes = backupConfig.dotfiles[machineId]?.runtimes?.runtimes
      if (runtimes && runtimes.length > 0) {
        await restoreRuntimes(runtimes, config)
      }
    }

    if (selection === 'all') {
      if (config.mode === 'test') {
        displaySuccess(
          'All items processed',
          `Restoration complete! Review the output above for details.\n\nTest files restored to: ${chalk.cyan(config.testRoot)}`,
        )
      } else {
        displaySuccess(
          'All items processed',
          'Restoration complete! Review the output above for details.',
        )
      }
      break
    }

    // After processing, ask if they want to continue
    const shouldContinue = await confirmAction(
      'Would you like to restore more items?',
      true,
    )

    if (!shouldContinue || shouldContinue === BACK_OPTION) {
      if (config.mode === 'test') {
        displaySuccess(
          'Restore process complete',
          `Test files restored to: ${chalk.cyan(config.testRoot)}\nGoodbye!`,
        )
      } else {
        displaySuccess('Restore process complete', 'Goodbye!')
      }
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
