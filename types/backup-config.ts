/**
 * Type definitions for backup configuration schema
 */

export type OperatingSystem = 'macos' | 'linux' | 'windows'
export type Shell = 'bash' | 'zsh' | 'fish' | 'other'
export type RepoType = 'github' | 'gitlab' | 'bitbucket' | 'other-git' | 'none'
export type RepoVisibility = 'public' | 'private'
export type StructureType = 'flat' | 'nested'
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

export type SystemConfig = {
  primary: OperatingSystem
  shell: Shell
  shellConfigFile: string // e.g., '.zshrc', '.bashrc'
}

export type MultiOSConfig = {
  enabled: boolean
  supportedOS: OperatingSystem[]
  linuxDistros?: string[] // e.g., ['debian', 'ubuntu', 'fedora']
}

export type TrackedFile = {
  name: string // e.g., '.bashrc', '.zshrc'
  sourcePath: string // Home directory path: '~/.bashrc'
  repoPath: string // Path in repo: 'macos/.bashrc'
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

export type DotfilesStructure = {
  type: StructureType
  // For nested structure, map OS/distro to directory
  directories: {
    [osOrDistro: string]: string // e.g., 'macos' -> 'macos/', 'debian' -> 'linux/debian/'
  }
}

export type DotfilesConfig = {
  enabled: boolean
  repoType: RepoType
  repoName: string // e.g., 'dotfiles'
  repoUrl: string // e.g., 'https://github.com/username/dotfiles'
  repoOwner?: string // e.g., 'username'
  branch: string // e.g., 'main' or 'master'
  visibility: RepoVisibility
  cloneLocation: string // e.g., '/Users/username' or '~'

  // Directory structure within repo
  structure: DotfilesStructure

  // Files tracked per OS/distro
  trackedFiles: {
    [osOrDistro: string]: {
      files: TrackedFile[]
    }
  }
}

export type SecretFile = {
  name: string // Default: '.env.sh'
  location: string // Default: '~'
  format: SecretFileFormat
}

export type GitRepoStorage = {
  repoType: RepoType
  repoName: string // e.g., 'my-secrets'
  repoUrl: string
  repoOwner?: string
  branch: string
  visibility: 'private' // Secrets should always be private
  encryption: EncryptionType
  encryptionKey?: string // Path to encryption key
}

export type CloudStorage = {
  provider: CloudProvider
  region?: string
  vaultUrl?: string
  configPath?: string
}

export type PasswordManagerStorage = {
  type: PasswordManager
  cliPath?: string
}

export type SecretStorage = {
  type: SecretStorageType
  repo?: GitRepoStorage
  cloud?: CloudStorage
  passwordManager?: PasswordManagerStorage
}

export type TrackedSecret = {
  name: string // e.g., '.env.sh'
  sourcePath: string // e.g., '~/.env.sh'
  repoPath?: string // Only if using git-repo storage
  encrypted: boolean
}

export type SecretVariable = {
  name: string // e.g., 'API_KEY'
  description?: string
  required: boolean
}

export type SecretsConfig = {
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

export type SymlinksConfig = {
  enabled: boolean
  strategy: SymlinkStrategy
  customScript?: string // Path to custom symlink script
  conflictResolution: ConflictResolution
  backupLocation?: string // Where to backup existing files
}

export type MetadataConfig = {
  createdAt: string // ISO 8601 timestamp
  updatedAt: string
  lastBackup?: string
  lastRestore?: string
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

export type PackageInfo = {
  name: string
  version?: string
  description?: string
  installedAt?: string // ISO 8601 timestamp
}

export type PackageManager = {
  type: PackageManagerType
  enabled: boolean
  packages: PackageInfo[]
  exportedAt?: string // When package list was last exported
  exportPath?: string // Path to exported package list file in dotfiles (e.g., 'macos/Brewfile')
  command?: string // Command to export packages (e.g., 'brew bundle dump')
  restoreCommand?: string // Command to restore packages (e.g., 'brew bundle install')
}

/**
 * Application Types
 */
export type ApplicationInfo = {
  name: string
  version?: string
  path?: string // Install path
  bundleId?: string // macOS bundle identifier
  installedVia?: PackageManagerType | 'manual' | 'app-store'
  category?: string // e.g., 'development', 'productivity', 'utilities'
}

/**
 * Editor/IDE Extension Types
 */
export type EditorType =
  | 'vscode'
  | 'vscode-insiders'
  | 'cursor'
  | 'windsurf'
  | 'vim'
  | 'neovim'
  | 'jetbrains-idea' // IntelliJ IDEA
  | 'jetbrains-pycharm' // PyCharm
  | 'jetbrains-webstorm' // WebStorm
  | 'jetbrains-other' // Other JetBrains IDEs
  | 'sublime'
  | 'emacs'
  | 'zed'

export type ExtensionInfo = {
  id: string // Extension identifier (e.g., 'ms-python.python')
  name?: string
  version?: string
  publisher?: string
  enabled: boolean
}

export type EditorExtensions = {
  editor: EditorType
  enabled: boolean
  configPath?: string // Path to editor config directory
  extensions: ExtensionInfo[]
  exportedAt?: string
  exportPath?: string // Path to exported extensions list in dotfiles

  // Keybindings
  keybindingsPath?: string // Path to keybindings file in dotfiles
  keybindingsBackedUp: boolean

  // Settings
  settingsPath?: string // Path to settings file in dotfiles
  settingsBackedUp: boolean

  // Snippets
  snippetsPath?: string // Path to snippets directory in dotfiles
  snippetsBackedUp: boolean
}

/**
 * System Service Types (Linux systemd, macOS launchd)
 */
export type ServiceType = 'systemd' | 'launchd'

export type SystemService = {
  name: string
  type: ServiceType
  enabled: boolean
  state?: 'running' | 'stopped' | 'failed' | 'unknown'
  description?: string
  configPath?: string // Path to service file
  backupPath?: string // Path in dotfiles where service is backed up
}

/**
 * System Settings Types
 */
export type SettingsType =
  | 'gnome-gsettings'
  | 'gnome-dconf'
  | 'gnome-extensions'
  | 'gnome-keybindings'
  | 'macos-defaults'
  | 'kde-plasma'
  | 'xfce'

export type SystemSettings = {
  type: SettingsType
  enabled: boolean
  exportPath?: string // Path to exported settings file in dotfiles
  exportedAt?: string
  keys?: string[] // Specific keys/paths to track
  command?: string // Command to export settings
  restoreCommand?: string // Command to restore settings
}

/**
 * Runtime Version Types (Node, Python, Ruby, etc.)
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

export type RuntimeVersion = {
  type: RuntimeType
  manager?: string // e.g., 'fnm', 'nvm', 'pyenv', 'rbenv', 'asdf', 'sdkman'
  versions: string[] // Installed versions
  defaultVersion?: string // Default/active version
  exportedAt?: string
  installCommand?: string // Command to install runtime (e.g., 'fnm install 24')
}

/**
 * System Configuration (aggregates packages, apps, extensions, etc.)
 */
export type SystemPackagesConfig = {
  enabled: boolean
  packageManagers: {
    [osOrDistro: string]: PackageManager[]
  }
}

export type SystemApplicationsConfig = {
  enabled: boolean
  applications: {
    [osOrDistro: string]: ApplicationInfo[]
  }
}

export type SystemExtensionsConfig = {
  enabled: boolean
  editors: {
    [osOrDistro: string]: EditorExtensions[]
  }
}

export type SystemServicesConfig = {
  enabled: boolean
  services: {
    [osOrDistro: string]: SystemService[]
  }
}

export type SystemSettingsConfig = {
  enabled: boolean
  settings: {
    [osOrDistro: string]: SystemSettings[]
  }
}

export type SystemRuntimesConfig = {
  enabled: boolean
  runtimes: {
    [osOrDistro: string]: RuntimeVersion[]
  }
}

/**
 * Complete backup configuration schema
 */
export type BackupConfig = {
  version: string
  system: SystemConfig
  multiOS: MultiOSConfig
  dotfiles: DotfilesConfig
  secrets: SecretsConfig
  symlinks: SymlinksConfig
  packages: SystemPackagesConfig
  applications: SystemApplicationsConfig
  extensions: SystemExtensionsConfig
  services: SystemServicesConfig
  settings: SystemSettingsConfig
  runtimes: SystemRuntimesConfig
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
  packages: {
    enabled: false,
    packageManagers: {},
  },
  applications: {
    enabled: false,
    applications: {},
  },
  extensions: {
    enabled: false,
    editors: {},
  },
  services: {
    enabled: false,
    services: {},
  },
  settings: {
    enabled: false,
    settings: {},
  },
  runtimes: {
    enabled: false,
    runtimes: {},
  },
}

/**
 * Helper function to create a default tracked file
 */
export function createTrackedFile(
  name: string,
  osOrDistro: string,
  repoPath: string,
  options: Partial<TrackedFile> = {},
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
  options: Partial<TrackedSecret> = {},
): TrackedSecret {
  return {
    name,
    sourcePath: `~/${name}`,
    encrypted: false,
    ...options,
  }
}
