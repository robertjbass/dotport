# Dotport TODO

This document tracks completed features and planned improvements for Dotport.

---

## 📋 High Priority Tasks

### Production Readiness

- [ ] **Prepare installer script** - Create automated installation script for first-time users
- [ ] **Create build process** - Set up build pipeline to prepare JS entry point for npm
- [ ] **Create binary** - Package as standalone executable using pkg or similar
- [ ] **Publish to npm** - Make available as `npx dotport` or `npm install -g dotport`
- [ ] **Add version management** - Implement semver and version checking/updates
- [ ] **Create uninstall script** - Clean removal of all dotport files and configs

### Package Management

- [ ] **Package installation during restore** - Auto-install backed up packages
  - [ ] Homebrew Bundle import (macOS)
  - [ ] apt package installation (Debian/Ubuntu)
  - [ ] dnf/yum package installation (Fedora/RHEL)
  - [ ] pacman package installation (Arch)
  - [ ] Snap/Flatpak package installation
- [ ] **Homebrew Bundle import** - Restore all Homebrew packages from Brewfile

### Runtime Installation

- [ ] **Automatic runtime installation** - Install language runtimes via version managers
  - [ ] fnm/nvm for Node.js
  - [ ] pyenv for Python
  - [ ] rbenv for Ruby
  - [ ] gvm for Go
- [ ] **Version manager installation** - Auto-install fnm, nvm, pyenv, rbenv if missing

### Testing & Quality

- [ ] **Unit tests** - Add comprehensive test coverage
- [ ] **Integration tests** - Test full backup/restore workflows
- [ ] **CI/CD pipeline** - Automated testing and releases
- [ ] **Linting fixes** - Ensure all code passes lint checks
- [ ] **Type safety** - Fix all TypeScript strict mode issues

---

## 📌 Medium Priority Tasks

### User Experience

- [ ] **Update workflow** - Detect changed files since last backup
- [ ] **Incremental backups** - Only back up changed files
- [ ] **Interactive diff viewer** - Show diffs between local and repo versions
- [ ] **Conflict resolution UI** - Handle conflicts during restore
- [ ] **Progress indicators** - Better visual feedback during long operations
- [ ] **Error recovery** - Better handling of partial failures

### Application Detection

- [ ] **Detect installed applications** - Scan for GUI applications
- [ ] **Generate installation scripts** - Per-OS/distro app installation
- [ ] **Support for cask/mas** - macOS App Store apps (macOS)
- [ ] **Support for AUR** - Arch User Repository (Arch Linux)

### Linux-Specific Features

- [ ] **Window manager configs** - i3/Sway/Hyprland full config backup (currently only files)
- [ ] **KDE Plasma settings** - Export/import KDE configurations
- [ ] **Systemd services** - Backup and restore user systemd services

### Documentation

- [ ] **Video walkthrough** - Screen recording of backup/restore process
- [ ] **FAQ document** - Common questions and answers
- [ ] **Troubleshooting guide** - Solutions to common issues
- [ ] **Migration guide** - Help users migrate from other dotfile tools

---

## 🔮 Low Priority / Future Enhancements

### Advanced Features

- [ ] **Selective sync** - Choose which files to pull from repo
- [ ] **Scheduled backups** - Automatic periodic backups via cron/launchd

### File Management

- [ ] **Interactive file browser** - Tree-view file selection
- [ ] **Search/filter functionality** - Find files in backup
- [ ] **File preview** - View file contents before backup/restore
- [ ] **Diff viewer** - Compare local vs backed up versions

### Integration

- [ ] **PGP secret storage** - Store encrypted secrets (PGP-encrypted files in private GitHub repo)

### Quality of Life

- [ ] **Migrate from other tools** - Import from chezmoi, yadm, etc.
- [ ] **Dry-run mode** - Preview all changes before applying
- [ ] **Rollback support** - Undo last backup/restore
- [ ] **Automatic commit messages** - Generate descriptive commits

---

## ✅ Completed Features

### Core Functionality

- [x] Interactive backup wizard with step-by-step prompts
- [x] Interactive restore wizard with test mode
- [x] Multi-OS support (macOS and Linux)
- [x] Multi-machine backup support with unique machine IDs
- [x] OS and distribution detection (macOS, Debian, Ubuntu, Arch, Fedora, etc.)
- [x] Shell detection and configuration (.zshrc, .bashrc, .fish)

### File Management

- [x] Automatic file discovery (40+ common config locations)
- [x] Smart file selection with checkbox interface
- [x] Manual file addition support
- [x] Directory structure preservation for nested configs
- [x] File size display in selection interface
- [x] SSH key protection (automatic exclusion of private keys)
- [x] Multi-OS directory organization (macos/, debian/, ubuntu/, etc.)

### GitHub Integration

- [x] GitHub authentication with Personal Access Tokens
- [x] Token validation and permission checking
- [x] Repository creation (public/private)
- [x] Repository existence checking
- [x] Automatic .gitignore file generation
- [x] Git commit and push workflow
- [x] Clear GitHub token permission instructions in interactive prompt

### Secret Management

- [x] Secret file detection and handling
- [x] Local secret file storage (not committed to git)
- [x] Automatic .gitignore configuration for secrets
- [x] Support for .env, .env.sh, and shell export formats

### System Detection

- [x] Package manager detection and export (Homebrew, apt, cargo, gem, go, npm, pnpm, pip)
- [x] Runtime version tracking (Node.js, Python, Ruby, Go)
- [x] Editor extension detection (VS Code, Cursor, Windsurf)
- [x] Linux display server detection (X11 vs Wayland)
- [x] Linux desktop environment detection (GNOME, KDE, i3, Sway)
- [x] GNOME dconf export (keybindings and settings)

### Data & Schema

- [x] TypeScript schema for backup configuration
- [x] Schema export to dotfiles repository
- [x] Schema merging for multi-machine support
- [x] Backup metadata tracking (created, updated timestamps)
- [x] Schema documentation generation

### Restore Features

- [x] Dotfile restoration with file selection
- [x] Symlink creation with backup of existing files
- [x] Per-file restore actions (link, copy, replace, skip)
- [x] Backup management (view, restore, cleanup)
- [x] Test mode for safe restoration testing

---

## 📝 Notes

---

**Last Updated:** 2025-01-20
