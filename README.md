# Dotport

**Port your dotfiles across machines with ease.**

Dotport is a comprehensive CLI tool that backs up and restores your development environment configuration files, settings, and packages. Never manually set up a new machine again.

## What Does It Do?

Dotport automatically:

- **Discovers** your configuration files (shell, editors, terminals, etc.)
- **Backs up** selected files to a GitHub repository
- **Tracks** installed packages, runtimes, and editor extensions
- **Restores** your entire setup on a new machine
- **Manages** secrets separately for security
- **Syncs** configurations across multiple machines and operating systems

## Quick Start

```bash
# Install dependencies
pnpm install

# Start interactive backup
pnpm backup

# Restore on a new machine
pnpm restore
```

## Features

### ✅ Completed Features

- **Interactive Backup Wizard** - Guided setup with step-by-step configuration
- **Multi-OS Support** - Works on macOS and Linux (Debian, Ubuntu, Arch, Fedora, etc.)
- **GitHub Integration** - Private repository backup with automatic authentication
- **Automatic File Discovery** - Scans for 40+ common config locations:
  - Shell configs (.zshrc, .bashrc, .profile)
  - Git configuration and global ignore
  - Editor configs (VS Code, Cursor, Windsurf, Vim, Neovim, JetBrains, etc.)
  - Terminal emulators (Ghostty, Alacritty, Kitty, WezTerm, Hyper)
  - Developer tools (npm, yarn, pnpm, Docker, Kubernetes, etc.)
  - macOS apps (Hammerspoon, Karabiner, Raycast)
  - Linux tools (i3, Sway, GNOME extensions, keyd)
- **Smart File Selection** - Checkbox interface with file sizes
- **Secret Management** - Local file storage with automatic .gitignore
- **Directory Structure Preservation** - Maintains nested paths
- **SSH Key Protection** - Automatically excludes private keys
- **Package Manager Export** - Homebrew, apt, cargo, gem, go, npm, pnpm, pip
- **Runtime Version Tracking** - Node.js, Python, Ruby, Go versions
- **VS Code Extensions** - Exports installed extensions list
- **Symlink Creation** - Interactive per-file symlink setup
- **GNOME Settings Export** - Keybindings and settings on Linux
- **Display Server Detection** - Detects Wayland/X11 on Linux
- **Complete Restore Wizard** - Restore files, packages, and settings

## System Requirements

- **Node.js** 24+ (recommended: use fnm or nvm)
- **pnpm** (or npm/yarn)
- **Git** installed and configured
- **macOS** or **Linux** (Debian, Ubuntu, Arch, Fedora, or derivatives)

## Installation

```bash
# Clone the repository
git clone https://github.com/robertjbass/dotport.git
cd dotport

# Install dependencies
pnpm install

# Run the backup wizard
pnpm backup
```

## Usage

### Backup Your Configuration

```bash
pnpm backup
```

Follow the interactive prompts to:

1. Confirm your system information (OS, shell, runtime)
2. Authenticate with GitHub (optional but recommended)
3. Set up your dotfiles repository
4. Configure secret management
5. Select files to back up
6. Execute backup and optionally commit/push to GitHub

### Restore on a New Machine

```bash
pnpm restore
```

The restore wizard will:

1. Find your existing dotfiles repository
2. Load your backup configuration
3. Let you choose what to restore (files, packages, runtimes)
4. Restore files with optional symlink creation
5. Install packages and runtimes based on your preferences

## Repository Structure

```
dotport/
├── scripts/
│   ├── backup.ts              # Interactive backup wizard
│   ├── restore.ts             # Interactive restore wizard
│   └── index.ts               # Script selector
├── utils/
│   ├── file-discovery.ts      # Config file scanning
│   ├── file-backup.ts         # File copying and backup
│   ├── github-auth.ts         # GitHub authentication
│   ├── github-repo.ts         # Repository operations
│   ├── schema-builder.ts      # Build backup configs
│   ├── schema-export.ts       # Export schema to repo
│   ├── package-detection.ts   # Detect package managers
│   ├── runtime-detection.ts   # Detect runtimes
│   └── ...                    # Other utilities
├── types/
│   ├── backup-config.ts       # TypeScript schema definitions
│   └── backup-schema.ts       # Repository schema types
├── docs/
│   └── SETUP.md               # Detailed setup guide
└── README.md                  # This file
```

## Your Dotfiles Repository

After running backup, your dotfiles repository will look like this:

```
dotfiles/
├── schema.json                           # Backup configuration
├── .gitignore                            # Excludes secrets
└── macos-darwin-my-machine/              # Machine-specific folder
    ├── .zshrc
    ├── .gitconfig
    ├── .config/
    │   ├── ghostty/
    │   └── ...
    └── Library/Application Support/
        └── Code/User/
```

## Security

- **SSH Private Keys** - Automatically excluded from backup
- **Secret Files** - Managed separately, never committed to git
- **GitHub Tokens** - Stored locally only (not in repository)
- **Automatic .gitignore** - Protects sensitive files

## Configuration Storage

### On Your Machine (Not Synced)

```
~/.dotport/config/                        # Linux/macOS
├── user-system.json                      # Your system configuration
└── github-auth.json                      # GitHub token (kept private)
```

### In Your Dotfiles Repository (Synced)

```
dotfiles/
├── schema.json                           # Sanitized backup configuration
└── <machine-id>/                         # Your backed up files
```

## Scripts

You can create new scripts with `pnpm create-script <script-name>`

## Contributing

This project is under active development. Contributions are welcome!

## License

MIT
