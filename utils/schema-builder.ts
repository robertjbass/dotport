/**
 * Schema Builder Utility
 *
 * Constructs BackupConfig objects from setup wizard choices.
 * Provides a clean separation between interactive UI and data structure creation.
 */

import {
  BackupConfig,
  DEFAULT_BACKUP_CONFIG,
  TrackedFile,
  OperatingSystem as BackupOS,
} from '../types/backup-config'
import { getLinuxSystemMetadata } from './linux-detection'

/**
 * Operating system type from setup (matches setup.ts)
 */
export type SetupOperatingSystem = 'macOS' | 'linux' | 'windows' | 'other'

/**
 * Convert setup OS type to backup config OS type
 *
 * @param setupOS - OS type from setup wizard
 * @returns Normalized OS type for backup config
 */
export function convertOSType(setupOS: SetupOperatingSystem): BackupOS {
  if (setupOS === 'macOS') return 'macos'
  if (setupOS === 'linux') return 'linux'
  if (setupOS === 'windows') return 'windows'
  return 'linux' // Default fallback
}

/**
 * Detect shell from environment or common patterns
 *
 * @returns Detected shell type
 */
export function detectShell(): 'bash' | 'zsh' | 'fish' | 'other' {
  const shell = process.env.SHELL || ''

  if (shell.includes('zsh')) return 'zsh'
  if (shell.includes('bash')) return 'bash'
  if (shell.includes('fish')) return 'fish'

  return 'other'
}

/**
 * Get shell config file based on detected shell
 *
 * @param shell - Shell type
 * @returns Path to shell config file
 */
export function getShellConfigFile(
  shell: 'bash' | 'zsh' | 'fish' | 'other',
): string {
  const configMap: Record<string, string> = {
    zsh: '.zshrc',
    bash: '.bashrc',
    fish: '~/.config/fish/config.fish',
    other: '.profile',
  }

  return configMap[shell]
}

/**
 * Build a complete BackupConfig from setup wizard data
 *
 * @param options - Configuration options from setup wizard
 * @param existingConfig - Optional existing config to merge with (for multi-OS support)
 * @returns Complete BackupConfig object
 */
export function buildBackupConfig(
  options: {
    // Operating system
    os: SetupOperatingSystem

    // Multi-OS support
    multiOS: boolean
    supportedDistros?: string[]

    // Repository configuration
    repoType: 'github' | 'gitlab' | 'bitbucket' | 'other-git' | 'none'
    repoName?: string
    repoUrl?: string
    repoOwner?: string
    repoVisibility?: 'public' | 'private'
    cloneLocation?: string
    branch?: string

    // Files to track
    trackedFiles: TrackedFile[]

    // Optional overrides
    shell?: 'bash' | 'zsh' | 'fish' | 'other'
    shellConfigFile?: string
  },
  existingConfig?: BackupConfig,
): BackupConfig {
  const {
    os,
    multiOS,
    supportedDistros,
    repoType,
    repoName = 'dotfiles',
    repoUrl = '',
    repoOwner = '',
    repoVisibility = 'private',
    cloneLocation = '~',
    branch = 'main',
    trackedFiles,
    shell,
    shellConfigFile,
  } = options

  // Convert OS type
  const backupOS = convertOSType(os)

  // Detect shell if not provided
  const detectedShell = shell || detectShell()
  const configFile = shellConfigFile || getShellConfigFile(detectedShell)

  // Detect Linux-specific metadata if on Linux
  const linuxMetadata = backupOS === 'linux' ? getLinuxSystemMetadata() : undefined

  // Always use nested structure (OS folders like macos/, debian/, etc.)
  const structureType: 'flat' | 'nested' = 'nested'

  // Group tracked files by OS/distro
  const osOrDistro = backupOS === 'linux'
    ? (supportedDistros?.[0] || 'linux')
    : backupOS

  // Build directory structure for nested repos
  const directories: Record<string, string> = {
    [osOrDistro]: `${osOrDistro}/`
  }

  // Build the complete config
  const config: BackupConfig = {
    version: '1.0.0',

    system: {
      primary: backupOS,
      shell: detectedShell,
      shellConfigFile: configFile,
      // Add Linux-specific metadata if available
      ...(linuxMetadata && {
        displayServer: linuxMetadata.displayServer,
        desktopEnvironment: linuxMetadata.desktopEnvironment,
      }),
    },

    multiOS: {
      enabled: multiOS,
      supportedOS: [backupOS],
      linuxDistros: supportedDistros,
    },

    dotfiles: {
      enabled: repoType !== 'none',
      repoType,
      repoName,
      repoUrl,
      repoOwner,
      branch,
      visibility: repoVisibility,
      structure: {
        type: structureType,
        directories,
      },
      trackedFiles: {
        [osOrDistro]: {
          cloneLocation,
          files: trackedFiles,
        },
      },
    },

    secrets: DEFAULT_BACKUP_CONFIG.secrets || {
      enabled: false,
      secretFile: {
        name: '.env.sh',
        location: '~',
        format: 'shell-export',
      },
      storage: {
        type: 'local-only',
      },
      trackedSecrets: {},
    },

    symlinks: DEFAULT_BACKUP_CONFIG.symlinks || {
      enabled: false,
      strategy: 'direct',
      conflictResolution: 'backup',
    },

    packages: DEFAULT_BACKUP_CONFIG.packages || {
      enabled: false,
      packageManagers: {},
    },

    applications: DEFAULT_BACKUP_CONFIG.applications || {
      enabled: false,
      applications: {},
    },

    extensions: DEFAULT_BACKUP_CONFIG.extensions || {
      enabled: false,
      editors: {},
    },

    services: DEFAULT_BACKUP_CONFIG.services || {
      enabled: false,
      services: {},
    },

    settings: DEFAULT_BACKUP_CONFIG.settings || {
      enabled: false,
      settings: {},
    },

    runtimes: DEFAULT_BACKUP_CONFIG.runtimes || {
      enabled: false,
      runtimes: {},
    },

    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }

  // If an existing config was provided, merge with it to preserve other OS data
  if (existingConfig) {
    return mergeBackupConfig(existingConfig, config)
  }

  return config
}

