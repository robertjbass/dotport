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
 * If a schema already exists in the repo (e.g., from another machine), this will
 * merge the new config with the existing one to preserve multi-machine support.
 *
 * Schema is now exported to: schema.json (in repo root)
 * This is a change from the old location: schema/backup-config.json
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

    // New schema location: schema.json in repo root
    const schemaPath = path.join(repoPath, 'schema.json')

    // Check if schema already exists (multi-machine support)
    let finalConfig = config
    try {
      const existingSchemaContent = await fs.promises.readFile(schemaPath, 'utf-8')
      const existingConfig = JSON.parse(existingSchemaContent) as BackupConfig

      if (verbose) {
        console.log(chalk.yellow('📋 Found existing schema - merging configurations...'))
      }

      // Merge the new config with existing to preserve other machine data
      finalConfig = mergeBackupConfig(existingConfig, config)

      if (verbose) {
        console.log(chalk.green('✅ Configurations merged successfully'))
        const machineCount = finalConfig.systems.length
        const machineList = finalConfig.systems.map(s => s.repoPath).join(', ')
        console.log(
          chalk.gray(
            `   Machines: ${machineCount} (${machineList})\n`,
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
          `   Location: schema.json\n`,
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
 * Create a README.md in the repo root explaining the schema
 */
export async function createSchemaReadme(
  repoPath: string,
  options: { verbose?: boolean } = {},
): Promise<{ success: boolean; error?: string }> {
  const { verbose = true } = options

  try {
    const readmePath = path.join(repoPath, 'SCHEMA.md')

    const readmeContent = `# Backup Configuration Schema

This repository contains a backup configuration schema in \`schema.json\`.

## About This Schema

This schema tracks:
- Repository metadata (repo URL, branch, visibility)
- System information for each machine (OS, distro, nickname, shell)
- Files being backed up and their original locations
- Symlink configuration
- Secret management settings
- Package managers and installed packages
- Editor extensions and settings
- System services, settings, and runtimes

## Schema Structure

\`\`\`json
{
  "version": "1.0.0",
  "metadata": {
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "repo": {
    "repoType": "github",
    "repoName": "dotfiles",
    "repoUrl": "https://github.com/username/dotfiles",
    "repoOwner": "username",
    "branch": "main",
    "visibility": "private"
  },
  "systems": [
    {
      "os": "macos",
      "distro": "darwin",
      "nickname": "macbook-air-m2",
      "repoPath": "macos-darwin-macbook-air-m2",
      "shell": "zsh",
      "shellConfigFile": ".zshrc"
    }
  ],
  "dotfiles": {
    "macos-darwin-macbook-air-m2": {
      "tracked-files": { ... },
      "secrets": { ... },
      "symlinks": { ... },
      "packages": { ... },
      "applications": { ... },
      "extensions": { ... },
      "services": { ... },
      "settings": { ... },
      "runtimes": { ... }
    }
  }
}
\`\`\`

## Multi-Machine Support

The schema supports multiple machines. Each machine has:
- An entry in the \`systems\` array
- A corresponding directory in the repo (named by \`repoPath\`)
- Complete configuration under \`dotfiles[repoPath]\`

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
5. Install packages and extensions

## Modifying The Schema

You can manually edit \`schema.json\` to add or remove files from your backup.
After editing, run the backup tool to sync the changes.
`

    await fs.promises.writeFile(readmePath, readmeContent, 'utf-8')

    if (verbose) {
      console.log(chalk.green('✅ Schema documentation created'))
      console.log(
        chalk.gray(`   Location: SCHEMA.md\n`),
      )
    }

    return { success: true }
  } catch (error: any) {
    if (verbose) {
      console.error(chalk.red('❌ Failed to create schema documentation'))
      console.error(chalk.gray('Error: ' + error.message + '\n'))
    }

    return {
      success: false,
      error: error.message,
    }
  }
}
