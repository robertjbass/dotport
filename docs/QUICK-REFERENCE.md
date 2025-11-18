# Quick Reference Guide

## Key File Locations & Purposes

### Entry Points
- **`scripts/setup.ts`** - Main interactive setup wizard (1808 lines)
  - State machine handling 9-step flow
  - All prompts and menu logic
  - Back navigation implementation
  
- **`scripts/index.ts`** - Entry point dispatcher
  - Loads and executes specified script
  - OS detection and validation

### Core Utilities

#### File Management
- **`utils/file-discovery.ts`** - Auto-discovery engine
  - Scans 40+ config file locations
  - Categorization and filtering
  - File existence checking
  
- **`utils/file-backup.ts`** - Backup execution
  - Copies files to repo
  - SSH key exclusion
  - Symlink creation

#### GitHub Integration
- **`utils/github-auth.ts`** - Device flow authentication
  - GitHub token management
  - User authentication
  
- **`utils/github-repo.ts`** - Repository operations
  - Check repo existence
  - Create repositories
  - Add .gitignore files

#### Configuration
- **`utils/config.ts`** - Configuration management
  - Platform-specific paths
  - Settings persistence
  - Secure file permissions (0600)
  
- **`utils/constants.ts`** - Constants & lookups
  - Linux distribution list
  - Default values

#### Schema & Export
- **`utils/schema-export.ts`** - Schema exporting
  - Sanitize sensitive data
  - Export to repo
  - Generate README

- **`utils/git-url-parser.ts`** - URL validation
  - Parse git URLs
  - Validate format

### Type Definitions
- **`types/backup-config.ts`** - Complete TypeScript schema
  - All configuration interfaces
  - Default configuration values
  - Helper functions

### System Integration
- **`clients/script-session.ts`** - Environment detection
  - OS detection
  - Shell info
  - Home directory

### Templates
- **`templates/dotfiles.gitignore`** - .gitignore template
  - Secret file patterns
  - Standard exclusions

---

## Configuration Locations

### User Data (Platform-Specific)

**macOS**
```
~/.dev-machine-backup-restore/
├── config.json           # App configuration
├── github-auth.json      # GitHub token (0600)
├── backup-config.json    # User preferences
└── cache/
```

**Linux**
```
~/.config/dev-machine-backup-restore/
├── config.json
├── github-auth.json
├── backup-config.json
└── cache/
```

---

## Command Reference

```bash
# Run setup wizard
pnpm run setup

# Alternative syntax
pnpm run script setup

# View available scripts
pnpm run script

# Install dependencies
pnpm install
```

---

## Data Flow Summary

```
User Input (Prompts)
    ↓
Configuration Object
    ├── OS selection
    ├── Repository setup
    ├── Secret management
    ├── File selection
    └── Backup execution
    ↓
Saved to: ~/.dev-machine-backup-restore/backup-config.json
    ↓
Files Copied to Repository
    └── Organized by OS/distro: macos/, debian/, ubuntu/, etc.
    ↓
Schema Exported
    └── /schema/backup-config.json
    ↓
Git Commit & Push (optional)
    ↓
Symlinks Created (optional)
    └── Per-file with automatic .backup of existing files
```

---

## Back Navigation Flow

```
promptOperatingSystem(true)
    └─ Can't go back (first step)

promptConfigFileStorage(true)
    └─ Back → OS Detection

promptSecretStorage(true)
    └─ Back → Config File Storage

[Confirmation Menu]
    └─ Back → Secret Storage

promptFileSelection()
    └─ Back → Confirmation

promptAndExecuteBackup()
    └─ Back → File Selection

promptGitCommitAndPush()
    └─ No back (workflow step)

promptSymlinkCreation()
    └─ No back (final workflow)
```

---

## File Categories in Discovery

### Automatically Discovered (40+ locations)

1. **Shell** (7) - .bashrc, .zshrc, .profile, etc.
2. **Git** (5) - .gitconfig, .gitignore_global, etc.
3. **Secrets** (9) - .env, .env.sh, .npmrc, .docker/config.json, etc.
4. **Dev Tools** (20+) - npm, yarn, pnpm, python, ruby, docker, k8s, aws, terraform, tmux
5. **SSH** (1) - .ssh/config (keys auto-excluded)
6. **Editors** (26+) - VS Code, Cursor, Windsurf, JetBrains, Sublime, Vim, Neovim, Emacs, Zed
7. **Terminals** (5) - Ghostty, Alacritty, Kitty, WezTerm, Hyper
8. **macOS Apps** (6) - Hammerspoon, Karabiner, Raycast, Finicky, SKHD, Yabai
9. **Linux Apps** (8) - i3, Sway, Hyprland, GNOME extensions, keyd, flameshot, ulauncher

