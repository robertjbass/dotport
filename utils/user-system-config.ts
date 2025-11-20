/**
 * User System Config Utility
 *
 * Handles reading, writing, and updating the user system configuration
 * stored at ~/.dotport/config/user-system.json
 */

import fs from 'fs'
import path from 'path'
import { USER_SYSTEM_CONFIG_FILE } from '../constants/app-config'
import { expandTilde } from './path-helpers'
import type { UserSystemConfig } from '../types/user-system-config'
import { createDefaultUserSystemConfig } from '../types/user-system-config'
import { ensureDotPortDirectories } from './directory-manager'
import { checkAndMigrateIfNeeded } from './config-migration'

/**
 * Read user system config from disk
 * Returns null if config doesn't exist
 */
export function readUserSystemConfig(): UserSystemConfig | null {
  const configPath = expandTilde(`~/${USER_SYSTEM_CONFIG_FILE}`)

  if (!fs.existsSync(configPath)) {
    return null
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(content) as UserSystemConfig
  } catch (error) {
    console.error(`Error reading user system config: ${error}`)
    return null
  }
}

/**
 * Write user system config to disk
 */
export function writeUserSystemConfig(config: UserSystemConfig): void {
  // Ensure directory structure exists
  ensureDotPortDirectories()

  const configPath = expandTilde(`~/${USER_SYSTEM_CONFIG_FILE}`)

  // Update the updatedAt timestamp
  config.metadata.updatedAt = new Date().toISOString()

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

/**
 * Update user system config with partial data
 * Merges the provided partial config with existing config
 */
export function updateUserSystemConfig(
  partialConfig: Partial<UserSystemConfig>
): UserSystemConfig {
  const existingConfig = readUserSystemConfig() || createDefaultUserSystemConfig()

  const updatedConfig: UserSystemConfig = {
    ...existingConfig,
    ...partialConfig,
    metadata: {
      ...existingConfig.metadata,
      ...partialConfig.metadata,
      updatedAt: new Date().toISOString(),
    },
  }

  writeUserSystemConfig(updatedConfig)
  return updatedConfig
}

/**
 * Get or create user system config
 * Returns existing config if it exists, otherwise creates and returns default
 */
export async function getOrCreateUserSystemConfig(): Promise<UserSystemConfig> {
  // Check if migration is needed first
  await checkAndMigrateIfNeeded()

  // Try to read existing config
  let config = readUserSystemConfig()

  if (!config) {
    // Create default config
    config = createDefaultUserSystemConfig()
    writeUserSystemConfig(config)
  }

  return config
}

/**
 * Check if user system config exists
 */
export function userSystemConfigExists(): boolean {
  const configPath = expandTilde(`~/${USER_SYSTEM_CONFIG_FILE}`)
  return fs.existsSync(configPath)
}

/**
 * Delete user system config
 * Use with caution!
 */
export function deleteUserSystemConfig(): void {
  const configPath = expandTilde(`~/${USER_SYSTEM_CONFIG_FILE}`)

  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath)
  }
}

/**
 * Validate user system config structure
 * Returns true if valid, false otherwise
 */
export function validateUserSystemConfig(config: any): boolean {
  if (!config || typeof config !== 'object') {
    return false
  }

  // Check required top-level fields
  if (!config.version || !config.metadata || !config.repo || !config.system) {
    return false
  }

  // Check metadata fields
  if (!config.metadata.createdAt || !config.metadata.updatedAt) {
    return false
  }

  // Check repo fields
  if (
    !config.repo.repoType ||
    !config.repo.repoName ||
    !config.repo.branch ||
    !config.repo.visibility
  ) {
    return false
  }

  // Check system fields
  if (
    !config.system.os ||
    !config.system.distro ||
    !config.system.nickname ||
    !config.system.shell ||
    !config.system.homeDirectory ||
    !config.system.localRepoPath
  ) {
    return false
  }

  // Check runtime data
  if (!config.system.runtimeData || !config.system.runtimeData.node) {
    return false
  }

  return true
}

/**
 * Update system runtime data in config
 */
export function updateSystemRuntimeData(runtimeData: {
  node: {
    packageManager: string
    versionManager: string
    version: string
  }
}): void {
  const config = readUserSystemConfig()

  if (!config) {
    return
  }

  config.system.runtimeData = runtimeData
  writeUserSystemConfig(config)
}

/**
 * Update repo information in config
 */
export function updateRepoInfo(repoInfo: {
  repoType?: string
  repoName?: string
  repoUrl?: string
  repoOwner?: string
  branch?: string
  visibility?: 'public' | 'private'
}): void {
  const config = readUserSystemConfig()

  if (!config) {
    return
  }

  config.repo = {
    ...config.repo,
    ...repoInfo,
  } as any

  writeUserSystemConfig(config)
}
