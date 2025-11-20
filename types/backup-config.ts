/**
 * Type definitions for backup configuration schema
 * Refactored structure with machine-specific organization
 */

export type OperatingSystem = 'macos' | 'linux' | 'windows'
export type Shell = 'bash' | 'zsh' | 'fish' | 'other'
export type RepoType = 'github' | 'gitlab' | 'bitbucket' | 'other-git' | 'none'
export type RepoVisibility = 'public' | 'private'
export type SecretFileFormat = 'shell-export' | 'dotenv' | 'json' | 'yaml'
export type SecretStorageType =
  | 'git-repo'
  | 'cloud-service'
  | 'local-only'
  | 'password-manager'
  | 'os-keychain'
export type EncryptionType = 'none' | 'age' | 'pgp' | 'git-crypt' | 'sops'
export type CloudProvider =
  | 'aws-secrets-manager'
  | 'gcp-secret-manager'
  | 'azure-key-vault'
  | 'hashicorp-vault'
export type PasswordManager = '1password' | 'lastpass' | 'bitwarden' | 'pass'
export type SymlinkStrategy = 'direct' | 'stow' | 'custom'
export type ConflictResolution = 'backup' | 'overwrite' | 'skip' | 'ask'

/**
 * Repository metadata (extracted from dotfiles config)
 */
export type RepoMetadata = {
  repoType: RepoType
  repoName: string
  repoUrl: string
  repoOwner: string
  branch: string
  visibility: RepoVisibility
}

/**
 * System metadata for each machine
 * Replaces the old SystemConfig and MultiOSConfig
 */
export type SystemMetadata = {
  os: OperatingSystem
  distro: string // e.g., 'darwin' for macOS, 'debian'/'ubuntu' for Linux
  nickname: string // e.g., 'macbook-air-m2', 'lenovo-thinkpad'
  repoPath: string // Machine ID: <os>-<distro>-<nickname>
  shell: Shell
  shellConfigFile: string // e.g., '.zshrc', '.bashrc'

  // System paths and runtime info (synced from user-system.json)
  homeDirectory?: string
  localRepoPath?: string
  runtimeData?: {
    node: {
      packageManager: string
      versionManager: string
      version: string
    }
  }

  // Optional Linux-specific metadata
  displayServer?: 'x11' | 'wayland' | 'unknown'
  desktopEnvironment?: string // e.g., 'gnome', 'kde', 'i3', 'sway'
}

/**
 * Tracked file configuration
 */
export type TrackedFile = {
  name: string // e.g., '.bashrc', '.zshrc'
  sourcePath: string // Home directory path: '~/.bashrc'
  repoPath: string // Path in repo: 'macos-darwin-macbook/.bashrc'
  symlinkEnabled: boolean // Whether to create symlink
  tracked: boolean // Whether file is tracked in git

  // Symlink state tracking
  symlinkCreated?: boolean // Whether symlink was actually created
  symlinkCreatedAt?: string // ISO 8601 timestamp when symlink was created
  symlinkTarget?: string // Absolute path where symlink points
  backupPath?: string // Path to .backup file if existing file was backed up

  // Secret detection
  containsSecrets?: boolean // Whether file contains potential secrets
  secretsScannedAt?: string // When file was last scanned for secrets
}

/**
 * Tracked files configuration for a machine
 */
export type MachineTrackedFilesConfig = {
  cloneLocation: string // e.g., '/Users/bob/dev/dotfiles'
  files: TrackedFile[]
}

/**
 * Secret file configuration
 */
export type SecretFile = {
  name: string // Default: '.env.sh'
  location: string // Default: '~'
  format: SecretFileFormat
}

/**
 * Git repository storage for secrets
 */
export type GitRepoStorage = {
  repoType: RepoType
  repoName: string
  repoUrl: string
  repoOwner?: string
  branch: string
  visibility: 'private' // Secrets should always be private
  encryption: EncryptionType
  encryptionKey?: string // Path to encryption key
}

/**
 * Cloud storage for secrets
 */
export type CloudStorage = {
  provider: CloudProvider
  region?: string
  vaultUrl?: string
  configPath?: string
}

