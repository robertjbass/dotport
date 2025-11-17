/**
 * Backup Schema Types
 *
 * These types define the structure of data.json, which stores backed-up
 * system configuration for easy restoration on new machines.
 */

// ============================================================================
// Top-Level Schema
// ============================================================================

export interface BackupSchema {
  version: string
  darwin?: DarwinConfig
  linux?: LinuxConfig
  shared: SharedConfig
}

// ============================================================================
// Metadata & Preferences (OS-Specific)
// ============================================================================

export interface Metadata {
  hostname: string | null
  username: string | null
  shell: string | null
  lastBackup: string | null
}

export interface Preferences {
  defaultTerminal: string | null // e.g., "ghostty", "iterm2", "warp"
  nodeVersionManager: string | null // "fnm" | "nvm" | "n" | "asdf"
  packageManager: string | null // "npm" | "pnpm" | "yarn" | "bun"
}

// ============================================================================
// Platform-Specific Configs
// ============================================================================

export interface DarwinConfig {
  metadata: Metadata
  preferences: Preferences
  packages: DarwinPackages
  runtimes: Runtimes
  dotfiles: DotfilesConfig
  systemSettings?: DarwinSystemSettings
  applications?: DarwinApplications
}

export interface LinuxConfig {
  metadata: Metadata
  preferences: Preferences
  packages: LinuxPackages
  runtimes: Runtimes
  dotfiles: DotfilesConfig
  systemSettings?: LinuxSystemSettings
  applications?: LinuxApplications
}

export interface SharedConfig {
  git: GitConfig
  ssh: SSHConfig
  secrets: SecretsConfig
}

// ============================================================================
// Package Management
// ============================================================================

export interface DarwinPackages {
  homebrew: {
    formulae: string[]
    casks: string[]
    taps: string[]
  }
  npm: { global: string[] }
  pnpm: { global: string[] }
  yarn: { global: string[] }
  pip: { packages: string[] }
  pipx: { packages: string[] }
  bun: { global: string[] }
  deno: { installed: string[] }
}

export interface LinuxPackages {
  apt: {
    packages: string[]
    ppas: string[]
  }
  snap: { packages: string[] }
  flatpak: {
    packages: string[]
    remotes: string[]
  }
  npm: { global: string[] }
  pnpm: { global: string[] }
  yarn: { global: string[] }
  pip: { packages: string[] }
  pipx: { packages: string[] }
  bun: { global: string[] }
  deno: { installed: string[] }
}

export interface Runtimes {
  node: {
    manager: string // "fnm" | "nvm" | "n" | "asdf"
    defaultVersion: string | null
    installedVersions: string[]
  }
  python: {
    defaultVersion: string | null
    installedVersions: string[]
  }
  ruby: {
    defaultVersion: string | null
    installedVersions: string[]
  }
  go: {
    version: string | null
  }
  rust: {
    version: string | null
  }
  java: {
    defaultVersion: string | null
    installedVersions: string[]
  }
  databases: {
    mysql: string | null
    postgresql: string | null
    mongodb: string | null
    redis: string | null
    sqlite: string | null
  }
}

// ============================================================================
// System Settings
// ============================================================================

export interface DarwinSystemSettings {
  keybindings?: {
    karabiner?: ConfigFile<object>
  }
  automation?: {
    hammerspoon?: ConfigFile<string>
  }
}

export interface LinuxSystemSettings {
  keybindings?: Record<string, unknown>
  automation?: Record<string, unknown>
}

// ============================================================================
// Applications
// ============================================================================

export interface DarwinApplications {
  terminals?: {
    ghostty?: ConfigFile<string>
    iterm2?: ConfigFile<string>
  }
  editors?: {
    vscode?: EditorConfig
    'vscode-insiders'?: EditorConfig
    windsurf?: EditorConfig
    cursor?: EditorConfig
  }
}

export interface LinuxApplications {
  terminals?: {
    ghostty?: ConfigFile<string>
  }
  editors?: {
    vscode?: EditorConfig
    'vscode-insiders'?: EditorConfig
    windsurf?: EditorConfig
    cursor?: EditorConfig
  }
}

export interface EditorConfig {
  settingsPath: string
  keybindingsPath: string
  backupPaths: {
    settings: string
    keybindings: string
    extensions: string
  }
  settings: object | null
  keybindings: object | null
  extensions: string[]
}

// ============================================================================
// Config Files
// ============================================================================

export interface ConfigFile<T = string> {
  configPath: string
  backupPath: string
  content: T | null
}

export interface DotfileConfig {
  filename: string
  detectedLocally: boolean
  dir: string
  path: string
  backupPath: string
  content: string | null
  remoteGitLocation: string | null
}

export interface DotfilesConfig {
  '.zshrc'?: DotfileConfig
  '.bashrc'?: DotfileConfig
  '.bash_profile'?: DotfileConfig
  '.hushlogin'?: DotfileConfig
  '.p10k.zsh'?: DotfileConfig
  '.tmux.conf'?: DotfileConfig
  '.vimrc'?: DotfileConfig
  '.gitconfig'?: DotfileConfig // OS-specific git config (optional, shared one takes precedence)
  [key: string]: DotfileConfig | undefined // Allow additional dotfiles
}

export interface SecretsConfig {
  template: {
    path: string
    backupPath: string
    content: string | null
  }
  note: string
}

export interface SSHConfig {
  config: {
    path: string
    backupPath: string
    content: string | null
  }
  note: string
}

export interface GitConfig {
  config: {
    path: string
    backupPath: string
    content: string | null
  }
}
