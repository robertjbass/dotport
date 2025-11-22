/**
 * Type definitions for backup configuration schema
 * Refactored structure with machine-specific organization
 */

export type OperatingSystem = 'macos' | 'linux' | 'windows'
export type Shell = 'bash' | 'zsh' | 'fish' | 'other'
export type RepoType = 'github' | 'gitlab' | 'bitbucket' | 'other-git' | 'none'
export type RepoVisibility = 'public' | 'private'
export type SecretFileFormat = 'shell-export' | 'dotenv' | 'json' | 'yaml'
export type SecretStorageType = 'git-repo' | 'local-only'
export type EncryptionType = 'none' | 'pgp'
export type SymlinkStrategy = 'direct' | 'stow' | 'custom'
export type ConflictResolution = 'backup' | 'overwrite' | 'skip' | 'ask'

export type RepoMetadata = {
  repoType: RepoType
  repoName: string
  repoUrl: string
  repoOwner: string
  branch: string
  visibility: RepoVisibility
}

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

  displayServer?: 'x11' | 'wayland' | 'unknown'
  desktopEnvironment?: string // e.g., 'gnome', 'kde', 'i3', 'sway'
}

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

export type MachineTrackedFilesConfig = {
  cloneLocation: string // e.g., '/Users/bob/dev/dotfiles'
  files: TrackedFile[]
}

export type SecretFile = {
  name: string // Default: '.env.sh'
  location: string // Default: '~'
  format: SecretFileFormat
}

export type GitRepoSecretStorage = {
  repoType: RepoType
  repoName: string
  repoUrl: string
  repoOwner?: string
  branch: string
  visibility: 'private' // Secrets should always be private
  encryption: EncryptionType
  encryptionKey?: string // Path to encryption key
}

export type SecretStorage = {
  type: SecretStorageType
  repo?: GitRepoSecretStorage
}

export type TrackedSecret = {
  name: string
  sourcePath: string
  repoPath?: string // Only if using git-repo storage
  encrypted: boolean
}

export type SecretVariable = {
  name: string
  description?: string
  required: boolean
}

export type MachineSecretsConfig = {
  enabled: boolean
  secretFile: SecretFile
  storage: SecretStorage
  trackedSecrets: {
    files?: TrackedSecret[]
    variables?: SecretVariable[]
  }
}

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

export type PackageInfo = {
  name: string
  version?: string
  description?: string
  installedAt?: string
}

export type PackageManager = {
  type: PackageManagerType
  enabled: boolean
  packages: PackageInfo[]
  exportPath?: string
  command?: string
  restoreCommand?: string
}

export type MachinePackagesConfig = {
  enabled: boolean
  packageManagers: PackageManager[]
}

export type ApplicationInfo = {
  name: string
  version?: string
  path?: string
  bundleId?: string
  installedVia?: PackageManagerType | 'manual' | 'app-store'
  category?: string
}

export type MachineApplicationsConfig = {
  enabled: boolean
  applications: ApplicationInfo[]
}

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

export type ExtensionInfo = {
  id: string
  name?: string
  version?: string
  publisher?: string
  enabled: boolean
}

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

export type MachineExtensionsConfig = {
  enabled: boolean
  editors: EditorExtensions[]
}

export type ServiceType = 'systemd' | 'launchd'
export type SystemService = {
  name: string
  type: ServiceType
  enabled: boolean
  state?: 'running' | 'stopped' | 'failed' | 'unknown'
  description?: string
  configPath?: string
  backupPath?: string
}

export type MachineServicesConfig = {
  enabled: boolean
  services: SystemService[]
}

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
  exportPath?: string
  keys?: string[]
  command?: string
  restoreCommand?: string
}

export type MachineSettingsConfig = {
  enabled: boolean
  settings: SystemSettings[]
}

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
  manager?: string
  versions: string[]
  defaultVersion?: string
  installCommand?: string
}

export type MachineRuntimesConfig = {
  enabled: boolean
  runtimes: RuntimeVersion[]
}

export type FontLocationType = 'user' | 'system' | 'local'

export type FontInfo = {
  name: string // Font file name (e.g., 'Roboto-Regular.ttf')
  family?: string // Font family name (e.g., 'Roboto')
  style?: string // Font style (e.g., 'Regular', 'Bold', 'Italic')
  format?: string // Font format (e.g., 'ttf', 'otf', 'woff', 'woff2')
  path: string // Absolute path to font file
  size?: number // File size in bytes
  installedAt?: string // ISO 8601 timestamp
}

export type FontLocation = {
  type: FontLocationType
  path: string // Directory path where fonts are stored
  enabled: boolean // Whether to backup/restore fonts from this location
  fonts: FontInfo[]
}

export type MachineFontsConfig = {
  enabled: boolean
  locations: FontLocation[]
  exportPath?: string // Path to exported font list (e.g., '.config/fonts.json')
}

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
  fonts: MachineFontsConfig
}

export type MetadataConfig = {
  createdAt: string // ISO 8601 timestamp
  updatedAt: string
  lastBackup?: string
  lastRestore?: string
}

export type BackupConfig = {
  version: string
  metadata: MetadataConfig
  repo: RepoMetadata
  systems: SystemMetadata[]
  dotfiles: {
    [machineId: string]: MachineConfig
  }
}

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
    fonts: {
      enabled: false,
      locations: [],
    },
  }
}

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

export function getMachineId(
  os: OperatingSystem,
  distro: string,
  nickname: string,
): string {
  return `${os}-${distro}-${nickname}`
}