/**
 * Update an existing BackupConfig with new data
 *
 * @param existing - Existing BackupConfig
 * @param updates - Partial updates to apply
 * @returns Updated BackupConfig
 */
export function updateBackupConfig(
  existing: BackupConfig,
  updates: Partial<BackupConfig>,
): BackupConfig {
  return {
    ...existing,
    ...updates,
    metadata: {
      ...existing.metadata,
      updatedAt: new Date().toISOString(),
    },
  }
}

/**
 * Merge a new BackupConfig with an existing one, preserving data from other OSes
 *
 * This is critical for multi-OS support - when running the backup script on a
 * different OS, we need to ADD that OS's data, not REPLACE the entire config.
 *
 * @param existing - Existing BackupConfig (e.g., from macOS)
 * @param newConfig - New BackupConfig (e.g., from Debian)
 * @returns Merged BackupConfig with data from both OSes
 */
export function mergeBackupConfig(
  existing: BackupConfig,
  newConfig: BackupConfig,
): BackupConfig {
  // Merge supportedOS arrays (deduplicate)
  const supportedOSSet = new Set([
    ...(existing.multiOS.supportedOS || []),
    ...(newConfig.multiOS.supportedOS || []),
  ])

  // Merge linuxDistros arrays (deduplicate)
  const linuxDistrosSet = new Set([
    ...(existing.multiOS.linuxDistros || []),
    ...(newConfig.multiOS.linuxDistros || []),
  ])

  // Merge structure directories
  const mergedDirectories = {
    ...existing.dotfiles.structure.directories,
    ...newConfig.dotfiles.structure.directories,
  }

  // Merge trackedFiles for all OSes
  const mergedTrackedFiles = {
    ...existing.dotfiles.trackedFiles,
    ...newConfig.dotfiles.trackedFiles,
  }

  // Merge package managers for all OSes
  const mergedPackageManagers = {
    ...existing.packages.packageManagers,
    ...newConfig.packages.packageManagers,
  }

  // Merge applications for all OSes
  const mergedApplications = {
    ...existing.applications?.applications,
    ...newConfig.applications?.applications,
  }

  // Merge extensions for all OSes
  const mergedExtensions = {
    ...existing.extensions?.editors,
    ...newConfig.extensions?.editors,
  }

  // Merge runtimes for all OSes
  const mergedRuntimes = {
    ...existing.runtimes?.runtimes,
    ...newConfig.runtimes?.runtimes,
  }

  return {
    ...existing,
    version: newConfig.version,

    // Keep system info from the current run
    system: newConfig.system,

    // Merge multi-OS configuration
    multiOS: {
      enabled: true, // Always true when merging
      supportedOS: Array.from(supportedOSSet),
      linuxDistros: linuxDistrosSet.size > 0 ? Array.from(linuxDistrosSet) : undefined,
    },

    // Merge dotfiles configuration
    dotfiles: {
      ...existing.dotfiles,
      ...newConfig.dotfiles,
      structure: {
        type: 'nested', // Always nested for multi-OS
        directories: mergedDirectories,
      },
      trackedFiles: mergedTrackedFiles,
    },

    // Merge packages
    packages: {
      enabled: existing.packages.enabled || newConfig.packages.enabled,
      packageManagers: mergedPackageManagers,
    },

    // Merge applications
    applications: {
      enabled: existing.applications?.enabled || newConfig.applications?.enabled || false,
      applications: mergedApplications,
    },

    // Merge extensions
    extensions: {
      enabled: existing.extensions?.enabled || newConfig.extensions?.enabled || false,
      editors: mergedExtensions,
    },

    // Merge runtimes
    runtimes: {
      enabled: existing.runtimes?.enabled || newConfig.runtimes?.enabled || false,
      runtimes: mergedRuntimes,
    },

    // Keep secrets from existing (shouldn't change per OS)
    secrets: existing.secrets,

    // Keep symlinks from existing (can be overridden if needed)
    symlinks: existing.symlinks,

    // Keep services from existing
    services: existing.services,

    // Keep settings from existing
    settings: existing.settings,

    // Update metadata
    metadata: {
      createdAt: existing.metadata?.createdAt || newConfig.metadata?.createdAt,
      updatedAt: new Date().toISOString(),
    },
  }
}

