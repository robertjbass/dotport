# Dotport Data Flow & Architecture Diagrams

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DOTPORT APPLICATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │   BACKUP     │         │   RESTORE    │         │     INDEX    │        │
│  │   WIZARD     │         │    WIZARD    │         │   SELECTOR   │        │
│  │              │         │              │         │              │        │
│  │ scripts/     │         │ scripts/     │         │ scripts/     │        │
│  │ backup.ts    │         │ restore.ts   │         │ index.ts     │        │
│  └──────────────┘         └──────────────┘         └──────────────┘        │
│         │                        │                        │                │
│         └────────────┬───────────┘────────────┬───────────┘                │
│                      │                        │                            │
│                  INTERACTIVE                 INTERACTIVE                  │
│                   PROMPTS                     PROMPTS                      │
│                      │                        │                            │
│                      └────────────┬────────────┘                            │
│                                   │                                         │
│                      ┌────────────▼──────────┐                             │
│                      │   prompt-helpers.ts   │                             │
│                      │  (UI Components)      │                             │
│                      └───────────────────────┘                             │
│                                                                              │
└──────────────────────────────────────────────────────┬───────────────────────┘
                                                       │
        ┌──────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     SUPPORT UTILITIES LAYER                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               │
│  │   Discovery    │  │    Schema      │  │  Git & Repo    │               │
│  │    & Files     │  │    Building    │  │   Operations   │               │
│  │                │  │                │  │                │               │
│  │ - file-        │  │ - schema-      │  │ - github-      │               │
│  │   discovery    │  │   builder      │  │   auth         │               │
│  │ - file-        │  │ - schema-      │  │ - github-      │               │
│  │   backup       │  │   export       │  │   repo         │               │
│  │ - file-        │  │                │  │ - git-         │               │
│  │   pattern      │  │                │  │   operations   │               │
│  │   loader       │  │                │  │                │               │
│  └────────────────┘  └────────────────┘  └────────────────┘               │
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               │
│  │   System       │  │   Storage &    │  │   Utilities    │               │
│  │  Detection     │  │  Configuration │  │                │               │
│  │                │  │                │  │ - config       │               │
│  │ - runtime-     │  │ - config       │  │ - path-        │               │
│  │   detection    │  │ - restore-     │  │   helpers      │               │
│  │ - package-     │  │   backup       │  │ - constants    │               │
│  │   detection    │  │                │  │ - shell-       │               │
│  │ - editor-      │  │                │  │   config       │               │
│  │   detection    │  │                │  │ - secret-      │               │
│  │ - linux-       │  │                │  │   scanner      │               │
│  │   detection    │  │                │  │                │               │
│  │ - dconf-       │  │                │  │                │               │
│  │   export       │  │                │  │                │               │
│  └────────────────┘  └────────────────┘  └────────────────┘               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        DATA STORAGE LAYER                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────┐      ┌────────────────────────────────────┐    │
│  │   LOCAL CONFIG         │      │  DOTFILES REPOSITORY (GitHub)      │    │
│  │  (User's Machine)      │      │  (Version Controlled)              │    │
│  │                        │      │                                    │    │
│  │ ~/.dev-machine-        │      │  <repo>/                           │    │
│  │  backup-restore/       │      │  ├── schema.json    (sanitized)   │    │
│  │                        │      │  ├── SCHEMA.md      (docs)        │    │
│  │ ├── config.json        │      │  ├── .gitignore     (secrets)     │    │
│  │ ├── backup-config.json │      │  │                               │    │
│  │ ├── github-auth.json   │      │  └── <machine-id>/               │    │
│  │ └── cache/             │      │      ├── .zshrc                  │    │
│  │                        │      │      ├── .bashrc                 │    │
│  │ Sensitive Data:        │      │      ├── .gitconfig              │    │
│  │ - GitHub Token         │      │      └── ...                     │    │
│  │ - API Keys             │      │                                    │    │
│  │ - User Preferences     │      │ Backed Up Data:                    │    │
│  │                        │      │ - Config Files                     │    │
│  └────────────────────────┘      │ - Machine Metadata                 │    │
│                                  │ - Schema (Multi-Machine)           │    │
│                                  └────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Backup Workflow Detailed Flow

```
START: pnpm backup
   │
   ▼
[scripts/index.ts]
   │ Select "backup" from menu
   ▼
[scripts/backup.ts - backup() function]
   │
   ├─────────────────────────────────────────────────────────────┐
   │                                                               │
   │ STEP 1: OS DETECTION                                        │
   │ ├─ detectOS() - Auto-detect OS                              │
   │ └─ promptOperatingSystem() - Confirm/select OS              │
   │    Output: os = "macOS" | "linux"                           │
   │                                                               │
   ▼                                                               │
   │ STEP 2: SHELL DETECTION                                     │
   │ ├─ detectShell() - Auto-detect shell                        │
   │ └─ promptShell() - Confirm/select shell                     │
   │    Output: shell = "bash" | "zsh" | "fish"                  │
   │                                                               │
   ▼                                                               │
   │ STEP 3: REPOSITORY SETUP                                    │
   │ ├─ promptConfigFileStorage() - Choose GitHub                │
   │ ├─ authenticateWithGitHub() - Device code auth              │
   │ ├─ checkRepositoryExists() - Check if repo exists           │
   │ ├─ createRepository() - Create new repo (if needed)          │
   │ └─ addGitignoreToRepo() - Add .gitignore                    │
   │    Output: repoUrl, repoName, cloneLocation                │
   │                                                               │
   ▼                                                               │
   │ STEP 4: SECRETS CONFIGURATION                               │
   │ └─ promptSecretStorage() - Choose secret storage             │
   │    Output: secretFile, storageType                          │
   │                                                               │
   ▼                                                               │
   │ STEP 5: REVIEW CONFIGURATION                                │
   │ └─ displaySummary() - Show setup summary                    │
   │    (User confirms or goes back)                             │
   │                                                               │
   ▼                                                               │
   │ STEP 6: SYSTEM & FILE DETECTION                             │
   │                                                               │
   │ ┌─ System Detection ──────────────────────────────────┐     │
   │ │ ├─ promptSystemDetection()                          │     │
   │ │ ├─ detectAllRuntimes()                              │     │
   │ │ │  (Node, Python, Ruby, Go, Rust, Java)            │     │
   │ │ ├─ detectPackageManagers()                          │     │
   │ │ │  (Homebrew, apt, npm, pip, cargo, etc.)          │     │
   │ │ ├─ detectInstalledEditors()                         │     │
   │ │ │  (VS Code, Cursor, Windsurf)                      │     │
   │ │ └─ detectAllRuntimes() again for final capture      │     │
   │ └─────────────────────────────────────────────────────┘     │
   │                                                               │
   │ ┌─ File Discovery ────────────────────────────────────┐     │
   │ │ ├─ getExistingFiles() [file-discovery.ts]           │     │
   │ │ │  Scans ~40+ common config locations               │     │
   │ │ ├─ groupFilesByCategory()                           │     │
   │ │ │  Groups: shell, git, editor, terminal, etc.       │     │
   │ │ └─ promptFileSelection()                            │     │
   │ │    Multi-select checkboxes for user choice          │     │
   │ └─────────────────────────────────────────────────────┘     │
   │                                                               │
   │ ┌─ Manual File Addition ──────────────────────────────┐     │
   │ │ └─ promptManualFileAddition()                       │     │
   │ │    Add custom files not in default scan             │     │
   │ └─────────────────────────────────────────────────────┘     │
   │    Output: selectedFiles[] array                           │
   │                                                               │
   ▼                                                               │
   │ STEP 7: BACKUP EXECUTION & FINALIZATION                     │
   │                                                               │
   │ ┌─ Preview & Execute Backup ──────────────────────────┐    │
   │ │ ├─ previewBackup() - Show what will be copied       │    │
   │ │ └─ promptAndExecuteBackup()                         │    │
   │ │    ├─ backupFilesToRepo() [file-backup.ts]         │    │
   │ │    │  ├─ Validate file paths                        │    │
   │ │    │  ├─ Create repo directories                    │    │
   │ │    │  ├─ Copy files (skip private keys)             │    │
   │ │    │  └─ Return backup report                       │    │
   │ │    Output: backedUpCount, errors                    │    │
   │ └─────────────────────────────────────────────────────┘    │
   │                                                               │
   │ ┌─ Schema Building & Export ──────────────────────────┐    │
   │ │ ├─ buildBackupConfig() [schema-builder.ts]         │    │
   │ │ │  Converts user choices → BackupConfig object      │    │
   │ │ └─ exportSchemaToRepo() [schema-export.ts]         │    │
   │ │    ├─ Load existing schema.json (multi-machine)     │    │
   │ │    ├─ mergeBackupConfig() - Merge configs           │    │
   │ │    ├─ sanitizeConfig() - Remove tokens              │    │
   │ │    └─ Write schema.json to repo                     │    │
   │ │    ├─ createSchemaReadme() - Create SCHEMA.md       │    │
   │ │    Output: schema.json in repo                      │    │
   │ └─────────────────────────────────────────────────────┘    │
   │                                                               │
   │ ┌─ Git Operations (Optional) ──────────────────────────┐   │
   │ │ └─ promptGitCommitAndPush()                         │   │
   │ │    ├─ stageAllChanges()                             │   │
   │ │    ├─ createGitCommit()                             │   │
   │ │    └─ pushToRemote()                                │   │
   │ │    Output: Changes pushed to GitHub                 │   │
   │ └────────────────────────────────────────────────────┘   │
   │                                                               │
   │ ┌─ Symlink Creation (Optional) ───────────────────────┐   │
   │ │ └─ promptSymlinkCreation()                          │   │
   │ │    ├─ For each file:                                │   │
   │ │    │  ├─ Prompt for symlink creation                │   │
   │ │    │  ├─ Backup existing file if needed             │   │
   │ │    │  └─ Create symlink to repo file                │   │
   │ │    Output: Symlinks created                         │   │
   │ └─────────────────────────────────────────────────────┘   │
   │                                                               │
   │ ┌─ Configuration Save ────────────────────────────────┐    │
   │ │ └─ saveConfiguration()                              │    │
   │ │    ├─ Save setup choices to backup-config.json      │    │
   │ │    └─ Location: ~/.dev-machine-backup-restore/     │    │
   │ │    Output: Config file saved                        │    │
   │ └─────────────────────────────────────────────────────┘    │
   │                                                               │
   └─────────────────────────────────────────────────────────────┘
   │
   ▼
   COMPLETE
   ├─ displayNextSteps() - Show summary & next steps
   └─ Process ends


```

## Data Structure Transformation Flow

```
USER INPUT (Interactive Prompts)
   │
   ├─ os: "macOS"
   ├─ shell: "zsh"
   ├─ repoUrl: "https://github.com/user/dotfiles"
   ├─ selectedFiles: [TrackedFile[], ...]
   └─ secretStorageType: "local-only"
   │
   ▼
[schema-builder.ts - buildBackupConfig()]
   │
   ├─ convertOSType("macOS") → "macos"
   ├─ detectShell() → "zsh"
   ├─ Create SystemMetadata
   └─ Create MachineConfig
   │
   ▼
BackupConfig Object
   │
   ├─ version: "1.0.0"
   ├─ metadata: { createdAt, updatedAt, ... }
   ├─ repo: { repoUrl, repoName, repoOwner, ... }
   ├─ systems: [
   │   {
   │     os: "macos",
   │     distro: "darwin",
   │     nickname: "macbook-air-m2",
   │     repoPath: "macos-darwin-macbook-air-m2",
   │     shell: "zsh",
   │     shellConfigFile: ".zshrc"
   │   }
   │ ]
   ├─ dotfiles: {
   │   "macos-darwin-macbook-air-m2": {
   │     'tracked-files': {
   │       cloneLocation: "/Users/user/dev/dotfiles",
   │       files: [
   │         {
   │           name: ".zshrc",
   │           sourcePath: "~/.zshrc",
   │           repoPath: "macos-darwin-macbook-air-m2/.zshrc",
   │           symlinkEnabled: true,
   │           tracked: true
   │         },
   │         ...
   │       ]
   │     },
   │     secrets: { ... },
   │     symlinks: { ... },
   │     packages: { ... },
   │     ...
   │   }
   │ }
   └─ ...
   │
   ▼
[schema-export.ts - exportSchemaToRepo()]
   │
   ├─ sanitizeConfig()
   │  └─ Remove sensitive tokens
   │
   ├─ mergeBackupConfig() [if schema exists]
   │  └─ Merge with existing for multi-machine support
   │
   └─ Write JSON to <repo>/schema.json
   │
   ▼
GitHub Repository
   │
   ├─ schema.json (sanitized, multi-machine)
   ├─ SCHEMA.md (documentation)
   ├─ .gitignore (excludes secrets)
   └─ <machine-id>/
      ├─ .zshrc
      ├─ .bashrc
      └─ ... (backed-up files)
```

## Restore Workflow Flow

```
START: pnpm restore
   │
   ▼
[scripts/restore.ts - restore() function]
   │
   ├─ parseRestoreMode()
   │  └─ "live" or "test" mode
   │
   ├─ findDotfilesRepo()
   │  └─ Locate dotfiles repo
   │
   ├─ loadBackupData()
   │  ├─ Read schema.json from repo
   │  └─ Parse into BackupConfig
   │
   ├─ getMachineIdKey()
   │  └─ Determine which machine to restore for
   │
   ├─ showRestoreMenu()
   │  │
   │  ├─ Restore Files
   │  │  └─ restoreDotfiles()
   │  │     ├─ promptFileRestoreAction() per file
   │  │     │  ├─ Link (create symlink)
   │  │     │  ├─ Copy (copy file)
   │  │     │  ├─ Replace (overwrite existing)
   │  │     │  └─ Skip
   │  │     └─ restoreFile()
   │  │        └─ Execute restore action
   │  │
   │  ├─ Restore Packages
   │  │  └─ restorePackages()
   │  │     ├─ For each package manager:
   │  │     │  ├─ Homebrew (macOS)
   │  │     │  ├─ apt (Linux)
   │  │     │  ├─ npm, pnpm, yarn
   │  │     │  └─ pip, cargo, gem
   │  │     └─ Execute install commands
   │  │
   │  ├─ Restore Runtimes
   │  │  └─ restoreRuntimes()
   │  │     ├─ Node.js versions
   │  │     ├─ Python versions
   │  │     ├─ Ruby versions
   │  │     └─ Other runtimes
   │  │
   │  └─ Manage Backups
   │     └─ manageBackupsMenu()
   │        └─ View and manage local backups
   │
   └─ Complete
      └─ Summary of restored items
```

## Multi-Machine Schema Merging

```
Machine 1 Backup (First Time)
   │
   └─ schema.json (NEW FILE)
      │
      ├─ systems: [
      │  { os: "macos", distro: "darwin", repoPath: "macos-darwin-mbp" }
      │ ]
      └─ dotfiles: {
         "macos-darwin-mbp": { ... files, packages, etc. ... }
        }

                        Time Passes...

Machine 2 Backup (Different OS)
   │
   ├─ Read existing schema.json
   │  └─ Already has Machine 1 config
   │
   ├─ mergeBackupConfig(existingConfig, newConfig)
   │  │
   │  ├─ Add new machine to systems[]
   │  │  (Machine 2: os: "linux", distro: "ubuntu", repoPath: "linux-ubuntu-thinkpad")
   │  │
   │  └─ Add new machine to dotfiles{}
   │     (dotfiles["linux-ubuntu-thinkpad"] = { ... })
   │
   └─ Write merged schema.json
      │
      ├─ systems: [
      │  { os: "macos", distro: "darwin", repoPath: "macos-darwin-mbp" },
      │  { os: "linux", distro: "ubuntu", repoPath: "linux-ubuntu-thinkpad" }
      │ ]
      └─ dotfiles: {
         "macos-darwin-mbp": { ... },
         "linux-ubuntu-thinkpad": { ... }
        }

Result: Single schema.json file describing all machines!
```

## Security & Data Isolation

```
┌─────────────────────────────────────────────────────────┐
│                    USER'S MACHINE                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Local Configuration (User Home)                │   │
│  │  ~/.dev-machine-backup-restore/                │   │
│  │                                                 │   │
│  │  ├─ config.json ✓ SENSITIVE                    │   │
│  │  │  └─ GitHub token (NEVER shared)             │   │
│  │  │  └─ User preferences                        │   │
│  │  │  └─ Setup choices                           │   │
│  │  │                                              │   │
│  │  ├─ backup-config.json ✓ SENSITIVE            │   │
│  │  │  └─ Local setup configuration               │   │
│  │  │  └─ Paths and preferences                   │   │
│  │  │                                              │   │
│  │  ├─ github-auth.json ✓ VERY SENSITIVE         │   │
│  │  │  └─ GitHub personal access token            │   │
│  │  │  └─ Username                                │   │
│  │  │                                              │   │
│  │  └─ cache/                                      │   │
│  │     └─ Temporary data                          │   │
│  │                                                 │   │
│  │  ⚠️ NOT VERSION CONTROLLED                      │   │
│  │  ⚠️ Not in dotfiles repository                 │   │
│  │  ✓ Permissions: 0o700 (user-only)              │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│         │                                                │
│         │ Syncs to →                                    │
│         │                                                │
│  ┌──────▼───────────────────────────────────────────┐   │
│  │  Dotfiles (Configuration for backup)              │   │
│  │  ~/dev/dotfiles/                                 │   │
│  │                                                 │   │
│  │  ├─ .zshrc         ✓ Backed up                 │   │
│  │  ├─ .bashrc        ✓ Backed up                 │   │
│  │  ├─ .gitconfig     ✓ Backed up                 │   │
│  │  ├─ .ssh/config    ✓ Backed up                 │   │
│  │  │  (.ssh/*key files are EXCLUDED)             │   │
│  │  │                                              │   │
│  │  ├─ .env.sh (Secret File)                      │   │
│  │  │  ✗ NOT backed up                            │   │
│  │  │  ✓ Stored locally only                      │   │
│  │  │  ✓ Added to .gitignore                      │   │
│  │  │                                              │   │
│  │  ├─ .npmrc (Auth tokens)                       │   │
│  │  │  ✗ NOT backed up                            │   │
│  │  │  ✓ Marked as secret file                    │   │
│  │  │                                              │   │
│  │  └─ ...other sensitive files...                │   │
│  │     All EXCLUDED from backup                   │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│         │                                                │
│         │ Version control (git add/commit/push)         │
│         ▼                                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  .gitignore                                      │   │
│  │  ────────────────────────────────────────────   │   │
│  │  # Secret files (never tracked)                │   │
│  │  .env                                          │   │
│  │  .env.sh                                       │   │
│  │  .env.local                                    │   │
│  │  .npmrc                                        │   │
│  │  .pypirc                                       │   │
│  │  .aws/credentials                              │   │
│  │  .docker/config.json                           │   │
│  │                                                 │   │
│  │  # Private keys                                │   │
│  │  .ssh/id_*                                     │   │
│  │  .ssh/authorized_keys                          │   │
│  │  .ssh/known_hosts                              │   │
│  │                                                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
          │
          │ git push
          │
          ▼
┌──────────────────────────────────────────────────────────┐
│              GITHUB (Remote Repository)                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  dotfiles/                                             │
│  ├─ schema.json  ✓ Sanitized (no tokens)              │
│  ├─ SCHEMA.md                                         │
│  ├─ .gitignore   ✓ Protects secrets                   │
│  └─ macos-darwin-mbp/                                │
│     ├─ .zshrc                                         │
│     ├─ .bashrc                                        │
│     ├─ .gitconfig                                     │
│     ├─ .ssh/config                                    │
│     └─ ...                                            │
│                                                          │
│  ⚠️ NO .env.sh files                                   │
│  ⚠️ NO GitHub tokens                                   │
│  ⚠️ NO API keys or credentials                        │
│  ⚠️ NO private SSH keys                               │
│                                                          │
│  ✓ Can be PUBLIC repository                           │
│  ✓ Safe to share                                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Key Component Dependencies

```
backup.ts
├── Depends on: github-auth.ts, github-repo.ts
├── Depends on: file-discovery.ts, file-backup.ts
├── Depends on: schema-builder.ts, schema-export.ts
├── Depends on: git-operations.ts
├── Depends on: runtime-detection.ts, package-detection.ts, editor-detection.ts
├── Depends on: prompt-helpers.ts
├── Depends on: config.ts
└── Depends on: backup-config.ts (types)

restore.ts
├── Depends on: git-operations.ts (find repo)
├── Depends on: backup-config.ts (types)
├── Depends on: restore-backup.ts
├── Depends on: prompt-helpers.ts
└── Depends on: config.ts

schema-builder.ts
├── Depends on: backup-config.ts (types)
├── Depends on: linux-detection.ts
└── Exports: buildBackupConfig()

schema-export.ts
├── Depends on: backup-config.ts (types)
├── Depends on: schema-builder.ts (merge function)
└── Exports: exportSchemaToRepo()

file-backup.ts
├── Depends on: backup-config.ts (types)
└── Exports: backupFilesToRepo()

file-discovery.ts
├── Depends on: backup-config.ts (types)
└── Exports: getExistingFiles()
```
