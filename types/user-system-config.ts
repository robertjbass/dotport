/**
 * Type definitions for user system configuration
 *
 * These types define the local configuration stored on the user's machine
 * at ~/.dotport/config/user-system.json
 *
 * This structure is aligned with the repository schema.json for consistency
 */

import type {
  OperatingSystem,
  RepoType,
  RepoVisibility,
  SystemMetadata,
  SecretFile,
  SecretStorage,
} from './backup-config'

/**
 * Runtime data for the system
 * Captures information about package managers, version managers, and runtime versions
 */
export type RuntimeData = {
  node: {
    packageManager: string // "npm" | "pnpm" | "yarn" | "bun"
    versionManager: string // "fnm" | "nvm" | "n" | "asdf" | "none"
    version: string // "20.11.0"
  }
  // Future: python, ruby, etc.
}

/**
 * Local user system configuration
 * Stored at: ~/.dotport/config/user-system.json
 *
 * This is similar to BackupConfig but simplified for local system info only
 */
export type UserSystemConfig = {
  version: string

  metadata: {
    createdAt: string // ISO 8601 timestamp
    updatedAt: string // ISO 8601 timestamp
  }

  repo: {
    repoType: RepoType
    repoName: string
    repoUrl: string
    repoOwner: string
    branch: string
    visibility: RepoVisibility
  }

  system: SystemMetadata & {
    homeDirectory: string
    localRepoPath: string
    runtimeData: RuntimeData
  }

  secrets?: {
    enabled: boolean
    secretFile: SecretFile
    storage: SecretStorage
  }
}

/**
 * GitHub authentication config
 * Stored at: ~/.dotport/config/github-auth.json
 */
export type GitHubAuthConfig = {
  token: string
  username: string
  expiresAt?: string // Optional: if token has expiration
  scopes: string[] // Token scopes
  createdAt: string // When token was added
}

/**
 * Destructed file log entry
 * Tracks files that were backed up before being overwritten or symlinked
 */
export type DestructedFileEntry = {
  originalPath: string // "~/.zshrc"
  backupPath: string // "~/.dotport/backups/destructed-files/2025-01-15T10-30-45/.zshrc"
  timestamp: string // ISO 8601
  reason: 'symlink' | 'overwrite' | 'manual'
  machineId: string // "macos-darwin-mbp"
  restoreable: boolean // Can this be restored?
}

/**
 * Destructed files log
 * Stored in: ~/.dotport/backups/destructed-files/log.json
 */
export type DestructedFilesLog = {
  entries: DestructedFileEntry[]
}

/**
 * Helper function to create default user system config
 */
export function createDefaultUserSystemConfig(): UserSystemConfig {
  return {
    version: '1.0.0',
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    repo: {
      repoType: 'none',
      repoName: 'dotfiles',
      repoUrl: '',
      repoOwner: '',
      branch: 'main',
      visibility: 'private',
    },
    system: {
      os: 'linux',
      distro: 'unknown',
      nickname: 'default',
      repoPath: '',
      shell: 'bash',
      shellConfigFile: '.bashrc',
      homeDirectory: process.env.HOME || '~',
      localRepoPath: '~/dotfiles',
      runtimeData: {
        node: {
          packageManager: 'npm',
          versionManager: 'none',
          version: 'unknown',
        },
      },
    },
  }
}
