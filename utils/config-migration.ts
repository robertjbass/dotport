/**
 * Configuration Migration Utility
 *
 * Handles migration from old config structure (~/.dev-machine-backup-restore)
 * to new structure (~/.dotport)
 */

import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { expandTilde } from './path-helpers'
import {
  LEGACY_ROOT_FOLDER,
  LEGACY_BACKUP_CONFIG_FILE,
  LEGACY_GITHUB_AUTH_FILE,
  SYSTEM_ROOT_FOLDER,
  USER_SYSTEM_CONFIG_FILE,
  GITHUB_AUTH_FILE,
} from '../constants/app-config'
import type {
  UserSystemConfig,
  GitHubAuthConfig,
} from '../types/user-system-config'
import { ensureDotPortDirectories } from './directory-manager'

/**
 * Check if legacy config exists
 */
export function legacyConfigExists(): boolean {
  const oldPath = expandTilde(`~/${LEGACY_ROOT_FOLDER}`)
  return fs.existsSync(oldPath)
}

/**
 * Check if new config exists
 */
export function newConfigExists(): boolean {
  const newPath = expandTilde(`~/${SYSTEM_ROOT_FOLDER}`)
  return fs.existsSync(newPath)
}

/**
 * Read old backup config
 */
function readOldBackupConfig(): any {
  const configPath = expandTilde(`~/${LEGACY_BACKUP_CONFIG_FILE}`)

  if (!fs.existsSync(configPath)) {
    return null
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.warn(
      chalk.yellow(`Warning: Could not read old backup config: ${error}`),
    )
    return null
  }
}

/**
 * Read old GitHub auth config
 */
function readOldGithubAuth(): any {
  const authPath = expandTilde(`~/${LEGACY_GITHUB_AUTH_FILE}`)

  if (!fs.existsSync(authPath)) {
    return null
  }

  try {
    const content = fs.readFileSync(authPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.warn(
      chalk.yellow(`Warning: Could not read old GitHub auth: ${error}`),
    )
    return null
  }
}

/**
 * Convert old backup config to new user system config format
 */
function convertBackupConfigToUserSystemConfig(
  oldConfig: any,
): UserSystemConfig {
  // Extract OS and convert to lowercase
  const os = oldConfig.os?.toLowerCase() || 'unknown'

  // Extract distro
  const distro = oldConfig.configFiles?.machineDistro || 'unknown'

  // Extract nickname
  const nickname = oldConfig.configFiles?.machineNickname || 'default'

  // Build machine ID
  const machineId = `${os}-${distro}-${nickname}`

  // Determine shell config file
  const shell = oldConfig.shell || 'bash'
  const shellConfigFile = shell === 'zsh' ? '.zshrc' : '.bashrc'

  return {
    version: '1.0.0',
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    repo: {
      repoType: oldConfig.configFiles?.service || 'none',
      repoName: oldConfig.configFiles?.repoName || 'dotfiles',
      repoUrl: oldConfig.configFiles?.gitRepoUrl || '',
      repoOwner: '', // Will be populated from GitHub auth if available
      branch: 'main',
      visibility: oldConfig.configFiles?.repoVisibility || 'private',
    },
    system: {
      os: os as any,
      distro,
      nickname,
      repoPath: machineId,
      shell: shell as any,
      shellConfigFile,
      homeDirectory: process.env.HOME || '~',
      localRepoPath: oldConfig.configFiles?.cloneLocation || '~/dotfiles',
      runtimeData: {
        node: {
          packageManager: 'npm', // Default, will be detected on next run
          versionManager: 'none',
          version: 'unknown',
        },
      },
    },
    secrets: oldConfig.secrets?.enabled
      ? {
          enabled: true,
          secretFile: {
            name: oldConfig.secrets.details?.secretFileName || '.env.sh',
            location: oldConfig.secrets.details?.secretFileLocation || '~',
            format:
              oldConfig.secrets.details?.localType?.includes('Shell') ||
              oldConfig.secrets.details?.localType?.includes('export')
                ? 'shell-export'
                : 'dotenv',
          },
          storage: {
            type: 'local-only',
          },
        }
      : undefined,
  }
}

/**
 * Convert old GitHub auth to new format
 */
function convertGithubAuth(oldAuth: any): GitHubAuthConfig {
  return {
    token: oldAuth.token || '',
    username: oldAuth.username || '',
    scopes: [], // Unknown from old format
    createdAt: new Date().toISOString(),
  }
}

/**
 * Write user system config to new location
 */
function writeUserSystemConfig(config: UserSystemConfig): void {
  const configPath = expandTilde(`~/${USER_SYSTEM_CONFIG_FILE}`)

  // Ensure parent directory exists
  const configDir = path.dirname(configPath)
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true, mode: 0o755 })
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

