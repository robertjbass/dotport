# Data Schema Design

This document defines the structure of `data.json`, which stores backed-up system configuration.

## Schema Overview

The `data.json` file is dynamically populated by backup scripts and consumed by restore scripts. It serves as a snapshot of your system configuration at a point in time.

## Top-Level Structure

```typescript
{
  version: string              // Schema version (e.g., "1.0.0")
  darwin?: DarwinConfig        // macOS-specific configuration
  linux?: LinuxConfig          // Linux-specific configuration
  shared: SharedConfig         // Cross-platform configs (git, ssh, secrets)
}
```

**Note**: The schema is now organized by platform. Each platform (darwin/linux) has its own metadata, preferences, packages, runtimes, and dotfiles. Truly shared configs (git, ssh, secrets) are in the `shared` section.

## Platform-Specific Sections

### macOS (darwin)

```typescript
{
  metadata: {
    hostname: string | null
    username: string | null
    shell: string | null           // e.g., "/bin/zsh"
    lastBackup: string | null      // ISO timestamp
  }
  preferences: {
    defaultTerminal: string | null       // e.g., "ghostty", "iterm2", "warp"
    nodeVersionManager: string | null    // "fnm" | "nvm" | "n" | "asdf"
    packageManager: string | null        // "npm" | "pnpm" | "yarn" | "bun"
  }
  packages: {
    homebrew: {
      formulae: string[]       // brew list --formula
      casks: string[]          // brew list --cask
      taps: string[]           // brew tap
    }
    npm: {
      global: string[]         // npm list -g --depth=0
    }
    pnpm: {
      global: string[]         // pnpm list -g --depth=0
    }
    yarn: {
      global: string[]         // yarn global list
    }
    pip: {
      packages: string[]       // python3 -m pip list --user
    }
    pipx: {
      packages: string[]       // pipx list --short
    }
    bun: {
      global: string[]         // bun pm ls -g
    }
    deno: {
      installed: string[]      // deno info (installed packages)
    }
  }
  runtimes: {
    node: {
      manager: string          // "fnm" | "nvm" | "n" | "asdf"
      defaultVersion: string | null      // e.g., "24.11.1"
      installedVersions: string[]        // e.g., ["22.21.1", "24.11.1"]
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
  dotfiles: {
    ".zshrc"?: DotfileConfig
    ".bashrc"?: DotfileConfig
    ".bash_profile"?: DotfileConfig
    ".hushlogin"?: DotfileConfig
    ".p10k.zsh"?: DotfileConfig
    ".tmux.conf"?: DotfileConfig
    ".vimrc"?: DotfileConfig
    ".gitconfig"?: DotfileConfig  // OS-specific (shared gitconfig takes precedence)
  }
  systemSettings: {
    keybindings: {
      karabiner: {
        configPath: string               // "~/.config/karabiner/karabiner.json"
        backupPath: string               // "configs/karabiner/karabiner.json"
        content: object | null           // JSON content of karabiner config
      }
    }
    automation: {
      hammerspoon: {
        configPath: string               // "~/.hammerspoon/init.lua"
        backupPath: string               // "configs/hammerspoon/init.lua"
        content: string | null           // File content
      }
    }
  }
  applications: {
    terminals: {
      ghostty: {
        configPath: string
        backupPath: string
        content: string | null
      }
      iterm2: {
        configPath: string
        backupPath: string
        content: string | null
      }
    }
    editors: {
      vscode: EditorConfig
      "vscode-insiders": EditorConfig
      windsurf: EditorConfig
      cursor: EditorConfig
    }
  }
}
```

#### DotfileConfig Type

```typescript
{
  filename: string                 // e.g., ".zshrc"
  detectedLocally: boolean         // true if file exists in home directory
  dir: string                      // "~"
  path: string                     // Full path: "/Users/bob/.zshrc"
  backupPath: string               // Relative backup path: "darwin/dotfiles/.zshrc"
  content: string | null           // File content (null if not detected)
  remoteGitLocation: string | null // Git repo path or null if not detected
}
```

#### EditorConfig Type (macOS paths)

```typescript
{
  settingsPath: string        // "~/Library/Application Support/{Editor}/User/settings.json"
  keybindingsPath: string     // "~/Library/Application Support/{Editor}/User/keybindings.json"
  backupPaths: {
    settings: string          // "configs/{editor}/settings.json"
    keybindings: string       // "configs/{editor}/keybindings.json"
    extensions: string        // "configs/{editor}/extensions.txt"
  }
  settings: object | null     // JSON content of settings
  keybindings: object | null  // JSON content of keybindings
  extensions: string[]        // List of extension IDs
}
```

### Linux

```typescript
{
  metadata: {
    hostname: string | null
    username: string | null
    shell: string | null
    lastBackup: string | null
  }
  preferences: {
    defaultTerminal: string | null
    nodeVersionManager: string | null
    packageManager: string | null
  }
  packages: {
    apt: {
      packages: string[]       // apt list --installed
      ppas: string[]           // PPAs from /etc/apt/sources.list.d/
    }
    snap: {
      packages: string[]       // snap list
    }
    flatpak: {
      packages: string[]       // flatpak list
      remotes: string[]        // flatpak remotes
    }
    npm: {
      global: string[]
    }
    pnpm: {
      global: string[]
    }
    yarn: {
      global: string[]
    }
    pip: {
      packages: string[]
    }
    pipx: {
      packages: string[]
    }
    bun: {
      global: string[]
    }
    deno: {
      installed: string[]
    }
  }
  runtimes: {
    node: {
      manager: string
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
  dotfiles: {
    // Same structure as darwin, uses DotfileConfig type
  }
  systemSettings: {
    keybindings: {}            // TBD based on desktop environment
    automation: {}             // TBD
  }
  applications: {
    terminals: {
      ghostty: {
        configPath: string     // "~/.config/ghostty/config"
        backupPath: string
        content: string | null
      }
    }
    editors: {
      vscode: EditorConfig     // Linux paths: ~/.config/Code/User/
      "vscode-insiders": EditorConfig
      windsurf: EditorConfig
      cursor: EditorConfig
    }
  }
}
```

