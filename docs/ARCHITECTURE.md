# Dotport Backup & Restore Application Architecture

## Project Overview

**Dotport** is a comprehensive CLI tool for backing up and restoring development machine configurations, dotfiles, and settings across macOS and Linux platforms. It automates the process of migrating configurations to new machines through an interactive backup wizard and restore system.

---

## 1. MAIN ENTRY POINTS

### Primary Entry Point: Interactive Backup Wizard

**File**: `/home/user/dotport/scripts/backup.ts`
- **Function**: `export default async function backup()` (line 2547)
- **Purpose**: Orchestrates the entire interactive setup wizard
- **Invoked by**: Script selector in `/home/user/dotport/scripts/index.ts`

### Script Selector Menu

**File**: `/home/user/dotport/scripts/index.ts`
- **Purpose**: Dynamically loads available scripts from the `scripts/` directory
- **Displays**: Interactive menu to choose between `backup`, `restore`, and other scripts
- **Flow**:
  1. Scans `scripts/` directory for `.ts` files
  2. Merges with `package.json` scripts
  3. Prompts user to select script
  4. Dynamically imports and executes selected script

### Restore Entry Point

**File**: `/home/user/dotport/scripts/restore.ts`
- **Function**: `export default async function restore()` (line 861)
- **Purpose**: Interactive restore wizard for restoring backed-up configurations

---

## 2. INTERACTIVE BACKUP FLOW (STEP-BY-STEP)

The backup wizard implements a state machine with 7 steps supporting back navigation:

```
┌─ Step 1: OS Detection ─┐
│ (detectOS, promptOperatingSystem)
└──────────────────────┬─┘
                       │
┌─ Step 2: Shell Selection ─┐
│ (detectShell, promptShell)
└──────────────────────┬─┘
                       │
┌─ Step 3: Config File Storage Setup ─┐
│ (promptConfigFileStorage, handleRepositorySetup)
└──────────────────────┬─┘
                       │
┌─ Step 4: Secret Management Setup ─┐
│ (promptSecretStorage)
└──────────────────────┬─┘
                       │
┌─ Step 5: Configuration Confirmation ─┐
│ (displaySummary)
└──────────────────────┬─┘
                       │
┌─ Step 6: File Selection & Detection ─┐
│ (promptSystemDetection, promptFileSelection, promptManualFileAddition)
└──────────────────────┬─┘
                       │
┌─ Step 7: Backup Execution & Git Ops ─┐
│ (promptAndExecuteBackup, promptGitCommitAndPush, saveConfiguration)
│ (promptSymlinkCreation)
└──────────────────────┬─┘
                       │
                   Complete
```

### Key Functions in Backup Flow

| Step | Function | Purpose |
|------|----------|---------|
| 1 | `detectOS()`, `promptOperatingSystem()` | Detect/confirm macOS/Linux |
| 2 | `detectShell()`, `promptShell()` | Detect/confirm bash/zsh/fish |
| 3 | `promptConfigFileStorage()`, `handleRepositorySetup()` | GitHub setup, create/clone repo |
| 4 | `promptSecretStorage()` | Configure secret file management (local/cloud/git) |
| 5 | `displaySummary()` | Review all configuration choices |
| 6 | `promptSystemDetection()` | Scan for installed runtimes, packages, extensions |
| 6 | `promptFileSelection()` | Interactive checkbox to select files from auto-discovered list |
| 6 | `promptManualFileAddition()` | Add custom files not in default scan |
| 7 | `promptAndExecuteBackup()` | Copy selected files to repo with backup preview |
| 7 | `promptGitCommitAndPush()` | Optional git commit and push to remote |
| 7 | `saveConfiguration()` | Persist setup choices to local config |
| 7 | `promptSymlinkCreation()` | Optional per-file symlink setup |

---

## 3. BACKUP SCHEMA & DATA STRUCTURE

### Primary Schema Definition

**File**: `/home/user/dotport/types/backup-schema.ts`

The schema defines the backup data structure stored in the dotfiles repository:

```typescript
type BackupSchema = {
  version: string                        // Schema version
  darwin?: DarwinConfig                  // macOS-specific config
  linux?: LinuxConfig                    // Linux-specific config
  shared: SharedConfig                   // Shared across OSes
}
```

