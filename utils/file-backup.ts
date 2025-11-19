/**
 * File Backup Utility
 *
 * Handles copying dotfiles and config files to the dotfiles repository
 * while preserving original paths for symlinking later
 */

import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { TrackedFile } from '../types/backup-config'
import { expandTilde } from './path-helpers'

export type BackupResult = {
  success: boolean
  backedUpCount: number
  copiedFiles: string[]
  skippedFiles: string[]
  errors: Array<{ file: string; error: string }>
}

export type BackupOptions = {
  dryRun?: boolean // If true, only simulate the backup without copying files
  verbose?: boolean // Show detailed output
}

/**
 * Check if file should be excluded from backup (e.g., SSH private keys, third-party extensions)
 */
function shouldExcludeFile(filePath: string, fileName: string): boolean {
  // Exclude SSH private keys and sensitive files
  const sshKeyPatterns = [
    'id_rsa',
    'id_dsa',
    'id_ecdsa',
    'id_ed25519',
    'id_rsa.pub',
    'id_dsa.pub',
    'id_ecdsa.pub',
    'id_ed25519.pub',
    'authorized_keys',
    'known_hosts',
  ]

  // Check if in .ssh directory and matches key pattern
  if (filePath.includes('.ssh')) {
    if (
      sshKeyPatterns.some(
        (pattern) => fileName === pattern || fileName.startsWith(pattern + '.'),
      )
    ) {
      return true
    }
  }

  // Exclude third-party GNOME Shell extensions (keep only @custom ones)
  // Third-party extensions are typically from GitHub/GitLab/etc with patterns like:
  // - name@author.github.com
  // - name@gitlab.com/author
  // Custom extensions should use @custom suffix: name@custom
  if (filePath.includes('gnome-shell/extensions')) {
    // If this is a third-party extension directory (not @custom), exclude it
    if (fileName.includes('@') && !fileName.includes('@custom')) {
      // Common third-party extension patterns
      const thirdPartyPatterns = [
        '@github.com',
        '@gitlab.com',
        '@G-dH.github.com', // specific pattern for advanced-alt-tab
        '@',  // Any @ that's not @custom should be excluded
      ]

      // Check if it matches any third-party pattern AND doesn't include @custom
      if (thirdPartyPatterns.some(pattern => fileName.includes(pattern))) {
        return true
      }
    }
  }

  return false
}

/**
 * Copy a single file or directory to the destination
 */
async function copyFileOrDirectory(
  sourcePath: string,
  destPath: string,
  isDirectory: boolean,
): Promise<void> {
  if (isDirectory) {
    // For directories, copy recursively
    await fs.promises.mkdir(destPath, { recursive: true })

    const entries = await fs.promises.readdir(sourcePath, {
      withFileTypes: true,
    })

    for (const entry of entries) {
      const srcPath = path.join(sourcePath, entry.name)
      const dstPath = path.join(destPath, entry.name)

      // Skip SSH private keys and sensitive files
      if (shouldExcludeFile(srcPath, entry.name)) {
        console.log(
          chalk.gray(`   Skipping: ${entry.name} (SSH key/sensitive file)`),
        )
        continue
      }

      if (entry.isDirectory()) {
        await copyFileOrDirectory(srcPath, dstPath, true)
      } else {
        await fs.promises.copyFile(srcPath, dstPath)
      }
    }
  } else {
    // For files, copy directly (shouldn't be called for excluded files)
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true })
    await fs.promises.copyFile(sourcePath, destPath)
  }
}

/**
 * Backup files to the dotfiles repository
 * @param files - Files to backup
 * @param repoPath - Path to dotfiles repository
 * @param machineId - Machine identifier (e.g., 'macos-darwin-macbook-air')
 * @param options - Backup options
 */
