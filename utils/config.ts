/**
 * Configuration management for dev-machine-backup-restore
 *
 * Handles loading and saving tool configuration including:
 * - Storage locations for auth tokens, backups, etc.
 * - User preferences
 * - Platform-specific paths
 */

import fs from 'fs'
import path from 'path'
import os from 'os'

export interface AppConfig {
  version: string
  paths: {
    // Root directory for all tool data
    dataDir: string
    // GitHub authentication token
    githubAuth: string
    // Backup configuration
    backupConfig: string
    // Cache directory
    cache: string
  }
  preferences: {
    // Auto-update tokens before expiration
    autoRefreshTokens: boolean
    // Show verbose output
    verbose: boolean
  }
  platform: {
    os: 'darwin' | 'linux' | 'windows' | 'other'
    homeDir: string
  }
}

/**
 * Get default configuration based on platform
 */
function getDefaultConfig(): AppConfig {
  const homeDir = os.homedir()
  const platform = os.platform()

  // Determine OS type
  let osType: AppConfig['platform']['os'] = 'other'
  if (platform === 'darwin') osType = 'darwin'
  else if (platform === 'linux') osType = 'linux'
  else if (platform === 'win32') osType = 'windows'

  // Platform-specific data directory
  let dataDir: string
  if (osType === 'windows') {
    // Windows: %APPDATA%\dev-machine-backup-restore
    dataDir = path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'dev-machine-backup-restore')
  } else if (osType === 'darwin') {
    // macOS: ~/.dev-machine-backup-restore
    dataDir = path.join(homeDir, '.dev-machine-backup-restore')
  } else {
    // Linux: ~/.config/dev-machine-backup-restore
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

// Singleton instance
let configInstance: AppConfig | null = null

/**
 * Get the application configuration
 * Loads from file if exists, otherwise returns defaults
 */
export function getConfig(): AppConfig {
  if (configInstance) {
    return configInstance
  }

  const defaultConfig = getDefaultConfig()
  const configPath = path.join(defaultConfig.paths.dataDir, 'config.json')

  // Try to load existing config
  if (fs.existsSync(configPath)) {
    try {
      const fileContent = fs.readFileSync(configPath, 'utf-8')
      const loadedConfig = JSON.parse(fileContent) as Partial<AppConfig>

      // Merge with defaults to handle version upgrades
      configInstance = {
        ...defaultConfig,
        ...loadedConfig,
        paths: {
          ...defaultConfig.paths,
          ...loadedConfig.paths,
        },
        preferences: {
          ...defaultConfig.preferences,
          ...loadedConfig.preferences,
        },
        platform: {
          ...defaultConfig.platform,
          ...loadedConfig.platform,
        },
      }
    } catch (error) {
      console.error('Failed to load config, using defaults:', error)
      configInstance = defaultConfig
    }
  } else {
    configInstance = defaultConfig
  }

  return configInstance
}

/**
 * Save the current configuration to disk
 */
export function saveConfig(config?: AppConfig): void {
  const currentConfig = config || getConfig()
  const configPath = path.join(currentConfig.paths.dataDir, 'config.json')

  // Ensure data directory exists
  if (!fs.existsSync(currentConfig.paths.dataDir)) {
    fs.mkdirSync(currentConfig.paths.dataDir, { recursive: true, mode: 0o700 })
  }

  // Save config
  fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), {
    mode: 0o600,
  })

  // Update singleton
  configInstance = currentConfig
}

/**
 * Update specific configuration values
 */
export function updateConfig(updates: Partial<AppConfig>): AppConfig {
  const currentConfig = getConfig()
  const updatedConfig: AppConfig = {
    ...currentConfig,
    ...updates,
    paths: {
      ...currentConfig.paths,
      ...updates.paths,
    },
    preferences: {
      ...currentConfig.preferences,
      ...updates.preferences,
    },
    platform: {
      ...currentConfig.platform,
      ...updates.platform,
    },
  }

  saveConfig(updatedConfig)
  return updatedConfig
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): AppConfig {
  const defaultConfig = getDefaultConfig()
  saveConfig(defaultConfig)
  return defaultConfig
}

/**
 * Get the path to the configuration file
 */
export function getConfigPath(): string {
  const config = getConfig()
  return path.join(config.paths.dataDir, 'config.json')
}

/**
 * Ensure all required directories exist
 */
export function ensureDirectories(): void {
  const config = getConfig()

  // Create data directory
  if (!fs.existsSync(config.paths.dataDir)) {
    fs.mkdirSync(config.paths.dataDir, { recursive: true, mode: 0o700 })
  }

  // Create cache directory
  if (!fs.existsSync(config.paths.cache)) {
    fs.mkdirSync(config.paths.cache, { recursive: true, mode: 0o700 })
  }
}