### Configuration Schema

**File**: `/home/user/dotport/types/backup-config.ts`

This is the newer, refactored schema supporting multi-machine backups:

```typescript
type BackupConfig = {
  version: string                        // Schema version (e.g., "1.0.0")
  metadata: MetadataConfig              // Creation/update timestamps
  repo: RepoMetadata                    // Git repo details
  systems: SystemMetadata[]             // Array of machine metadata
  dotfiles: {
    [machineId: string]: MachineConfig  // Machine-specific config
  }
}

type MachineConfig = {
  'tracked-files': MachineTrackedFilesConfig  // Files backed up
  secrets: MachineSecretsConfig               // Secret management
  symlinks: SymlinksConfig                    // Symlink creation rules
  packages: MachinePackagesConfig             // Package managers
  applications: MachineApplicationsConfig     // Installed apps
  extensions: MachineExtensionsConfig         // Editor extensions
  services: MachineServicesConfig             // System services
  settings: MachineSettingsConfig             // System settings
  runtimes: MachineRuntimesConfig             // Node, Python, Ruby, etc.
}

type SystemMetadata = {
  os: 'macos' | 'linux' | 'windows'
  distro: string                     // e.g., 'darwin', 'debian', 'ubuntu'
  nickname: string                   // e.g., 'macbook-air-m2'
  repoPath: string                   // Machine ID: <os>-<distro>-<nickname>
  shell: 'bash' | 'zsh' | 'fish' | 'other'
  shellConfigFile: string            // e.g., '.zshrc'
  displayServer?: 'x11' | 'wayland' | 'unknown'  // Linux only
  desktopEnvironment?: string        // Linux only
}

type DotfileConfig = {
  filename: string
  detectedLocally: boolean
  dir: string
  path: string
  backupPath: string
  content: string | null
  remoteGitLocation: string | null
}
```

### Key Data Structures

**Tracked Files**:
```typescript
type TrackedFile = {
  name: string              // e.g., '.bashrc'
  sourcePath: string        // Home path: '~/.bashrc'
  repoPath: string          // Repo path: 'macos-darwin-mbp/.bashrc'
  symlinkEnabled: boolean
  tracked: boolean          // Whether tracked in git
  containsSecrets?: boolean
}
```

**Package Managers** (macOS):
```typescript
type DarwinPackages = {
  homebrew: { formulae: string[], casks: string[], taps: string[] }
  npm: { global: string[] }
  pnpm: { global: string[] }
  yarn: { global: string[] }
  pip: { packages: string[] }
  pipx: { packages: string[] }
  bun: { global: string[] }
  deno: { installed: string[] }
}
```

**Package Managers** (Linux):
```typescript
type LinuxPackages = {
  apt: { packages: string[], ppas: string[] }
  snap: { packages: string[] }
  flatpak: { packages: string[], remotes: string[] }
  npm: { global: string[] }
  pnpm: { global: string[] }
  yarn: { global: string[] }
  pip: { packages: string[] }
  pipx: { packages: string[] }
  bun: { global: string[] }
  deno: { installed: string[] }
}
```

**Runtimes**:
```typescript
type Runtimes = {
  node: { manager: string, defaultVersion: string | null, installedVersions: string[] }
  python: { defaultVersion: string | null, installedVersions: string[] }
  ruby: { defaultVersion: string | null, installedVersions: string[] }
  go: { version: string | null }
  rust: { version: string | null }
  java: { defaultVersion: string | null, installedVersions: string[] }
  databases: { mysql, postgresql, mongodb, redis, sqlite }
}
```

---

## 4. SCHEMA GENERATION & EXPORT

### Schema Builder

**File**: `/home/user/dotport/utils/schema-builder.ts`
- **Function**: `buildBackupConfig()` - Constructs BackupConfig from setup wizard data
- **Purpose**: Converts user choices into structured BackupConfig
- **Input**: Setup options (OS, machine nickname, distro, repo info, tracked files)
- **Output**: Complete BackupConfig object

### Schema Export

**File**: `/home/user/dotport/utils/schema-export.ts`

**Key Functions**:
1. `exportSchemaToRepo()` - Exports schema.json to dotfiles repository
   - Merges with existing schema for multi-machine support
   - Sanitizes sensitive information (removes tokens)
   - Saves to `schema.json` in repo root