/**
 * Add tracked files to a specific OS/distro in the config
 *
 * @param config - Existing BackupConfig
 * @param osOrDistro - OS or distro identifier
 * @param files - Files to add
 * @returns Updated BackupConfig
 */
export function addTrackedFiles(
  config: BackupConfig,
  osOrDistro: string,
  files: TrackedFile[],
): BackupConfig {
  const existingData = config.dotfiles.trackedFiles[osOrDistro]
  const existingFiles = existingData?.files || []
  const existingCloneLocation = existingData?.cloneLocation || '~'

  // Merge files, avoiding duplicates based on sourcePath
  const existingPaths = new Set(existingFiles.map((f) => f.sourcePath))
  const newFiles = files.filter((f) => !existingPaths.has(f.sourcePath))

  return {
    ...config,
    dotfiles: {
      ...config.dotfiles,
      trackedFiles: {
        ...config.dotfiles.trackedFiles,
        [osOrDistro]: {
          cloneLocation: existingCloneLocation,
          files: [...existingFiles, ...newFiles],
        },
      },
    },
    metadata: {
      ...config.metadata,
      updatedAt: new Date().toISOString(),
    },
  }
}

/**
 * Remove tracked files from a specific OS/distro in the config
 *
 * @param config - Existing BackupConfig
 * @param osOrDistro - OS or distro identifier
 * @param filePaths - Source paths of files to remove
 * @returns Updated BackupConfig
 */
export function removeTrackedFiles(
  config: BackupConfig,
  osOrDistro: string,
  filePaths: string[],
): BackupConfig {
  const existingData = config.dotfiles.trackedFiles[osOrDistro]
  const existingFiles = existingData?.files || []
  const existingCloneLocation = existingData?.cloneLocation || '~'
  const pathsToRemove = new Set(filePaths)

  const updatedFiles = existingFiles.filter(
    (f) => !pathsToRemove.has(f.sourcePath),
  )

  return {
    ...config,
    dotfiles: {
      ...config.dotfiles,
      trackedFiles: {
        ...config.dotfiles.trackedFiles,
        [osOrDistro]: {
          cloneLocation: existingCloneLocation,
          files: updatedFiles,
        },
      },
    },
    metadata: {
      ...config.metadata,
      updatedAt: new Date().toISOString(),
    },
  }
}

/**
 * Get the OS/distro identifier for file organization
 *
 * @param os - Operating system type
 * @param distro - Linux distribution (if applicable)
 * @returns Identifier string for organizing files
 */
export function getOSDistroIdentifier(
  os: BackupOS,
  distro?: string,
): string {
  if (os === 'macos') return 'macos'
  if (os === 'linux' && distro) return distro
  if (os === 'linux') return 'linux'
  return 'windows'
}