#### EditorConfig Type (Linux paths)

Same structure as macOS, but paths differ:
- Settings: `~/.config/{Editor}/User/settings.json`
- Keybindings: `~/.config/{Editor}/User/keybindings.json`

## Shared Configuration (Cross-Platform)

The `shared` section contains configs that are truly platform-independent: git, ssh, and secrets templates.

```typescript
{
  git: GitConfig
  ssh: SSHConfig
  secrets: SecretsConfig
}
```

**Note**: Dotfiles are now platform-specific (darwin/linux sections) since you may want different versions per OS.

### Secrets

```typescript
{
  template: {
    path: string            // "~/.env.sh.example"
    backupPath: string      // "dotfiles/.env.sh.example"
    content: string | null  // Template file content (safe to commit)
  }
  note: string              // Warning about never backing up actual secrets
}
```

**IMPORTANT**: The actual `~/.env.sh` file containing real API keys is **NEVER** backed up or committed.

### SSH

```typescript
{
  config: {
    path: string            // "~/.ssh/config"
    backupPath: string      // "ssh/config"
    content: string | null  // SSH config file content
  }
  note: string              // Warning about never backing up private keys
}
```

**IMPORTANT**: SSH private keys (id_rsa, etc.) are **NEVER** backed up.

### Git

```typescript
{
  config: {
    path: string            // "~/.config/git/config" or "~/.gitconfig"
    backupPath: string      // "configs/git/config"
    content: string | null
  }
}
```

## File Organization in Repo

When backed up, files are organized in the repo as:

```
dev-machine-backup-restore/
├── data.json                        # Complete backup schema (all platforms)
├── darwin/                          # macOS-specific files
│   └── dotfiles/
│       ├── .zshrc
│       ├── .bashrc
│       ├── .bash_profile
│       ├── .hushlogin
│       ├── .p10k.zsh
│       ├── .tmux.conf
│       ├── .vimrc
│       └── .gitconfig               # OS-specific (optional)
├── linux/                           # Linux-specific files
│   └── dotfiles/
│       ├── .zshrc
│       ├── .bashrc
│       └── ...
├── shared/                          # Cross-platform configs
│   ├── git/
│   │   └── config
│   ├── ssh/
│   │   └── config                   # SSH config only, no keys
│   └── secrets/
│       └── .env.sh.example          # Template only, no actual secrets
└── configs/                         # Future: application configs
    ├── ghostty/
    ├── karabiner/
    ├── hammerspoon/
    ├── vscode/
    ├── windsurf/
    └── cursor/
```

**Note**: Currently only dotfiles are being backed up. Application configs (editors, terminals, etc.) will be added in future iterations.

## Script Operations

### Populate Backup Schema (`pnpm run script:populate-backup-schema`)

**Current implementation** - Populates `data.json` with system configuration:

1. Detect OS (darwin/linux)
2. Read existing `data.json` to preserve other platform data (non-destructive)
3. Collect metadata (hostname, username, shell, timestamp)
4. Detect preferences (terminal, node manager, package manager)
5. Export package lists:
   - macOS: brew (formulae, casks, taps), npm, pnpm, yarn, pip, pipx, bun, deno
   - Linux: apt, snap, flatpak, npm, pnpm, yarn, pip, pipx, bun, deno
6. Detect runtimes (Node, Python, Ruby, Go, Rust, Java, databases)
7. Detect dotfiles in home directory (reads content if exists)
8. Update only current OS section in `data.json`
9. Preserve data from other platforms

**Future**: Write individual dotfiles/configs to disk in platform-specific directories

### Backup Script (`pnpm run script backup`) - TODO

1. Run `populate-backup-schema`
2. Write dotfiles to `darwin/dotfiles/` or `linux/dotfiles/`
3. Write shared configs to `shared/git/`, `shared/ssh/`, `shared/secrets/`
4. Optionally commit changes to git

### Restore Script (`pnpm run script restore`) - TODO

1. Detect current OS
2. Read `data.json`
3. Restore packages for current OS:
   - macOS: `brew install` formulae/casks, `brew tap` for taps
   - Linux: `apt install`, `snap install`, `flatpak install`
4. Install global packages: npm, pnpm, yarn, pip, pipx, bun, deno
5. Set up runtimes:
   - Install fnm/nvm and restore Node versions
   - Restore Python, Ruby, Go, Rust, Java versions (if possible)
6. Restore dotfiles from platform-specific section to `~/`
7. Restore shared configs (git, ssh) to appropriate locations
8. Prompt user to manually create `~/.env.sh` from template
9. Future: Install editor extensions and restore app configs

## Security Considerations

**NEVER backup or commit:**
- `~/.env.sh` (contains API keys)
- SSH private keys (`~/.ssh/id_rsa`, etc.)
- Any file with actual credentials

**ALWAYS backup:**
- Templates (`.env.sh.example`)
- Public configs (SSH config, git config)
- Non-sensitive settings

## Future Enhancements

- Support for `.gitignore_global`
- macOS system preferences (defaults write commands)
- Browser bookmarks/extensions
- Database backup of data.json to SQLite
- Encryption for sensitive-but-not-secret data
- Differential backups (only changed files)