2. `createSchemaReadme()` - Creates `SCHEMA.md` documentation

**Export Location**: `<dotfiles-repo>/schema.json`

---

## 5. FILE DISCOVERY & SELECTION PROCESS

### File Discovery System

**File**: `/home/user/dotport/utils/file-discovery.ts`

**Scans 40+ common config locations:**
- Shell configs: `.zshrc`, `.bashrc`, `.bash_profile`, `.p10k.zsh`, `.tmux.conf`
- Git: `.gitconfig`, `.gitignore_global`, `.gitmessage`
- Editors: VS Code, Cursor, Windsurf, Vim, Neovim, JetBrains, Sublime, Emacs, Zed
- Developer tools: npm, yarn, pnpm, Python, Ruby, Docker, Kubernetes, Terraform, AWS
- Terminal emulators: Ghostty, Alacritty, Kitty, WezTerm, Hyper
- SSH: `.ssh/config` (excludes private keys)
- macOS-specific: Hammerspoon, Karabiner, Raycast, Homebrew
- Linux-specific: Window managers, keyd, GNOME extensions

**File Categories**:
```typescript
type DiscoveredFile = {
  name: string                    // Display name
  path: string                    // Absolute path
  relativePath: string            // Relative to home
  category: 'shell'|'secrets'|'git'|'devtools'|'ssh'|'editor'|'terminal'|'app-config'|'keybinding'|'other'
  exists: boolean
  size?: number
  isDirectory: boolean
}
```

### File Selection Process

**Function**: `promptFileSelection()` in `/home/user/dotport/scripts/backup.ts`

1. **Discover Files**: Automatically scan user's home directory
2. **Group by Category**: Shell, Git, Editors, Terminals, etc.
3. **Display Checkboxes**: Show files with size information
4. **User Selection**: Multi-select interface for choosing files
5. **Manual Addition**: Add custom files not in default scan
6. **Preview Backup**: Show what will be backed up

---

## 6. BACKUP EXECUTION & STORAGE

### File Backup Utility

**File**: `/home/user/dotport/utils/file-backup.ts`

**Key Functions**:
- `backupFilesToRepo()` - Copies selected files to repo
- `generateRepoPath()` - Creates repo paths preserving directory structure
- `previewBackup()` - Shows backup preview before execution
- `shouldExcludeFile()` - Filters SSH private keys, third-party extensions

**Backup Process**:
1. Validates file paths
2. Creates necessary directories in repo
3. Copies files while preserving structure
4. Skips sensitive files (private keys, etc.)
5. Returns success/failure report with file counts

**Exclusion Rules**:
- SSH private keys: `id_rsa`, `id_dsa`, `id_ecdsa`, `id_ed25519`
- Known hosts and authorized keys
- Third-party GNOME extensions (keeps only @custom)

---

## 7. DATA PERSISTENCE & CONFIGURATION

### Configuration Management

**File**: `/home/user/dotport/utils/config.ts`