/**
 * Password manager storage for secrets
 */
export type PasswordManagerStorage = {
  type: PasswordManager
  cliPath?: string
}

/**
 * Secret storage configuration
 */
export type SecretStorage = {
  type: SecretStorageType
  repo?: GitRepoStorage
  cloud?: CloudStorage
  passwordManager?: PasswordManagerStorage
}

/**
 * Tracked secret file
 */
export type TrackedSecret = {
  name: string
  sourcePath: string
  repoPath?: string // Only if using git-repo storage
  encrypted: boolean
}

/**
 * Secret variable definition
 */
export type SecretVariable = {
  name: string
  description?: string
  required: boolean
}

/**
 * Secrets configuration for a machine
 */
export type MachineSecretsConfig = {
  enabled: boolean
  secretFile: SecretFile
  storage: SecretStorage
  trackedSecrets: {
    files?: TrackedSecret[]
    variables?: SecretVariable[]
  }
}

/**
 * Symlinks configuration
 */
export type SymlinksConfig = {
  enabled: boolean
  strategy: SymlinkStrategy
  customScript?: string
  conflictResolution: ConflictResolution
  backupLocation?: string
}

/**
 * Package Manager Types
 */
export type PackageManagerType =
  | 'homebrew' // macOS: brew
  | 'homebrew-cask' // macOS: brew cask (GUI apps)
  | 'mas' // macOS App Store
  | 'apt' // Debian/Ubuntu
  | 'dnf' // Fedora
  | 'yum' // RHEL/CentOS
  | 'pacman' // Arch
  | 'snap' // Snap packages (cross-platform)
  | 'flatpak' // Flatpak (cross-platform)
  | 'npm' // npm global packages
  | 'pnpm' // pnpm global packages
  | 'yarn' // yarn global packages
  | 'pip' // Python packages
  | 'pipx' // Python applications
  | 'cargo' // Rust packages
  | 'gem' // Ruby packages
  | 'go' // Go packages

/**
 * Package information
 */
export type PackageInfo = {
  name: string
  version?: string
  description?: string
  installedAt?: string
}

/**
 * Package manager configuration
 */
export type PackageManager = {
  type: PackageManagerType
  enabled: boolean
  packages: PackageInfo[]
  exportPath?: string
  command?: string
  restoreCommand?: string
}

/**
 * Packages configuration for a machine
 */
export type MachinePackagesConfig = {
  enabled: boolean
  packageManagers: PackageManager[]
}

/**
 * Application information
 */
export type ApplicationInfo = {
  name: string
  version?: string
  path?: string
  bundleId?: string
  installedVia?: PackageManagerType | 'manual' | 'app-store'
  category?: string
}

/**
 * Applications configuration for a machine
 */
export type MachineApplicationsConfig = {
  enabled: boolean
  applications: ApplicationInfo[]
}

/**
 * Editor/IDE types
 */
export type EditorType =
  | 'vscode'
  | 'vscode-insiders'
  | 'cursor'
  | 'windsurf'
  | 'vim'
  | 'neovim'
  | 'jetbrains-idea'
  | 'jetbrains-pycharm'
  | 'jetbrains-webstorm'
  | 'jetbrains-other'
  | 'sublime'
  | 'emacs'
  | 'zed'

/**
 * Extension information
 */
export type ExtensionInfo = {
  id: string
  name?: string
  version?: string
  publisher?: string
  enabled: boolean
}

/**
 * Editor extensions configuration
 */
export type EditorExtensions = {
  editor: EditorType
  enabled: boolean
  configPath?: string
  extensions: ExtensionInfo[]
  exportPath?: string
  keybindingsPath?: string
  keybindingsBackedUp: boolean
  settingsPath?: string
  settingsBackedUp: boolean
  snippetsPath?: string
  snippetsBackedUp: boolean
}

/**
 * Extensions configuration for a machine
 */
export type MachineExtensionsConfig = {
  enabled: boolean
  editors: EditorExtensions[]
}

/**
 * Service types
 */
export type ServiceType = 'systemd' | 'launchd'

