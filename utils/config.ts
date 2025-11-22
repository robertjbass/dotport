/**
 * Configuration management - handles loading/saving tool configuration
 */

import fs from 'fs'
import path from 'path'
import os from 'os'

export type AppConfig = {
  version: string
  paths: {
    dataDir: string
    githubAuth: string
    backupConfig: string
    cache: string
  }
  preferences: {
    autoRefreshTokens: boolean
    verbose: boolean
  }
  platform: {
    os: 'darwin' | 'linux' | 'windows' | 'other'
    homeDir: string
  }
}

function getDefaultConfig(): AppConfig {
  const homeDir = os.homedir()
  const platform = os.platform()

  let osType: AppConfig['platform']['os'] = 'other'
  if (platform === 'darwin') osType = 'darwin'
  else if (platform === 'linux') osType = 'linux'
  else if (platform === 'win32') osType = 'windows'

  let dataDir: string
  if (osType === 'windows') {
    dataDir = path.join(
      process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'),
      'dev-machine-backup-restore',
    )
  } else if (osType === 'darwin') {
    dataDir = path.join(homeDir, '.dev-machine-backup-restore')
  } else {
    dataDir = path.join(homeDir, '.config', 'dev-machine-backup-restore')
  }

  return {
    version: '1.0.0',
    paths: {
      dataDir,
      githubAuth: path.join(dataDir, 'github-auth.json'),
      backupConfig: path.join(dataDir, 'backup-config.json'),
      cache: path.join(dataDir, 'cache'),
    },
    preferences: {
      autoRefreshTokens: false,
      verbose: false,
    },
    platform: {
      os: osType,
      homeDir,
    },
  }
}

let configInstance: AppConfig | null = null

export function getConfig(): AppConfig {
  if (configInstance) return configInstance

  const defaultConfig = getDefaultConfig()
  const configPath = path.join(defaultConfig.paths.dataDir, 'config.json')

  if (fs.existsSync(configPath)) {
    try {
      const fileContent = fs.readFileSync(configPath, 'utf-8')
      const loadedConfig = JSON.parse(fileContent) as Partial<AppConfig>

      configInstance = {
        ...defaultConfig,
        ...loadedConfig,
        paths: { ...defaultConfig.paths, ...loadedConfig.paths },
        preferences: { ...defaultConfig.preferences, ...loadedConfig.preferences },
        platform: { ...defaultConfig.platform, ...loadedConfig.platform },
      }
    } catch {
      configInstance = defaultConfig
    }
  } else {
    configInstance = defaultConfig
  }

  return configInstance
}

export function saveConfig(config?: AppConfig): void {
  const currentConfig = config || getConfig()
  const configPath = path.join(currentConfig.paths.dataDir, 'config.json')

  if (!fs.existsSync(currentConfig.paths.dataDir)) {
    fs.mkdirSync(currentConfig.paths.dataDir, { recursive: true, mode: 0o700 })
  }

  fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), {
    mode: 0o600,
  })

  configInstance = currentConfig
}

export function updateConfig(updates: Partial<AppConfig>): AppConfig {
  const currentConfig = getConfig()
  const updatedConfig: AppConfig = {
    ...currentConfig,
    ...updates,
    paths: { ...currentConfig.paths, ...updates.paths },
    preferences: { ...currentConfig.preferences, ...updates.preferences },
    platform: { ...currentConfig.platform, ...updates.platform },
  }

  saveConfig(updatedConfig)
  return updatedConfig
}

export function resetConfig(): AppConfig {
  const defaultConfig = getDefaultConfig()
  saveConfig(defaultConfig)
  return defaultConfig
}

export function getConfigPath(): string {
  const config = getConfig()
  return path.join(config.paths.dataDir, 'config.json')
}

export function ensureDirectories(): void {
  const config = getConfig()

  if (!fs.existsSync(config.paths.dataDir)) {
    fs.mkdirSync(config.paths.dataDir, { recursive: true, mode: 0o700 })
  }

  if (!fs.existsSync(config.paths.cache)) {
    fs.mkdirSync(config.paths.cache, { recursive: true, mode: 0o700 })
  }
}