**Configuration Locations**:
- macOS: `~/.dev-machine-backup-restore/`
- Linux: `~/.config/dev-machine-backup-restore/`
- Windows: `%APPDATA%\dev-machine-backup-restore\`

**Directory Structure**:
```
~/.dev-machine-backup-restore/
├── config.json           # App configuration
├── backup-config.json    # User's backup configuration
├── github-auth.json      # GitHub authentication token
└── cache/               # Cache directory
```

**AppConfig Type**:
```typescript
type AppConfig = {
  version: string
  paths: {
    dataDir: string           // Root directory
    githubAuth: string        // Auth file path
    backupConfig: string      // Config file path
    cache: string            // Cache directory path
  }
  preferences: {
    autoRefreshTokens: boolean
    verbose: boolean
  }
  platform: {
    os: 'darwin' | 'linux' | 'windows' | 'other'
    homeDir: string
  }
}
```

### Backup Configuration Persistence

**Function**: `saveConfiguration()` in `/home/user/dotport/scripts/backup.ts`

Saves user's setup choices to `backup-config.json` for later reference and re-use.

---

## 8. SYSTEM DETECTION & RUNTIME DISCOVERY

### Runtime Detection

**File**: `/home/user/dotport/utils/runtime-detection.ts`

**Detects**:
- Node.js: Version manager (fnm, nvm, n, asdf), default version, installed versions
- Python: Default version, installed versions
- Ruby: Default version, installed versions
- Go, Rust: Version
- Java: Default version, installed versions
- Databases: MySQL, PostgreSQL, MongoDB, Redis, SQLite

**Functions**:
- `detectAllRuntimes()` - Comprehensive runtime detection
- `detectAvailableNodeManagers()` - Identifies Node.js version managers
- `detectNodeVersions()` - Lists installed Node versions

### Package Detection

**File**: `/home/user/dotport/utils/package-detection.ts`

**Detects Package Managers**:
- macOS: Homebrew (formulae, casks, taps), npm, pnpm, yarn, pip, pipx, bun, deno
- Linux: apt (packages, PPAs), snap, flatpak, npm, pnpm, yarn, pip, pipx, bun, deno

**Export Options**: Can export package lists to files for later restoration

### Editor/Extension Detection

**File**: `/home/user/dotport/utils/editor-detection.ts`

**Detects**:
- VS Code, VS Code Insiders, Cursor, Windsurf
- Settings files, keybindings, extensions list
- Exports extension manifest for restoration

### Linux-Specific Detection

**File**: `/home/user/dotport/utils/linux-detection.ts`

**Detects**:
- Display server (X11 vs Wayland)
- Desktop environment (GNOME, KDE, i3, Sway, etc.)
- Stores metadata in schema for multi-distro support

**File**: `/home/user/dotport/utils/dconf-export.ts`
- Exports GNOME settings and keybindings
- Uses `dconf dump` for system preferences

---

## 9. GIT & REPOSITORY OPERATIONS

### GitHub Authentication

**File**: `/home/user/dotport/utils/github-auth.ts`

**Flow**:
1. Device code authentication (no password entry)
2. Stores token in `github-auth.json`
3. Auto-refresh before expiration

### Repository Management

**File**: `/home/user/dotport/utils/github-repo.ts`

**Functions**:
- `checkRepositoryExists()` - Check if repo exists on GitHub
- `createRepository()` - Create new repo with GitHub CLI
- `addGitignoreToRepo()` - Add `.gitignore` for secrets

### Git Operations

**File**: `/home/user/dotport/utils/git-operations.ts`

**Functions**:
- `getGitStatus()` - Check repo status
- `stageAllChanges()` - Stage files for commit
- `createGitCommit()` - Create commit with message
- `pushToRemote()` - Push to GitHub
- `getCurrentBranch()` - Get current branch

**Commit Workflow**:
1. Stage all changes
2. Create commit (optional)
3. Push to remote (optional)

---

## 10. RESTORE PROCESS

### Restore Entry Point

**File**: `/home/user/dotport/scripts/restore.ts`
- **Function**: `export default async function restore()` (line 861)

### Restore Workflow

```
1. Parse Restore Mode (live vs. test)
2. Find Dotfiles Repository
3. Load Backup Data (schema.json)
4. Select Machine Config
5. Choose What to Restore:
   - Files
   - Packages
   - Runtimes
   - Backups Management
6. Restore Selected Items
7. Create Symlinks (optional)
```

### Key Restore Functions

| Function | Purpose |
|----------|---------|
| `loadBackupData()` | Load schema.json from repo |
| `restoreDotfiles()` | Restore backed-up files |
| `restorePackages()` | Install backed-up packages |
| `restoreRuntimes()` | Install runtime versions |
| `promptFileRestoreAction()` | Choose restore method per file |
| `manageBackupsMenu()` | Manage local backups |

### Restore Actions

- **Link**: Create symlink to backed-up file
- **Copy**: Copy backed-up file to home directory
- **Replace**: Overwrite existing file
- **Skip**: Don't restore this file

---

## 11. INTERACTIVE UI & PROMPT SYSTEM

### Prompt Helpers

**File**: `/home/user/dotport/utils/prompt-helpers.ts`

**Key Features**:
- Back navigation support throughout workflow
- Progress indicators showing step numbers
- Summary sections with formatted output
- Grouped choices with separators
- Confirmation dialogs
- Error/success/warning/info messages

**Special Navigation Symbol**:
```typescript
export const BACK_OPTION = Symbol('back')
```

**UI Components**:
```typescript
displayWelcome()           // Welcome banner
displayStepProgress()      // Step progress indicator
displayDivider()          // Visual separator
displaySummarySection()   // Formatted summary
displayError()            // Error message
displaySuccess()          // Success message
displayWarning()          // Warning message
displayInfo()             // Info message
selectFromList()          // List selection with back
selectMultiple()          // Multi-select checkboxes
confirmAction()           // Yes/No with back
promptInput()             // Text input
```

---

## 12. CONFIGURATION & SETUP CONFIG TYPES

### Setup Configuration (Interactive Choices)

```typescript
type SetupConfig = {
  os: OperatingSystem                         // User's OS choice
  configFiles: {
    versionControl: boolean
    service?: 'github' | 'gitlab' | 'none'
    gitRepoUrl?: string
    cloneLocation?: string
  }
  secrets: {
    enabled: boolean
    storageType?: 'local-file' | 'cloud' | 'git-repo'
  }
  shell?: string
  machineNickname?: string
  trackedFiles?: TrackedFile[]
}
```

---

## 13. DATA FLOW DIAGRAM (BACKUP PROCESS)

```
User Runs: pnpm backup
        ↓