/**
 * Write GitHub auth config to new location
 */
function writeGithubAuthConfig(auth: GitHubAuthConfig): void {
  const authPath = expandTilde(`~/${GITHUB_AUTH_FILE}`)

  // Ensure parent directory exists
  const authDir = path.dirname(authPath)
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true, mode: 0o755 })
  }

  fs.writeFileSync(authPath, JSON.stringify(auth, null, 2), 'utf-8')
}

/**
 * Migrate from old config structure to new structure
 * This is the main migration function
 */
export async function migrateOldConfig(): Promise<boolean> {
  const oldPath = expandTilde(`~/${LEGACY_ROOT_FOLDER}`)
  const newPath = expandTilde(`~/${SYSTEM_ROOT_FOLDER}`)

  // Check if old config exists
  if (!fs.existsSync(oldPath)) {
    return false // Nothing to migrate
  }

  // Check if new config already exists
  if (fs.existsSync(newPath)) {
    console.log(
      chalk.yellow(
        'New config structure already exists. Skipping migration to avoid overwriting.',
      ),
    )
    return false
  }

  console.log(chalk.cyan('🔄 Migrating configuration to new structure...'))

  try {
    // Read old configs
    const oldBackupConfig = readOldBackupConfig()
    const oldGithubAuth = readOldGithubAuth()

    // Create new directory structure
    ensureDotPortDirectories()

    // Convert and write new configs
    if (oldBackupConfig) {
      const newConfig = convertBackupConfigToUserSystemConfig(oldBackupConfig)

      // If we have GitHub auth, add the username to repo config
      if (oldGithubAuth && oldGithubAuth.username) {
        newConfig.repo.repoOwner = oldGithubAuth.username
      }

      writeUserSystemConfig(newConfig)
      console.log(
        chalk.green(`  ✓ Migrated backup config to ${USER_SYSTEM_CONFIG_FILE}`),
      )
    }

    if (oldGithubAuth) {
      const newAuth = convertGithubAuth(oldGithubAuth)
      writeGithubAuthConfig(newAuth)
      console.log(
        chalk.green(`  ✓ Migrated GitHub auth to ${GITHUB_AUTH_FILE}`),
      )
    }

    console.log(chalk.green('\n✓ Migration complete!'))
    console.log(chalk.gray(`  Old config: ${oldPath}`))
    console.log(chalk.gray(`  New config: ${newPath}`))
    console.log(chalk.gray('\nYou can safely delete the old config directory:'))
    console.log(chalk.white(`  rm -rf ${oldPath}\n`))

    return true
  } catch (error: any) {
    console.error(chalk.red('\n❌ Migration failed:'), error.message)
    return false
  }
}

/**
 * Check if migration is needed and perform it if necessary
 * Returns true if migration was performed or if already using new structure
 */
export async function checkAndMigrateIfNeeded(): Promise<boolean> {
  const hasLegacy = legacyConfigExists()
  const hasNew = newConfigExists()

  if (!hasLegacy && !hasNew) {
    // Fresh install, no migration needed
    return true
  }

  if (hasNew) {
    // Already using new structure
    return true
  }

  if (hasLegacy && !hasNew) {
    // Needs migration
    return await migrateOldConfig()
  }

  return true
}
