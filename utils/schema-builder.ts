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
  SystemMetadata,
  MachineConfig,
  createDefaultMachineConfig,
  getMachineId,
} from '../types/backup-config'
import { getLinuxSystemMetadata } from './linux-detection'

/**
 * Operating system type from setup (matches setup.ts)
 */
export type SetupOperatingSystem = 'macOS' | 'linux' | 'windows' | 'other'

/**
 * Convert setup OS type to backup config OS type
 */
export function convertOSType(setupOS: SetupOperatingSystem): BackupOS {
  if (setupOS === 'macOS') return 'macos'
  if (setupOS === 'linux') return 'linux'
  if (setupOS === 'windows') return 'windows'
  return 'linux' // Default fallback
}

/**
 * Detect shell from environment or common patterns
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
 * @param existingConfig - Optional existing config to merge with (for multi-machine support)
 * @returns Complete BackupConfig object
 */
export function buildBackupConfig(
  options: {
    // Operating system
    os: SetupOperatingSystem

    // Machine nickname (e.g., 'macbook-air', 'thinkpad', 'aws-linux')
    nickname: string

    // Distro (for Linux) or 'darwin' for macOS
    distro?: string

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

    // System info (synced from user-system.json)
    homeDirectory?: string
    localRepoPath?: string
    runtimeData?: {
      node: {
        packageManager: string
        versionManager: string
        version: string
      }
    }
  },
  existingConfig?: BackupConfig,
): BackupConfig {
  const {
    os,
    nickname,
    distro: providedDistro,
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
    homeDirectory,
    localRepoPath,
    runtimeData,
  } = options

  // Convert OS type
  const backupOS = convertOSType(os)

  // Detect shell if not provided
  const detectedShell = shell || detectShell()
  const configFile = shellConfigFile || getShellConfigFile(detectedShell)

  // Detect Linux-specific metadata if on Linux
  const linuxMetadata =
    backupOS === 'linux' ? getLinuxSystemMetadata() : undefined

  // Determine distro
  const distro = providedDistro || (backupOS === 'linux' ? 'unknown' : 'darwin') // Always use 'darwin' for macOS

  // Build machine ID using naming convention: <os>-<distro>-<nickname>
  const machineId = getMachineId(backupOS, distro, nickname)

  // Create system metadata for this machine
  const systemMetadata: SystemMetadata = {
    os: backupOS,
    distro,
    nickname,
    repoPath: machineId,
    shell: detectedShell,
    shellConfigFile: configFile,
    // Add system paths and runtime info if available
    ...(homeDirectory && { homeDirectory }),
    ...(localRepoPath && { localRepoPath }),
    ...(runtimeData && { runtimeData }),
    // Add Linux-specific metadata if available
    ...(linuxMetadata && {
      displayServer: linuxMetadata.displayServer,
      desktopEnvironment: linuxMetadata.desktopEnvironment,
    }),
  }

  // Create machine-specific configuration
  const machineConfig: MachineConfig = {
    ...createDefaultMachineConfig(),
    'tracked-files': {
      cloneLocation,
      files: trackedFiles,
    },
  }

  // If an existing config was provided, merge with it
  if (existingConfig) {
    return mergeBackupConfig(existingConfig, {
      version: '1.0.0',
      metadata: {
        createdAt:
          existingConfig.metadata?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      repo: {
        repoType,
        repoName,
        repoUrl,
        repoOwner,
        branch,
        visibility: repoVisibility,
      },
      systems: [systemMetadata],
      dotfiles: {
        [machineId]: machineConfig,
      },
    })
  }

  // Build the complete config
  const config: BackupConfig = {
    version: '1.0.0',
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    repo: {
      repoType,
      repoName,
      repoUrl,
      repoOwner,
      branch,
      visibility: repoVisibility,
    },
    systems: [systemMetadata],
    dotfiles: {
      [machineId]: machineConfig,
    },
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
      ...updates.metadata,
      updatedAt: new Date().toISOString(),
    },
  }
}

/**
 * Merge a new BackupConfig with an existing one, preserving data from other machines
 *
 * This is critical for multi-machine support - when running the backup script on a
 * different machine, we need to ADD that machine's data, not REPLACE the entire config.
 *
 * @param existing - Existing BackupConfig (e.g., from macOS)
 * @param newConfig - New BackupConfig (e.g., from Debian)
 * @returns Merged BackupConfig with data from both machines
 */
export function mergeBackupConfig(
  existing: BackupConfig,
  newConfig: BackupConfig,
): BackupConfig {
  // Merge systems array (deduplicate by repoPath)
  const existingSystemsMap = new Map(
    existing.systems.map((s) => [s.repoPath, s]),
  )
  newConfig.systems.forEach((s) => {
    existingSystemsMap.set(s.repoPath, s) // Overwrites if same machine
  })
  const mergedSystems = Array.from(existingSystemsMap.values())

  // Merge dotfiles configurations
  const mergedDotfiles = {
    ...existing.dotfiles,
    ...newConfig.dotfiles, // Overwrites if same machine
  }

  return {
    version: newConfig.version,
    metadata: {
      createdAt: existing.metadata?.createdAt || newConfig.metadata?.createdAt,
      updatedAt: new Date().toISOString(),
    },
    repo: {
      ...existing.repo,
      ...newConfig.repo, // Use latest repo config
    },
    systems: mergedSystems,
    dotfiles: mergedDotfiles,
  }
}

/**
 * Add tracked files to a specific machine in the config
 *
 * @param config - Existing BackupConfig
 * @param machineId - Machine identifier (e.g., 'macos-darwin-macbook-air')
 * @param files - Files to add
 * @returns Updated BackupConfig
 */
export function addTrackedFiles(
  config: BackupConfig,
  machineId: string,
  files: TrackedFile[],
): BackupConfig {
  const machineConfig = config.dotfiles[machineId]
  if (!machineConfig) {
    throw new Error(`Machine ${machineId} not found in config`)
  }

  const existingFiles = machineConfig['tracked-files'].files
  const existingPaths = new Set(existingFiles.map((f) => f.sourcePath))
  const newFiles = files.filter((f) => !existingPaths.has(f.sourcePath))

  return {
    ...config,
    dotfiles: {
      ...config.dotfiles,
      [machineId]: {
        ...machineConfig,
        'tracked-files': {
          ...machineConfig['tracked-files'],
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
 * Remove tracked files from a specific machine in the config
 *
 * @param config - Existing BackupConfig
 * @param machineId - Machine identifier (e.g., 'macos-darwin-macbook-air')
 * @param filePaths - Source paths of files to remove
 * @returns Updated BackupConfig
 */
export function removeTrackedFiles(
  config: BackupConfig,
  machineId: string,
  filePaths: string[],
): BackupConfig {
  const machineConfig = config.dotfiles[machineId]
  if (!machineConfig) {
    throw new Error(`Machine ${machineId} not found in config`)
  }

  const pathsToRemove = new Set(filePaths)
  const updatedFiles = machineConfig['tracked-files'].files.filter(
    (f) => !pathsToRemove.has(f.sourcePath),
  )

  return {
    ...config,
    dotfiles: {
      ...config.dotfiles,
      [machineId]: {
        ...machineConfig,
        'tracked-files': {
          ...machineConfig['tracked-files'],
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
