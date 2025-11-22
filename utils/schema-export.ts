/**
 * Schema Export - exports backup configuration to the dotfiles repository
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'
import { BackupConfig } from '../types/backup-config'
import { mergeBackupConfig } from './schema-builder'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function sanitizeConfig(config: BackupConfig): BackupConfig {
  // Create a deep copy
  const sanitized = JSON.parse(JSON.stringify(config)) as BackupConfig

  // Remove sensitive fields
  // Note: The config file itself (which contains GitHub token) is stored separately
  // in the user's local config directory, NOT in the dotfiles repo

  return sanitized
}

// If a schema already exists (from another machine), merges with it
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
      const existingSchemaContent = await fs.promises.readFile(
        schemaPath,
        'utf-8',
      )
      const existingConfig = JSON.parse(existingSchemaContent) as BackupConfig

      if (verbose) {
        console.log(
          chalk.yellow('📋 Found existing schema - merging configurations...'),
        )
      }

      // Merge the new config with existing to preserve other machine data
      finalConfig = mergeBackupConfig(existingConfig, config)

      if (verbose) {
        console.log(chalk.green('✅ Configurations merged successfully'))
        const machineCount = finalConfig.systems.length
        const machineList = finalConfig.systems
          .map((s) => s.repoPath)
          .join(', ')
        console.log(
          chalk.gray(`   Machines: ${machineCount} (${machineList})\n`),
        )
      }
    } catch (error: any) {
      // No existing schema or read error - use new config as-is
      if (error.code !== 'ENOENT') {
        console.log(
          chalk.yellow(`⚠️  Could not read existing schema: ${error.message}`),
        )
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
      console.log(chalk.gray(`   Location: schema.json\n`))
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
    const templatePath = path.join(__dirname, '..', 'templates', 'SCHEMA.md')
    const readmeContent = await fs.promises.readFile(templatePath, 'utf-8')

    await fs.promises.writeFile(readmePath, readmeContent, 'utf-8')

    if (verbose) {
      console.log(chalk.green('✅ Schema documentation created'))
      console.log(chalk.gray(`   Location: SCHEMA.md\n`))
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
