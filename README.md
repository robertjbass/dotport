# Dev Machine Backup & Restore

A comprehensive CLI tool for backing up and restoring development machine configurations, dotfiles, and settings across macOS and Linux.

## Features ✅

### Completed

- ✅ **Interactive Setup Wizard** - Step-by-step configuration with back navigation
- ✅ **OS Detection** - Automatic detection of macOS/Linux with distro support
- ✅ **Multi-OS Support** - Manage configs for multiple operating systems/distros
- ✅ **GitHub Integration** - Create/clone repos, authenticate via device flow
- ✅ **Automatic File Discovery** - Scans 40+ common config locations:
  - Shell configs (.zshrc, .bashrc, .profile)
  - Git configuration (.gitconfig, global ignore, commit templates)
  - Editor/IDE configs (VS Code, Cursor, Windsurf, Vim, Neovim, JetBrains, Sublime, Emacs, Zed)
  - Developer tools (npm, yarn, pnpm, Python, Ruby, Docker, Kubernetes, Terraform)
  - Terminal emulators (Ghostty, Alacritty, Kitty, WezTerm, Hyper)
  - SSH configuration (excludes private keys automatically)
  - macOS-specific (Hammerspoon, Karabiner, Raycast, Homebrew)
  - Linux-specific (window managers, keyd, GNOME extensions)
- ✅ **Smart File Selection** - Checkbox interface with file size display
- ✅ **Manual File Addition** - Add custom files not in default scan
- ✅ **Secret File Management** - Local file storage with automatic .gitignore
- ✅ **Directory Structure Preservation** - Maintains nested paths (e.g., `.ssh/config`)
- ✅ **Multi-OS Directory Organization** - Files stored in `macos/`, `debian/`, `ubuntu/`, etc.
- ✅ **SSH Key Protection** - Automatically excludes private keys, authorized_keys, known_hosts
- ✅ **Backup Preview** - Shows what will be copied before execution
- ✅ **Schema Export** - Saves TypeScript schema to dotfiles repo
- ✅ **Git Commit & Push** - Optional automatic commit/push workflow
- ✅ **Symlink Creation** - Interactive per-file symlink setup with backup

### Current Status

**Setup Flow (Complete)**:
1. OS Detection → Operating system and distribution
2. Repository → GitHub/Git service selection and authentication
3. Multi-OS → Support for multiple operating systems/distros
4. Secrets → Local file secret management configuration
5. File Selection → Choose files to backup from auto-discovered list
6. Backup → Preview and execute file backup
7. Git Commit/Push → Optional commit and push to remote
8. Symlinks → Optional per-file symlink creation
9. Complete → Summary and next steps

## Usage

```bash
# Install dependencies
pnpm install

# Run setup wizard
pnpm run setup
```

## Project Structure

```
dev-machine-backup-restore/
├── scripts/
│   ├── setup.ts              # Main interactive setup wizard
│   └── test-scripts/         # Test scripts
├── utils/
│   ├── file-discovery.ts     # Automatic config file scanning
│   ├── file-backup.ts        # File copying and backup logic
│   ├── github-auth.ts        # GitHub device flow authentication
│   ├── github-repo.ts        # Repository operations
│   ├── git-url-parser.ts     # Git URL parsing and validation
│   ├── schema-export.ts      # Schema export to repo
│   ├── constants.ts          # Linux distros and constants
│   └── config.ts             # App configuration management
├── types/
│   └── backup-config.ts      # TypeScript schema definitions
├── templates/
│   └── dotfiles.gitignore    # Template for dotfiles repos
├── docs/
│   └── CONFIG-SCHEMA.md      # Schema documentation
└── CHANGELOG.md              # Detailed change history
```

## TODO - Next Steps

### High Priority

- [ ] **Restore Functionality**
  - [ ] Detect existing schema in dotfiles repo
  - [ ] Clone dotfiles repo on new machine
  - [ ] Parse schema to understand file structure
  - [ ] Copy files from repo to home directory
  - [ ] Create symlinks based on schema configuration
  - [ ] Support for multiple OS/distro restoration
  - [ ] Handle conflicts (existing files vs. repo files)

- [ ] **Package Manager Support**
  - [ ] Homebrew Bundle export/import (macOS)
  - [ ] apt package list export/import (Debian/Ubuntu)
  - [ ] dnf/yum package list (Fedora/RHEL)
  - [ ] pacman package list (Arch)
  - [ ] Snap/Flatpak package lists

- [ ] **Application Detection & Installation**
  - [ ] Detect installed applications
  - [ ] Generate installation scripts per OS/distro
  - [ ] Support for cask/mas on macOS
  - [ ] Support for AUR on Arch

### Medium Priority

- [ ] **GUI Server Detection (Linux)**
  - [ ] Detect X11 vs Wayland
  - [ ] Store server type in schema
  - [ ] Conditionally backup server-specific configs

- [ ] **Window Manager Support (Linux)**
  - [ ] i3/Sway config backup
  - [ ] Hyprland config backup
  - [ ] GNOME Shell extensions
  - [ ] KDE Plasma settings

- [ ] **Enhanced Secret Management**
  - [ ] Integration with system keychains
  - [ ] 1Password CLI integration
  - [ ] Bitwarden CLI integration
  - [ ] Age encryption for sensitive files

- [ ] **Update Workflow**
  - [ ] `pnpm run update` command to re-run backup
  - [ ] Detect changed files since last backup
  - [ ] Incremental updates to dotfiles repo
  - [ ] Optional automatic commit messages

### Low Priority

- [ ] **Interactive File Browser**
  - [ ] Tree-view file selection
  - [ ] Search/filter functionality
  - [ ] Preview file contents

- [ ] **Diff and Sync**
  - [ ] Show diffs between local and repo versions
  - [ ] Selective sync (pull specific files)
  - [ ] Conflict resolution UI

- [ ] **Advanced Features**
  - [ ] Multiple profile support
  - [ ] Machine-specific configs
  - [ ] Templating for dynamic configs
  - [ ] Pre/post install hooks

## Schema

The tool generates a comprehensive TypeScript schema stored in your dotfiles repository:

```typescript
interface BackupConfig {
  version: string
  os: OperatingSystem
  backup: {
    service: 'github' | 'gitlab' | 'other-git' | 'none'
    repository?: string
    multiOS: {
      enabled: boolean
      supportedOS: OperatingSystem[]
      linuxDistros?: string[]
    }
    dotfiles: {
      enabled: boolean
      location: string
    }
  }
  secrets: {
    method: 'local-file' | '1password' | 'bitwarden' | 'none'
    location?: string
  }
  trackedFiles: {
    [os: string]: {
      files: TrackedFile[]
    }
  }
}
```

## Security

- ✅ SSH private keys automatically excluded from backup
- ✅ Secret files handled separately (not tracked in git)
- ✅ .gitignore template includes common secrets
- ✅ GitHub token stored locally (not in schema)
- ✅ Automatic .backup creation when symlinking over existing files

## License

MIT

## Contributing

This project is under active development. See CHANGELOG.md for recent updates.

---

**Last Updated**: Session 5 - 2025-01-17
**Status**: Setup wizard complete, restore functionality coming next
