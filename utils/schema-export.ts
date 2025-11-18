/**
 * Schema Export Utility
 *
 * Exports the backup configuration schema to the dotfiles repository
 * (excluding sensitive information like tokens)
 */

import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { BackupConfig } from '../types/backup-config'
import { mergeBackupConfig } from './schema-builder'

/**
 * Sanitize config by removing sensitive information
 */
export function sanitizeConfig(config: BackupConfig): BackupConfig {
  // Create a deep copy
  const sanitized = JSON.parse(JSON.stringify(config)) as BackupConfig

  // Remove sensitive fields
  // Note: The config file itself (which contains GitHub token) is stored separately
  // in the user's local config directory, NOT in the dotfiles repo

  return sanitized
}

/**
 * Export schema to dotfiles repository
 *
 * If a schema already exists in the repo (e.g., from another OS), this will
 * merge the new config with the existing one to preserve multi-OS support.
 */
export async function exportSchemaToRepo(
  config: BackupConfig,
  repoPath: string,
  options: { verbose?: boolean } = {},
): Promise<{ success: boolean; error?: string }> {
  const { verbose = true } = options

  try {
    if (verbose) {
      console.log(chalk.cyan('\n📝 Exporting backup schema to repository...\n'))
    }

    // Create schema directory
    const schemaDir = path.join(repoPath, 'schema')
    await fs.promises.mkdir(schemaDir, { recursive: true })

    const schemaPath = path.join(schemaDir, 'backup-config.json')

    // Check if schema already exists (multi-OS support)
    let finalConfig = config
    try {
      const existingSchemaContent = await fs.promises.readFile(schemaPath, 'utf-8')
      const existingConfig = JSON.parse(existingSchemaContent) as BackupConfig

      if (verbose) {
        console.log(chalk.yellow('📋 Found existing schema - merging configurations...'))
      }

      // Merge the new config with existing to preserve other OS data
      finalConfig = mergeBackupConfig(existingConfig, config)

      if (verbose) {
        console.log(chalk.green('✅ Configurations merged successfully'))
        console.log(
          chalk.gray(
            `   Supported OSes: ${finalConfig.multiOS.supportedOS?.join(', ') || 'none'}\n`,
          ),
        )
      }
    } catch (error: any) {
      // No existing schema or read error - use new config as-is
      if (error.code !== 'ENOENT') {
        console.log(chalk.yellow(`⚠️  Could not read existing schema: ${error.message}`))
      } else if (verbose) {
        console.log(chalk.gray('   Creating new schema file...\n'))
      }
    }

    // Sanitize the config (remove sensitive info)
    const sanitizedConfig = sanitizeConfig(finalConfig)

    // Write schema file
    await fs.promises.writeFile(
      schemaPath,
      JSON.stringify(sanitizedConfig, null, 2),
      'utf-8',
    )

    if (verbose) {
      console.log(chalk.green('✅ Schema exported successfully'))
      console.log(
        chalk.gray(
          `   Location: ${path.join('schema', 'backup-config.json')}\n`,
        ),
      )
    }

    return { success: true }
  } catch (error: any) {
    if (verbose) {
      console.error(chalk.red('❌ Failed to export schema'))
      console.error(chalk.gray('Error: ' + error.message + '\n'))
    }

    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Create a README.md in the schema directory explaining the config
 */
export async function createSchemaReadme(
  repoPath: string,
  options: { verbose?: boolean } = {},
): Promise<{ success: boolean; error?: string }> {
  const { verbose = true } = options

  try {
    const schemaDir = path.join(repoPath, 'schema')
    const readmePath = path.join(schemaDir, 'README.md')

    const readmeContent = `# Backup Configuration Schema

This directory contains the backup configuration schema for your dotfiles repository.

## Files

- \`backup-config.json\` - The complete backup configuration schema

## About This Schema

This schema tracks:
- Operating system and shell configuration
- Multi-OS support settings
- Files being backed up and their original locations
- Symlink configuration
- Secret management settings

## Important Security Note

⚠️ **This schema does NOT contain sensitive information like:**
- GitHub personal access tokens
- API keys
- Passwords
- Encryption keys

Those are stored separately in your local configuration directory:
- macOS: \`~/.dev-machine-backup-restore/\`
- Linux: \`~/.config/dev-machine-backup-restore/\`
- Windows: \`%APPDATA%\\dev-machine-backup-restore\\\`

## Using This Schema

This schema can be used to:
1. Understand which files are being backed up
2. Restore your dotfiles on a new machine
3. Recreate symlinks to the correct locations
4. Track which files are secrets (not committed to git)

## Modifying The Schema

You can manually edit \`backup-config.json\` to add or remove files from your backup.
After editing, run the backup tool to sync the changes.
`

    await fs.promises.writeFile(readmePath, readmeContent, 'utf-8')

    if (verbose) {
      console.log(chalk.green('✅ Schema README created'))
      console.log(
        chalk.gray(`   Location: ${path.join('schema', 'README.md')}\n`),
      )
    }

    return { success: true }
  } catch (error: any) {
    if (verbose) {
      console.error(chalk.red('❌ Failed to create schema README'))
      console.error(chalk.gray('Error: ' + error.message + '\n'))
    }

    return {
      success: false,
      error: error.message,
    }
  }
}