### Secret Files (Auto-Excluded)
- .env, .env.sh, .secrets, .zshsecrets, .bashsecrets
- .npmrc, .pypirc, .docker/config.json, .aws/credentials

---

## Key Functions & Their Locations

### Main Prompts (setup.ts)
- `promptOperatingSystem()` - line 102
- `promptConfigFileStorage()` - line 176
- `promptMultiOSSupport()` - line 474
- `promptCloneLocation()` - line 570
- `promptFileSelection()` - line 632
- `promptManualFileAddition()` - line 773
- `promptSecretStorage()` - line 859
- `promptAndExecuteBackup()` - line 1187
- `promptGitCommitAndPush()` - line 1281
- `promptSymlinkCreation()` - line 1350

### Discovery Functions (file-discovery.ts)
- `discoverConfigFiles()` - Scans all locations
- `getExistingFiles()` - Filters to found files only
- `groupFilesByCategory()` - Categorizes files
- `formatFileForDisplay()` - Display formatting
- `getCategoryDisplayName()` - Category labels

### Backup Functions (file-backup.ts)
- `backupFilesToRepo()` - Execute backup
- `generateRepoPath()` - Create repo paths
- `previewBackup()` - Show what will be backed up
- `shouldExcludeFile()` - SSH key filtering

### GitHub Functions (github-repo.ts)
- `checkRepositoryExists()` - Check if repo exists
- `createRepository()` - Create new repo
- `addGitignoreToRepo()` - Add .gitignore

### Configuration Functions (config.ts)
- `getConfig()` - Load configuration
- `saveConfig()` - Save configuration
- `ensureDirectories()` - Create directories with secure permissions

---

## Important Symbols & Constants

```typescript
// Back button indicator
const BACK_OPTION = Symbol('back')

// Step tracking
type Step = 'os' | 'config' | 'secrets' | 'confirm' | 'files' | 'backup'

// Default repository name
DEFAULT_REPO_NAME = 'dotfiles'

// Default clone location
DEFAULT_CLONE_LOCATION = '~'

// Linux distributions (22 total)
COMMON_DISTRIBUTIONS = 8
ALL_LINUX_DISTRIBUTIONS = 22
```

---

## Testing the Project

### Prerequisites
```bash
cd /home/user/dev-machine-backup-restore
pnpm install
```

### Run Setup
```bash
pnpm run setup
```

### Expected Flow
1. OS detection (auto-detects)
2. Config file storage (choose GitHub or skip)
3. Secret management (choose storage method)
4. Configuration summary (review and confirm)
5. File selection (choose files to backup)
6. Backup execution (copy files to repo)
7. Git commit/push (optional)
8. Symlink creation (optional)
9. Completion message

### What Gets Created
- `~/.dev-machine-backup-restore/backup-config.json` - Your configuration
- `~/dotfiles/` - Repository with backed-up files
  - `macos/` or `debian/` etc - OS-specific folders
  - `schema/backup-config.json` - Schema export
  - `.gitignore` - Auto-added

---

## Known Limitations

1. **No restore workflow yet** - Can backup but can't restore on new machine
2. **Package managers** - Can't backup installed packages
3. **No incremental updates** - Must re-run setup to update
4. **Directory symlinks** - Only files can be symlinked, not directories
5. **No encryption** - Secret files backed up as-is
6. **Special characters** - May not handle all edge cases in paths

---

## Dependencies Breakdown

| Package | Purpose | Version |
|---------|---------|---------|
| `chalk` | Colored console output | ^5.6.2 |
| `inquirer` | Interactive CLI prompts | ^12.11.0 |
| `@octokit/rest` | GitHub API client | ^22.0.1 |
| `simple-git` | Git operations | ^3.30.0 |
| `cli-progress` | Progress bars | ^3.12.0 |
| `diff` | File diffing | ^8.0.2 |
| `tsx` | TypeScript execution | ^4.20.6 |
| `@types/node` | Node.js types | ^24.10.1 |

---

## Next Development Priorities

1. **Restore Command** - `pnpm run restore`
   - Clone dotfiles repo
   - Read schema
   - Restore files to home directory
   - Recreate symlinks

2. **Package Manager Support**
   - Homebrew Bundle (macOS)
   - apt/dnf (Linux)
   - pacman (Arch)

3. **Update Workflow** - `pnpm run update`
   - Detect changed files
   - Incremental backups
   - Smart commit messages

4. **Application Detection**
   - Detect installed apps
   - Generate install scripts
   - Per-platform app lists

---

**Last Updated**: Session 5 Summary (Jan 17, 2025)
**Project Status**: Setup wizard complete, restore functionality coming next
