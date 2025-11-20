# Dotport - Quick Reference Guide

## File Locations Quick Map

### Entry Points
- **Backup**: `/home/user/dotport/scripts/backup.ts` → `backup()` function
- **Restore**: `/home/user/dotport/scripts/restore.ts` → `restore()` function
- **Script Selector**: `/home/user/dotport/scripts/index.ts`

### Schema & Types
- **Backup Schema** (exported to repo): `/home/user/dotport/types/backup-schema.ts`
- **Config Schema** (local config): `/home/user/dotport/types/backup-config.ts`

### Core Backup Pipeline
```
File Discovery → Selection → Schema Building → File Backup → Schema Export → Git Ops → Symlinks
      ↓              ↓              ↓               ↓              ↓           ↓        ↓
   file-discovery  prompt-helpers  schema-builder  file-backup  schema-export git-operations
                                                                           github-repo.ts
                                                                           github-auth.ts
```

### Key Utilities
| Purpose | File | Main Function |
|---------|------|---------------|
| File Discovery | `utils/file-discovery.ts` | `getExistingFiles()` |
| File Selection | `scripts/backup.ts` | `promptFileSelection()` |
| Schema Building | `utils/schema-builder.ts` | `buildBackupConfig()` |
| File Backup | `utils/file-backup.ts` | `backupFilesToRepo()` |
| Schema Export | `utils/schema-export.ts` | `exportSchemaToRepo()` |
| Configuration | `utils/config.ts` | `getConfig()`, `saveConfig()` |
| UI Prompts | `utils/prompt-helpers.ts` | `selectFromList()`, `selectMultiple()` |
| GitHub Auth | `utils/github-auth.ts` | `authenticateWithGitHub()` |
| Repository | `utils/github-repo.ts` | `createRepository()`, `checkRepositoryExists()` |
| Git Operations | `utils/git-operations.ts` | `stageAllChanges()`, `createGitCommit()` |
| Runtime Detection | `utils/runtime-detection.ts` | `detectAllRuntimes()` |
| Package Detection | `utils/package-detection.ts` | `detectPackageManagers()` |
| Editor Detection | `utils/editor-detection.ts` | `detectInstalledEditors()` |
| GNOME Export | `utils/dconf-export.ts` | `exportGnomeSettings()` |

## Data Storage Locations

### User's Local Configuration (NOT in dotfiles repo)
```
~/.dev-machine-backup-restore/          (macOS)
~/.config/dev-machine-backup-restore/   (Linux)
├── config.json                # App configuration
├── backup-config.json         # Setup wizard choices
├── github-auth.json           # GitHub token
└── cache/                     # Cache directory
```

### Dotfiles Repository (in GitHub/Git)
```
<user-dotfiles-repo>/
├── schema.json                # Backup configuration (sanitized)
├── SCHEMA.md                  # Schema documentation
├── <machine-id>/              # Machine-specific files
│   ├── .zshrc
│   ├── .bashrc
│   └── ...
└── .gitignore                 # Excludes secret files
```

## Backup Flow (7 Steps)

| Step | Functions | Key Output |
|------|-----------|-----------|
| 1 | `detectOS()`, `promptOperatingSystem()` | OS: macOS/Linux |
| 2 | `detectShell()`, `promptShell()` | Shell: bash/zsh/fish |
| 3 | `promptConfigFileStorage()`, `handleRepositorySetup()` | GitHub repo setup |
| 4 | `promptSecretStorage()` | Secret management config |
| 5 | `displaySummary()` | Summary review |
| 6 | `promptSystemDetection()`, `promptFileSelection()` | Selected files array |
| 7 | `promptAndExecuteBackup()`, `promptGitCommitAndPush()`, `promptSymlinkCreation()` | Backup complete |

## Key Data Structures

### BackupConfig (New - Multi-Machine Support)
```typescript
{
  version: "1.0.0"
  metadata: { createdAt, updatedAt, lastBackup?, lastRestore? }
  repo: { repoType, repoName, repoUrl, repoOwner, branch, visibility }
  systems: [
    { os, distro, nickname, repoPath, shell, shellConfigFile, ... }
  ]
  dotfiles: {
    "macos-darwin-macbook-air-m2": { ... machine config ... }
    "linux-ubuntu-thinkpad": { ... machine config ... }
  }
}
```