export async function backupFilesToRepo(
  files: TrackedFile[],
  repoPath: string,
  machineId: string,
  options: BackupOptions = {},
): Promise<BackupResult> {
  const { dryRun = false, verbose = true } = options
  const result: BackupResult = {
    success: true,
    backedUpCount: 0,
    copiedFiles: [],
    skippedFiles: [],
    errors: [],
  }

  if (verbose) {
    console.log(chalk.cyan('\n📦 Backing up files to repository...\n'))
    if (dryRun) {
      console.log(chalk.yellow('🔍 DRY RUN MODE - No files will be copied\n'))
    }
  }

  for (const file of files) {
    try {
      const sourcePath = expandTilde(file.sourcePath)

      // Check if source file exists
      if (!fs.existsSync(sourcePath)) {
        if (verbose) {
          console.log(
            chalk.yellow(
              `⚠️  Skipping ${file.name} - file not found at ${sourcePath}`,
            ),
          )
        }
        result.skippedFiles.push(file.sourcePath)
        result.errors.push({
          file: file.sourcePath,
          error: 'File not found',
        })
        continue
      }

      // Check if file should be excluded (e.g., SSH private keys)
      const fileName = path.basename(sourcePath)
      if (shouldExcludeFile(sourcePath, fileName)) {
        if (verbose) {
          console.log(
            chalk.gray(`   Skipping: ${file.name} (SSH key/sensitive file)`),
          )
        }
        result.skippedFiles.push(file.sourcePath)
        continue
      }

      // Determine if it's a directory
      const stats = await fs.promises.stat(sourcePath)
      const isDirectory = stats.isDirectory()

      // Build destination path in repo
      const destPath = path.join(repoPath, file.repoPath)

      if (verbose) {
        console.log(chalk.gray(`  ${file.name}`))
        console.log(chalk.gray(`    From: ${file.sourcePath}`))
        console.log(chalk.gray(`    To:   ${file.repoPath}`))
      }

      if (!dryRun) {
        // Copy the file or directory
        await copyFileOrDirectory(sourcePath, destPath, isDirectory)
      }

      result.copiedFiles.push(file.sourcePath)
      result.backedUpCount++

      if (verbose) {
        console.log(chalk.green(`    ✅ ${dryRun ? 'Would copy' : 'Copied'}\n`))
      }
    } catch (error: any) {
      if (verbose) {
        console.log(chalk.red(`    ❌ Error: ${error.message}\n`))
      }
      result.errors.push({
        file: file.sourcePath,
        error: error.message,
      })
      result.success = false
    }
  }

  if (verbose) {
    console.log(chalk.cyan('─'.repeat(50)))
    console.log(chalk.green(`✅ Copied: ${result.copiedFiles.length} files`))
    if (result.skippedFiles.length > 0) {
      console.log(
        chalk.yellow(`⚠️  Skipped: ${result.skippedFiles.length} files`),
      )
    }
    if (result.errors.length > 0) {
      console.log(chalk.red(`❌ Errors: ${result.errors.length} files`))
    }
    console.log(chalk.cyan('─'.repeat(50) + '\n'))
  }

  return result
}

/**
 * Generate repoPath based on machine ID and file name
 * With the new flat structure, all machines are at root level with machine-specific directories
 * @param fileName - File name (e.g., '.zshrc')
 * @param machineId - Machine identifier (e.g., 'macos-darwin-macbook-air')
 * @returns Path in repo (e.g., 'macos-darwin-macbook-air/.zshrc')
 */
export function generateRepoPath(
  fileName: string,
  machineId: string,
): string {
  // Always use flat structure with machine-specific directories
  // e.g., 'macos-darwin-macbook-air/.zshrc'
  return path.join(machineId, fileName)
}

/**
 * Preview backup operation - show what will be copied
 */
export function previewBackup(files: TrackedFile[], repoPath: string): void {
  console.log(chalk.cyan('\n📋 BACKUP PREVIEW\n'))
  console.log(chalk.gray(`Repository: ${repoPath}\n`))

  console.log(chalk.yellow('Files to be backed up:\n'))

  files.forEach((file, index) => {
    const sourcePath = expandTilde(file.sourcePath)
    const exists = fs.existsSync(sourcePath)

    console.log(chalk.white(`${index + 1}. ${file.name}`))
    console.log(
      chalk.gray(
        `   Source: ${file.sourcePath} ${exists ? chalk.green('✓') : chalk.red('✗ NOT FOUND')}`,
      ),
    )
    console.log(chalk.gray(`   Destination: ${file.repoPath}`))
    console.log(
      chalk.gray(
        `   Tracked in git: ${file.tracked ? chalk.green('Yes') : chalk.red('No (secret)')}`,
      ),
    )
    console.log()
  })

  const trackedCount = files.filter((f) => f.tracked).length
  const secretCount = files.filter((f) => !f.tracked).length

  console.log(chalk.cyan('─'.repeat(50)))
  console.log(chalk.white(`Total files: ${files.length}`))
  console.log(chalk.green(`  Will be tracked in git: ${trackedCount}`))
  if (secretCount > 0) {
    console.log(chalk.yellow(`  Secrets (not tracked): ${secretCount}`))
  }
  console.log(chalk.cyan('─'.repeat(50) + '\n'))
}