scripts/index.ts (Script Selector)
        ↓
scripts/backup.ts (Main Backup Function)
        ↓
┌─────────────────────────────────────────────────────┐
│ Interactive Wizard (State Machine)                   │
│ ├─ OS Detection                                      │
│ ├─ Shell Selection                                   │
│ ├─ Repository Setup (GitHub)                         │
│ ├─ Secret Storage Configuration                      │
│ ├─ System Detection (Runtimes, Packages, Editors)    │
│ ├─ File Discovery & Selection                        │
│ ├─ Manual File Addition                              │
│ └─ Configuration Confirmation                        │
└─────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────┐
│ Schema Building                                       │
│ ├─ schema-builder.ts: buildBackupConfig()            │
│ └─ Creates structured BackupConfig                   │
└─────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────┐
│ File Backup                                           │
│ ├─ file-backup.ts: backupFilesToRepo()               │
│ ├─ Copy files to repo (preserving structure)         │
│ ├─ Skip sensitive files (SSH keys, etc.)             │
│ └─ Generate backup report                            │
└─────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────┐
│ Schema Export                                         │
│ ├─ schema-export.ts: exportSchemaToRepo()            │
│ ├─ Save schema.json to repo                          │
│ ├─ Merge with existing (multi-machine support)       │
│ └─ Create SCHEMA.md documentation                    │
└─────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────┐
│ Git Operations (Optional)                             │
│ ├─ Stage all changes                                 │
│ ├─ Create commit                                     │
│ └─ Push to remote                                    │
└─────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────┐
│ Symlink Creation (Optional)                           │
│ ├─ Prompt for each file                              │
│ ├─ Create symlinks from repo to home                 │
│ └─ Backup existing files                             │
└─────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────┐
│ Configuration Save                                    │
│ ├─ config.ts: saveConfiguration()                    │
│ ├─ Save setup choices to backup-config.json          │
│ └─ Location: ~/.dev-machine-backup-restore/          │
└─────────────────────────────────────────────────────┘
        ↓
    Complete
