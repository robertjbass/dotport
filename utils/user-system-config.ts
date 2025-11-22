/**
 * User System Config - reads/writes ~/.dotport/config/user-system.json
 */

import fs from 'fs'
import { USER_SYSTEM_CONFIG_FILE } from '../constants/app-config'
import { expandTilde } from './path-helpers'
import { createDefaultUserSystemConfig } from '../types/user-system-config'
import { ensureDotPortDirectories } from './directory-manager'
import type { UserSystemConfig } from '../types/user-system-config'

export function readUserSystemConfig(): UserSystemConfig | null {
  const configPath = expandTilde(`~/${USER_SYSTEM_CONFIG_FILE}`)

  if (!fs.existsSync(configPath)) return null

  try {
    const content = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(content) as UserSystemConfig
  } catch {
    return null
  }
}

export function writeUserSystemConfig(config: UserSystemConfig): void {
  ensureDotPortDirectories()

  const configPath = expandTilde(`~/${USER_SYSTEM_CONFIG_FILE}`)
  config.metadata.updatedAt = new Date().toISOString()

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

export function updateUserSystemConfig(
  partialConfig: Partial<UserSystemConfig>,
): UserSystemConfig {
  const existingConfig =
    readUserSystemConfig() || createDefaultUserSystemConfig()

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

export async function getOrCreateUserSystemConfig(): Promise<UserSystemConfig> {
  let config = readUserSystemConfig()

  if (!config) {
    config = createDefaultUserSystemConfig()
    writeUserSystemConfig(config)
  }

  return config
}

export function userSystemConfigExists(): boolean {
  const configPath = expandTilde(`~/${USER_SYSTEM_CONFIG_FILE}`)
  return fs.existsSync(configPath)
}

export function deleteUserSystemConfig(): void {
  const configPath = expandTilde(`~/${USER_SYSTEM_CONFIG_FILE}`)

  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath)
  }
}

export function validateUserSystemConfig(config: any): boolean {
  if (!config || typeof config !== 'object') return false
  if (!config.version || !config.metadata || !config.repo || !config.system)
    return false
  if (!config.metadata.createdAt || !config.metadata.updatedAt) return false
  if (
    !config.repo.repoType ||
    !config.repo.repoName ||
    !config.repo.branch ||
    !config.repo.visibility
  )
    return false
  if (
    !config.system.os ||
    !config.system.distro ||
    !config.system.nickname ||
    !config.system.shell ||
    !config.system.homeDirectory ||
    !config.system.localRepoPath
  )
    return false
  if (!config.system.runtimeData || !config.system.runtimeData.node)
    return false

  return true
}

export function updateSystemRuntimeData(runtimeData: {
  node: {
    packageManager: string
    versionManager: string
    version: string
  }
}): void {
  const config = readUserSystemConfig()
  if (!config) return

  config.system.runtimeData = runtimeData
  writeUserSystemConfig(config)
}

export function updateRepoInfo(repoInfo: {
  repoType?: string
  repoName?: string
  repoUrl?: string
  repoOwner?: string
  branch?: string
  visibility?: 'public' | 'private'
}): void {
  const config = readUserSystemConfig()
  if (!config) return

  config.repo = { ...config.repo, ...repoInfo } as any
  writeUserSystemConfig(config)
}
