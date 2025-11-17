/**
 * Type definitions for backup configuration schema
 */

export type OperatingSystem = 'macos' | 'linux' | 'windows'
export type Shell = 'bash' | 'zsh' | 'fish' | 'other'
export type RepoType = 'github' | 'gitlab' | 'bitbucket' | 'other-git' | 'none'
export type RepoVisibility = 'public' | 'private'
export type StructureType = 'flat' | 'nested'
export type SecretFileFormat = 'shell-export' | 'dotenv' | 'json' | 'yaml'
export type SecretStorageType = 'git-repo' | 'cloud-service' | 'local-only' | 'password-manager' | 'os-keychain'
export type EncryptionType = 'none' | 'age' | 'pgp' | 'git-crypt' | 'sops'
export type CloudProvider = 'aws-secrets-manager' | 'gcp-secret-manager' | 'azure-key-vault' | 'hashicorp-vault'
export type PasswordManager = '1password' | 'lastpass' | 'bitwarden' | 'pass'
export type SymlinkStrategy = 'direct' | 'stow' | 'custom'
export type ConflictResolution = 'backup' | 'overwrite' | 'skip' | 'ask'

export interface SystemConfig {
  primary: OperatingSystem
  shell: Shell
  shellConfigFile: string  // e.g., '.zshrc', '.bashrc'
}

export interface MultiOSConfig {
  enabled: boolean
  supportedOS: OperatingSystem[]
  linuxDistros?: string[]  // e.g., ['debian', 'ubuntu', 'fedora']
}

export interface TrackedFile {
  name: string              // e.g., '.bashrc', '.zshrc'
  sourcePath: string        // Home directory path: '~/.bashrc'
  repoPath: string          // Path in repo: 'macos/.bashrc'
  symlinkEnabled: boolean   // Whether to create symlink
  tracked: boolean          // Whether file is tracked in git
}

export interface DotfilesStructure {
  type: StructureType
  // For nested structure, map OS/distro to directory
  directories: {
    [osOrDistro: string]: string  // e.g., 'macos' -> 'macos/', 'debian' -> 'linux/debian/'
  }
}

export interface DotfilesConfig {
  enabled: boolean
  repoType: RepoType
  repoName: string          // e.g., 'dotfiles'
  repoUrl: string           // e.g., 'https://github.com/username/dotfiles'
  repoOwner?: string        // e.g., 'username'
  branch: string            // e.g., 'main' or 'master'
  visibility: RepoVisibility
  cloneLocation: string     // e.g., '/Users/username' or '~'

  // Directory structure within repo
  structure: DotfilesStructure

  // Files tracked per OS/distro
  trackedFiles: {
    [osOrDistro: string]: {
      files: TrackedFile[]
    }
  }
}

export interface SecretFile {
  name: string              // Default: '.env.sh'
  location: string          // Default: '~'
  format: SecretFileFormat
}

export interface GitRepoStorage {
  repoType: RepoType
  repoName: string          // e.g., 'my-secrets'
  repoUrl: string
  repoOwner?: string
  branch: string
  visibility: 'private'     // Secrets should always be private
  encryption: EncryptionType
  encryptionKey?: string    // Path to encryption key
}

export interface CloudStorage {
  provider: CloudProvider
  region?: string
  vaultUrl?: string
  configPath?: string
}

export interface PasswordManagerStorage {
  type: PasswordManager
  cliPath?: string
}

export interface SecretStorage {
  type: SecretStorageType
  repo?: GitRepoStorage
  cloud?: CloudStorage
  passwordManager?: PasswordManagerStorage
}

export interface TrackedSecret {
  name: string              // e.g., '.env.sh'
  sourcePath: string        // e.g., '~/.env.sh'
  repoPath?: string         // Only if using git-repo storage
  encrypted: boolean
}

export interface SecretVariable {
  name: string              // e.g., 'API_KEY'
  description?: string
  required: boolean
}

export interface SecretsConfig {
  enabled: boolean
  secretFile: SecretFile
  storage: SecretStorage

  // Secret files per OS/distro
  trackedSecrets: {
    [osOrDistro: string]: {
      files: TrackedSecret[]
      // Individual secrets (if crawling)
      variables?: SecretVariable[]
    }
  }
}

export interface SymlinksConfig {
  enabled: boolean
  strategy: SymlinkStrategy
  customScript?: string     // Path to custom symlink script
  conflictResolution: ConflictResolution
  backupLocation?: string   // Where to backup existing files
}

export interface MetadataConfig {
  createdAt: string         // ISO 8601 timestamp
  updatedAt: string
  lastBackup?: string
  lastRestore?: string
}

/**
 * Complete backup configuration schema
 */
export interface BackupConfig {
  version: string
  system: SystemConfig
  multiOS: MultiOSConfig
  dotfiles: DotfilesConfig
  secrets: SecretsConfig
  symlinks: SymlinksConfig
  metadata: MetadataConfig
}

/**
 * Default configuration values
 */
export const DEFAULT_BACKUP_CONFIG: Partial<BackupConfig> = {
  version: '1.0.0',
  multiOS: {
    enabled: false,
    supportedOS: [],
  },
  dotfiles: {
    enabled: false,
    repoType: 'none',
    repoName: 'dotfiles',
    repoUrl: '',
    branch: 'main',
    visibility: 'private',
    cloneLocation: '~',
    structure: {
      type: 'flat',
      directories: {},
    },
    trackedFiles: {},
  },
  secrets: {
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
  symlinks: {
    enabled: true,
    strategy: 'direct',
    conflictResolution: 'ask',
    backupLocation: '~/.dotfiles-backup',
  },
}

/**
 * Helper function to create a default tracked file
 */
export function createTrackedFile(
  name: string,
  osOrDistro: string,
  repoPath: string,
  options: Partial<TrackedFile> = {}
): TrackedFile {
  return {
    name,
    sourcePath: `~/${name}`,
    repoPath,
    symlinkEnabled: true,
    tracked: true,
    ...options,
  }
}

/**
 * Helper function to create a default tracked secret
 */
export function createTrackedSecret(
  name: string,
  options: Partial<TrackedSecret> = {}
): TrackedSecret {
  return {
    name,
    sourcePath: `~/${name}`,
    encrypted: false,
    ...options,
  }
}