/**
 * System service configuration
 */
export type SystemService = {
  name: string
  type: ServiceType
  enabled: boolean
  state?: 'running' | 'stopped' | 'failed' | 'unknown'
  description?: string
  configPath?: string
  backupPath?: string
}

/**
 * Services configuration for a machine
 */
export type MachineServicesConfig = {
  enabled: boolean
  services: SystemService[]
}

/**
 * Settings types
 */
export type SettingsType =
  | 'gnome-gsettings'
  | 'gnome-dconf'
  | 'gnome-extensions'
  | 'gnome-keybindings'
  | 'macos-defaults'
  | 'kde-plasma'
  | 'xfce'

/**
 * System settings configuration
 */
export type SystemSettings = {
  type: SettingsType
  enabled: boolean
  exportPath?: string
  keys?: string[]
  command?: string
  restoreCommand?: string
}

/**
 * Settings configuration for a machine
 */
export type MachineSettingsConfig = {
  enabled: boolean
  settings: SystemSettings[]
}

/**
 * Runtime types
 */
export type RuntimeType =
  | 'node'
  | 'python'
  | 'ruby'
  | 'go'
  | 'rust'
  | 'java'
  | 'php'
  | 'deno'

/**
 * Runtime version configuration
 */
export type RuntimeVersion = {
  type: RuntimeType
  manager?: string
  versions: string[]
  defaultVersion?: string
  installCommand?: string
}

/**
 * Runtimes configuration for a machine
 */
export type MachineRuntimesConfig = {
  enabled: boolean
  runtimes: RuntimeVersion[]
}

/**
 * Complete configuration for a single machine
 * All machine-specific settings are grouped here
 */
export type MachineConfig = {
  'tracked-files': MachineTrackedFilesConfig
  secrets: MachineSecretsConfig
  symlinks: SymlinksConfig
  packages: MachinePackagesConfig
  applications: MachineApplicationsConfig
  extensions: MachineExtensionsConfig
  services: MachineServicesConfig
  settings: MachineSettingsConfig
  runtimes: MachineRuntimesConfig
}

/**
 * Metadata configuration
 */
export type MetadataConfig = {
  createdAt: string // ISO 8601 timestamp
  updatedAt: string
  lastBackup?: string
  lastRestore?: string
}

/**
 * Complete backup configuration schema
 * New refactored structure with machine-specific organization
 */
export type BackupConfig = {
  version: string
  metadata: MetadataConfig
  repo: RepoMetadata
  systems: SystemMetadata[]
  dotfiles: {
    [machineId: string]: MachineConfig
  }
}

/**
 * Default configuration values
 */
export const DEFAULT_BACKUP_CONFIG: Partial<BackupConfig> = {
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
  systems: [],
  dotfiles: {},
}

/**
 * Helper function to create default machine config
 */
export function createDefaultMachineConfig(): MachineConfig {
  return {
    'tracked-files': {
      cloneLocation: '~',
      files: [],
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
    packages: {
      enabled: false,
      packageManagers: [],
    },
    applications: {
      enabled: false,
      applications: [],
    },
    extensions: {
      enabled: false,
      editors: [],
    },
    services: {
      enabled: false,
      services: [],
    },
    settings: {
      enabled: false,
      settings: [],
    },
    runtimes: {
      enabled: false,
      runtimes: [],
    },
  }
}

/**
 * Helper function to create a default tracked file
 */
export function createTrackedFile(
  name: string,
  machineId: string,
  options: Partial<TrackedFile> = {},
): TrackedFile {
  return {
    name,
    sourcePath: `~/${name}`,
    repoPath: `${machineId}/${name}`,
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
  options: Partial<TrackedSecret> = {},
): TrackedSecret {
  return {
    name,
    sourcePath: `~/${name}`,
    encrypted: false,
    ...options,
  }
}

/**
 * Get the machine identifier for file organization
 * Uses naming convention: <os>-<distro>-<nickname>
 */
export function getMachineId(
  os: OperatingSystem,
  distro: string,
  nickname: string,
): string {
  return `${os}-${distro}-${nickname}`
}