### MachineConfig (Per-Machine Configuration)
```typescript
{
  'tracked-files': { cloneLocation, files[] }
  secrets: { enabled, secretFile, storage, trackedSecrets }
  symlinks: { enabled, strategy, conflictResolution }
  packages: { enabled, packageManagers[] }
  applications: { enabled, applications[] }
  extensions: { enabled, editors[] }
  services: { enabled, services[] }
  settings: { enabled, settings[] }
  runtimes: { enabled, runtimes[] }
}
```

### TrackedFile (Individual File Metadata)
```typescript
{
  name: ".zshrc"
  sourcePath: "~/.zshrc"
  repoPath: "macos-darwin-mbp/.zshrc"
  symlinkEnabled: true
  tracked: true
  containsSecrets?: false
}
```

## Navigation Pattern (Back Support)

All prompts use `BACK_OPTION` symbol for back navigation:

```typescript
import { BACK_OPTION } from '../utils/prompt-helpers'

// Check for back option
if (result === BACK_OPTION) {
  // Navigate to previous step
  currentStep = previousStep
  continue
}
```

## Important Constants

- **Config Directory Name**: `.dev-machine-backup-restore`
- **Schema Filename**: `schema.json`
- **Schema Documentation**: `SCHEMA.md`
- **Default Branch**: `main`
- **Default Repo Name**: `dotfiles`
- **Default Secret File**: `.env.sh`
- **Default Clone Location**: `~` (home directory)

## File Discovery Categories

- **shell**: `.zshrc`, `.bashrc`, etc.
- **git**: `.gitconfig`, `.gitignore_global`
- **secrets**: `.env`, `.env.sh`, `.npmrc`, AWS credentials
- **devtools**: npm, yarn, pnpm, Python, Ruby, Docker configs
- **ssh**: `.ssh/config` (private keys excluded)
- **editor**: VS Code, Cursor, Vim configs
- **terminal**: Ghostty, Alacritty configs
- **app-config**: macOS/Linux app configs
- **keybinding**: Karabiner, keyd configs
- **other**: Miscellaneous files

## Security Rules

1. **SSH Keys**: Always excluded from backup
   - `id_rsa`, `id_dsa`, `id_ecdsa`, `id_ed25519`
   - `authorized_keys`, `known_hosts`

2. **Secret Files**: Stored locally, not in repo
   - `.env`, `.env.sh`, `.npmrc`, `.pypirc`
   - AWS credentials, Docker config

3. **GitHub Tokens**: Local config only
   - Never committed to repo
   - Sanitized before schema export

4. **Extension Handling**:
   - Third-party GNOME extensions excluded
   - Only `@custom` extensions backed up

## Common Workflow Commands

```bash
# Start backup wizard
pnpm backup

# Start restore wizard
pnpm restore

# Run linter/formatter
pnpm lint
pnpm format

# Run tests
pnpm test
```

## Multi-Machine Support

Machine ID Format: `<os>-<distro>-<nickname>`

Examples:
- `macos-darwin-macbook-air-m2`
- `linux-ubuntu-thinkpad`
- `linux-debian-server`

Multiple machines automatically merge into single `schema.json`:
- Each machine in `systems[]` array
- Each machine config in `dotfiles[machineId]` object
- Schema intelligently merges on subsequent backups

## File Organization in Repo

```
dotfiles/
├── schema.json                              # Single file for all machines
├── SCHEMA.md
├── .gitignore                               # Ignores secret files
└── macos-darwin-macbook-air-m2/             # Machine-specific
    ├── .zshrc
    ├── .gitconfig
    └── .config/
        └── (nested directories preserved)
```

## Key Insight: Two-Layer Architecture

1. **Local Config** (`~/.dev-machine-backup-restore/`):
   - GitHub tokens
   - User preferences
   - Setup choices
   - NOT version controlled

2. **Repo Config** (`schema.json` in dotfiles repo):
   - Backed-up file metadata
   - Multi-machine information
   - Sanitized (no tokens)
   - Version controlled
   - Can be public or private

## Debug Tips

- Check `backup-config.json` to see user's setup
- Check `schema.json` in dotfiles repo to see what was backed up
- All sensitive files are explicitly excluded
- Use test mode in restore to verify before applying