```

---

## 14. FILE MANIFEST

### Key Files by Function

**Entry Points & Scripts**:
- `/home/user/dotport/scripts/backup.ts` - Main interactive backup wizard
- `/home/user/dotport/scripts/restore.ts` - Interactive restore wizard
- `/home/user/dotport/scripts/index.ts` - Script selector menu

**Type Definitions**:
- `/home/user/dotport/types/backup-schema.ts` - Backup schema types (exported to repo)
- `/home/user/dotport/types/backup-config.ts` - Configuration types (user's local config)

**Core Utilities**:
- `/home/user/dotport/utils/schema-builder.ts` - Builds BackupConfig from setup
- `/home/user/dotport/utils/schema-export.ts` - Exports schema.json to repo
- `/home/user/dotport/utils/config.ts` - Manages local configuration
- `/home/user/dotport/utils/prompt-helpers.ts` - UI/prompt components

**File Discovery & Backup**:
- `/home/user/dotport/utils/file-discovery.ts` - Scans for config files
- `/home/user/dotport/utils/file-backup.ts` - Copies files to repo
- `/home/user/dotport/utils/file-pattern-loader.ts` - Loads discovery patterns

**System Detection**:
- `/home/user/dotport/utils/runtime-detection.ts` - Detects runtimes
- `/home/user/dotport/utils/package-detection.ts` - Detects package managers
- `/home/user/dotport/utils/editor-detection.ts` - Detects editors/extensions
- `/home/user/dotport/utils/linux-detection.ts` - Linux-specific detection
- `/home/user/dotport/utils/dconf-export.ts` - GNOME settings export

**Git & Repository**:
- `/home/user/dotport/utils/github-auth.ts` - GitHub authentication
- `/home/user/dotport/utils/github-repo.ts` - Repository management
- `/home/user/dotport/utils/git-operations.ts` - Git operations
- `/home/user/dotport/utils/git-url-parser.ts` - Parse git URLs

**Utilities**:
- `/home/user/dotport/utils/path-helpers.ts` - Path operations
- `/home/user/dotport/utils/constants.ts` - Constants (repo names, defaults)
- `/home/user/dotport/utils/shell-config.ts` - Shell configuration
- `/home/user/dotport/utils/secret-scanner.ts` - Scan for secrets in files
- `/home/user/dotport/utils/restore-backup.ts` - Restore functionality

**Configuration**:
- `/home/user/dotport/config/file-discovery-patterns.json` - File patterns to scan
- `/home/user/dotport/config/file-discovery-patterns.schema.json` - Schema validation

**Documentation**:
- `/home/user/dotport/README.md` - Project overview and features
- `/home/user/dotport/docs/CONFIG-SCHEMA.md` - Configuration schema documentation
- `/home/user/dotport/SIMPLIFY-PLAN.md` - Architecture simplification plan
- `/home/user/dotport/REFACTOR.md` - Refactoring documentation

---

## 15. KEY INSIGHTS

### Multi-Machine Support
- Each machine stored by unique ID: `<os>-<distro>-<nickname>`
- Single schema.json stores configurations for multiple machines
- Allows users to manage dotfiles for different computers

### Data Structure Organization
- **User's Local Config** (`~/.dev-machine-backup-restore/`):
  - Contains GitHub token, user preferences, local setup choices
  - NOT version controlled

- **Dotfiles Repository** (GitHub/Git):
  - Contains backed-up files and `schema.json`
  - Schema stored without sensitive tokens (sanitized)
  - Can be public or private

### Security Approach
- Secrets stored separately in local `.env.sh` file
- SSH private keys explicitly excluded from backup
- GitHub tokens stored only in local config, never in repo
- `.gitignore` automatically configured for secret files

### Back Navigation
- All prompts support "← Go back" option
- State machine tracks current step
- Users can correct choices without restarting

### Schema Merging
- When backing up from multiple machines, schemas merge intelligently
- Each machine's config preserved independently
- No conflicts between multi-OS configurations

---

## 16. TYPICAL BACKUP WORKFLOW

1. **Start**: User runs `pnpm backup`
2. **Welcome**: Script selector displays available scripts
3. **Select Backup**: User chooses interactive backup
4. **Detect OS**: System detects operating system (macOS/Linux)
5. **Confirm Shell**: System detects shell, user can confirm/change
6. **GitHub Setup**: 
   - User selects GitHub (or other git service)
   - Device code authentication (no password needed)
   - Choose existing repo or create new one
7. **Secrets Config**:
   - Enable/disable secret file management
   - Choose storage type (local, cloud, git repo, password manager)
8. **Review Config**: Display summary of all choices
9. **System Scan**:
   - Auto-detect runtimes (Node, Python, Ruby, etc.)
   - Scan for package managers (Homebrew, apt, etc.)
   - Detect installed editors (VS Code, etc.)
10. **File Discovery**:
    - Scan home directory for 40+ common config files
    - Display discovered files grouped by category
    - User multi-selects files to backup
11. **Manual Addition**: Add custom files not in default scan
12. **Backup Preview**: Show what will be copied
13. **Execute Backup**: Copy selected files to repo
14. **Export Schema**: Save schema.json to repo (sanitized)
15. **Git Commit** (optional): Stage, commit, and push to GitHub
16. **Symlinks** (optional): Create symlinks for each file
17. **Complete**: Display next steps and summary

