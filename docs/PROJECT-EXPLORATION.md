# Dev Machine Backup & Restore - Comprehensive Project Overview

## 1. PROJECT PURPOSE & FUNCTIONALITY

**Primary Goal**: A comprehensive CLI tool for backing up and restoring development machine configurations across macOS and Linux, allowing users to quickly set up new machines with their exact environment.

**Current Status**: Backup/Setup wizard is COMPLETE. Restore functionality is the next priority.

### Core Features Implemented
- ✅ Interactive setup wizard with back navigation
- ✅ OS detection (macOS/Linux) with multi-distro support
- ✅ GitHub integration with device flow authentication
- ✅ Automatic discovery of 40+ common config file locations
- ✅ Smart file selection with size display
- ✅ Manual file addition capability
- ✅ Secret file management (local file storage)
- ✅ Directory structure preservation (.ssh/config → .ssh/config)
- ✅ Multi-OS organization (macos/, debian/, ubuntu/, etc.)
- ✅ SSH key protection (automatic exclusion)
- ✅ Backup preview before execution
- ✅ Schema export to dotfiles repo
- ✅ Git commit & push workflow
- ✅ Symlink creation (per-file with automatic backup)

### Next Priorities
- [ ] Restore functionality (clone repo, restore files, create symlinks)
- [ ] Package manager support (Homebrew, apt, dnf, pacman)
- [ ] Application detection & installation
- [ ] Update workflow for incremental backups

---

## 2. MAIN ENTRY POINT & MENU STRUCTURE

### Entry Point
**File**: `/home/user/dev-machine-backup-restore/scripts/setup.ts`

**Command**: `pnpm run setup` (maps to `tsx scripts/index.ts setup`)

### Main Navigation Flow (State Machine)

```
START
  ↓
[OS DETECTION] ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ↑ (back)
  ↓                                                      ↑
[CONFIG FILE STORAGE] ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ↑ (back)
  ↓                                                      ↑
[SECRET STORAGE] ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ↑ (back)
  ↓                                                      ↑
[CONFIRMATION SUMMARY] ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ↑ (back)
  ↓
[FILE SELECTION] ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ↑ (back)
  ↓
[BACKUP EXECUTION] ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ↑ (back)
  ↓
[GIT COMMIT/PUSH]
  ↓
[SYMLINK CREATION]
  ↓
[COMPLETION MESSAGE]
  ↓
END
```

---

## 3. USER-FACING FLOWS & MENU OPTIONS

### Step 1: Operating System Detection
**File**: `setup.ts:102-171` (`promptOperatingSystem`)

```
Title: "OPERATING SYSTEM"
Question: "Operating System Detected (macOS/linux). Is this correct?"

Options:
  - Yes
  - No
  - ← Go back (when not first step)

If "No":
  Shows manual selection:
  - 🍎 macOS
  - 🐧 Linux
  - ← Go back
```

**Detection**: Automatic via `os.platform()` → darwin/linux/win32
**Validation**: Only macOS and Linux supported (Windows exits with error)

---

### Step 2: Config File Storage
**File**: `setup.ts:176-328` (`promptConfigFileStorage`)

```
Title: "CONFIG FILE STORAGE"
Note: Explains what config files are (dotfiles, editor settings, NOT secrets)

Q1: "Do you currently store config files in version control?"
  - Yes
  - No
  - ← Go back

If "No":
  → Skip to Secret Storage

If "Yes":
  Q2: "Which service do you use?"
    - GitHub
    - Other Git Service
    - ← Go back

  If "GitHub":
    Q3: GitHub Authentication (device flow)
    Q4: Repository Setup:
      - Use existing 'dotfiles' repo?
      - Create new?
      - Specify different name?
    Q5: Repository Visibility:
      - Private (recommended)
      - Public
    Q6: Multi-OS Support?
      - Yes (multiple OSes)
      - No (just this OS)
      
    If Multi-OS on Linux:
      Q7: "Support multiple Linux distros?"
        - Yes: Checkbox select from comprehensive list
        - No: Select single distro
        
        Common distros (quick access):
        - Ubuntu, Debian, Fedora, Arch Linux, Linux Mint, Pop!_OS, Manjaro, CentOS
        
        All distros (organized by family):
        - Debian family (6)
        - Red Hat family (5)
        - Arch family (4)
        - SUSE family (2)
        - Other (5)
    
    Q8: "Where is/should the repository be located?"
      Default: ~ (home directory)
      Validation: Path expansion, file existence check

  If "Other Git Service":
    Q3: "Enter your Git repository URL"
      Validation: URL format
```

**Key Features**:
- Automatic GitHub authentication via device flow
- Repository existence checking
- Smart repo creation with .gitignore
- Multi-OS/distro selection
- Path validation and expansion

---

### Step 3: Secret Storage
**File**: `setup.ts:859-1146` (`promptSecretStorage`)

```
Title: "SECRET STORAGE"
Note: Explains secrets (environment variables, API keys, SSH keys, etc.)

Q1: "Do you currently have secret management or wish to set up?"
  - Yes, set up/configure
  - No, skip
  - ← Go back

If "No":
  → Skip to File Selection

If "Yes":
  Q2: "Do you already use a service for managing secrets?"
    - Yes
    - No
    - ← Go back

  Q3: "Which approach do you use/want to use?"
  
    Storage Categories (with separators):
    
    ── Local Storage ──
    - Local file (.env, .env.sh, etc.)
    
    ── Version Control (Remote) ──
    - Git Repository (encrypted)
    
    ── Version Control (Local) ──
    - Local Git Repository (encrypted)
    
    ── Platform/Edge Providers ──
    - Vercel / Cloudflare / Netlify
    
    ── Cloud Secret Managers ──
    - AWS / GCP / Azure Secret Manager
    
    ── Third-Party Vaults ──
    - HashiCorp Vault / Doppler / Others
    
    ── OS-Level Storage ──
    - macOS Keychain / Linux Secret Service
    
    ── Password Manager ──
    - 1Password / LastPass / Dashlane (manual)
    
    ── No Secret Management ──
    - Skip secret management
    
    ← Go back

  If "Local file":
    Q4a: Select local file type:
      - .env file
      - Shell script exports (.env.sh, .secrets.sh)
      - PGP-encrypted file
      - Age-encrypted file
      - Plaintext file
    
    Q4b: "What is the name of your secret file?"
      Default: Based on type (.env.sh or .env)
      Validation: Must start with dot
    
    Q4c: "Where is this file located?"
      Default: ~
    
    Q4d: If file doesn't exist:
      - Yes, create it now (creates with 0600 permissions)
      - No, I'll create it manually later

  If "Git-based":
    Q4: "Select encryption method"
      - PGP-encrypted
      - Age-encrypted
      - Plaintext (private repo - not recommended)

  If "Platform":
    Q4: "Select platform service"
      - Vercel Environment Variables
      - Cloudflare Workers Secrets
      - Netlify Environment Variables

  If "Cloud":
    Q4: "Select cloud service"
      - AWS Secrets Manager
      - AWS Systems Manager Parameter Store
      - Google Cloud Secret Manager
      - Azure Key Vault

  If "Vault":
    Q4: "Select vault service"
      - HashiCorp Vault
      - Doppler
      - Akeyless
      - Infisical
```

---

### Step 4: Configuration Summary
**File**: `setup.ts:1151-1182` (`displaySummary`) + `setup.ts:1591-1616` (confirmation)

```
Title: "CONFIGURATION SUMMARY"

Displays:
- Operating System: [chosen OS]
- Config File Storage: [service + repo URL if applicable]
- Secret Management: [type + details if applicable]

Q: "Save this configuration?"
  - Yes, save configuration
  - No, cancel setup
  - ← Go back
```

---

### Step 5: File Selection
**File**: `setup.ts:632-768` (`promptFileSelection`)

```
Title: "SELECT FILES TO BACKUP"
Note: "Choose which configuration files you want to back up"

Auto-Discovery:
- Scans 40+ known config locations
- Groups by category (see Section 5 for full list)
- Shows file size and relative path

Display Categories:
=== Shell Configuration ===
- .bashrc (1.2KB) - ~/.bashrc
- .zshrc (2.4KB) - ~/.zshrc
[etc.]

=== Secret Files (NOT tracked in git) ===
- .env (secrets) - ~/.env
[etc - shown as info only, not selectable]

=== Git Configuration ===
- .gitconfig - ~/.gitconfig
[etc.]

[... more categories ...]

Selection:
- Checkbox interface (space to select, enter to confirm)
- Pre-selected: All safe files (directories excluded)
- Requires minimum 1 file
- Page size: 15 items

Manual Addition:
Q: "Add more files manually?"
  - No, continue with selected files
  - Yes, add more files

Manual Add Loop:
  1. "Enter file path (leave empty to finish)"
     Input: ~/path/to/file
     Validation: File must exist
  2. "Should this be tracked in git?"
     - Yes, track in git
     - No, keep as untracked secret
  3. Confirmation: "✅ Added: ~/path/to/file"
  4. Loop until empty input
```

---

### Step 6: Backup Execution
**File**: `setup.ts:1187-1257` (`promptAndExecuteBackup`)

```
Preview:
Shows all files that will be backed up with:
- Source path in home directory
- Destination path in repository
- File sizes

Q: "Proceed with backing up these files?"
  - Yes, backup these files now
  - No, skip backup for now
  - ← Go back

If "Yes":
  Progress Output:
  📦 Backing up files to repository...
  
  [For each file]:
    ✅ Copied: ~/.zshrc → macos/.zshrc
  
  Summary:
  ─────────────────────
  ✅ Copied: X file(s)
  ⚠️  Skipped: Y file(s)
  
  📋 Saving backup configuration to repository...
  ✅ Schema exported
  
  Next steps:
  1. Review the backed up files in: /path/to/repo
  2. Commit and push your changes to git
  3. Run the symlink creation script
```

---

### Step 7: Git Commit & Push
**File**: `setup.ts:1281-1345` (`promptGitCommitAndPush`)

```
Title: "Git Repository Update"

Q: "Would you like to commit and push the changes?"
  - Yes, commit and push now
  - No, I will do it manually later

If "Yes":
  Process (automated):
  1. Check git status for changes
  2. Stage all: git add .
  3. Create commit with attribution
  4. Push to remote: git push
  
  Output:
  🔄 Committing and pushing changes...
  ✅ Staged all changes
  ✅ Created commit
  ✅ Pushed to remote
  🎉 Changes successfully committed and pushed!

If "No":
  Shows:
  📍 Repository location: /path/to/repo
  
  Manual commands:
  cd /path/to/repo
  git add .
  git commit -m "Update dotfiles"
  git push
  
  Tip: git switch -c <branch_name>
```

---

### Step 8: Symlink Creation
**File**: `setup.ts:1350-1478` (`promptSymlinkCreation`)

```
Title: "Symlink Creation"
Note: Explains symlinks allow central storage while keeping files accessible

Q1: "Would you like to create symlinks for your backed up files?"
  - Yes, let me select which files to symlink
  - No, I will create them manually later

If "No":
  Shows example:
  ln -sf /path/to/repo/macos/.zshrc ~/.zshrc

If "Yes":
  For each symlinkable file:
    Display:
    .zshrc
      Source: /full/path/to/repo/macos/.zshrc
      Target: ~/.zshrc
      [⚠️ Already a symlink → /existing/target (if applicable)]
      [⚠️ File exists (will be backed up to ~/.zshrc.backup) (if applicable)]
    
    Q: "Create symlink for this file?"
      - Yes (default unless already a symlink)
      - No
  
  After selection:
  🔗 Creating X symlink(s)...
  
  For each:
    [If file exists but not symlink]:
      ⚠️  Backed up existing file: filename → filename.backup
    
    [If already a symlink]:
      Removed existing symlink: filename
    
    ✅ Created symlink: filename
  
  Summary:
  ─────────────────────────────────────────
  ✅ Successfully created: X symlink(s)
  ❌ Failed: Y symlink(s)
  ─────────────────────────────────────────
```

---

### Step 9: Completion
**File**: `setup.ts:1493-1514` (`displayNextSteps`)

```
Title: "NEXT STEPS"

Shows:
1. Configuration location
2. Command to run populate-backup-schema (future)
3. Where dotfiles will be backed up to
4. Reminders about secret management if enabled
```

---

## 4. NAVIGATION PATTERNS (BACK BUTTONS)

### Back Button Implementation
**Symbol**: `const BACK_OPTION = Symbol('back')` (setup.ts:85)

### How Back Works
```typescript
// Every prompt returns: value | typeof BACK_OPTION
const result = await promptOperatingSystem(true) // true = show back button
if (result === BACK_OPTION) {
  currentStep = 'previousStep'
  continue
}
```

### Back Button Visibility
- **Hidden** on first step (OS Detection) - can't go back before start
- **Shown** on all subsequent steps via `showBack` parameter
- **Implemented** in every major prompt function

### Back Button Behavior
1. User selects "← Go back" option
2. Function returns `BACK_OPTION` symbol
3. State machine moves `currentStep` to previous step
4. Loop continues, re-displaying previous menu
5. User's previous selections are preserved in `config` object

### Back Limitations
- Cannot go back from configuration confirmation without re-entering steps
- Nested flows (like multi-distro selection) handle back within themselves
- File selection back button returns to config confirmation
- No progress is lost - state is maintained in `config` object

---

## 5. OVERALL CODE STRUCTURE & ORGANIZATION

### Directory Structure
```
/home/user/dev-machine-backup-restore/
├── scripts/
│   ├── index.ts              # Entry point dispatcher
│   ├── setup.ts              # Main 1808-line setup wizard
│   ├── init.ts               # Initialization
│   ├── populate-backup-schema.ts  # Schema generation
│   └── test-scripts/
│
├── utils/
│   ├── config.ts             # Configuration management (paths, prefs)
│   ├── file-discovery.ts     # Auto-discovery of 40+ config files
│   ├── file-backup.ts        # Copy files to repo with SSH key protection
│   ├── github-auth.ts        # Device flow authentication
│   ├── github-repo.ts        # Repository operations (Octokit)
│   ├── git-url-parser.ts     # Git URL parsing & validation
│   ├── schema-export.ts      # Export config schema to repo
│   └── constants.ts          # Linux distros, default names
│
├── types/
│   └── backup-config.ts      # Complete TypeScript schema
│
├── clients/
│   └── script-session.ts     # Environment & OS detection
│
├── templates/
│   └── dotfiles.gitignore    # Template for new repos
│
├── docs/
│   ├── CONFIGURATION.md      # Config system documentation
│   ├── CONFIG-SCHEMA.md      # Complete schema docs
│   ├── TOKEN-MANAGEMENT.md   # GitHub auth docs
│   └── IMPROVEMENTS.md       # Planned improvements
│
├── README.md                 # Project overview
├── CHANGELOG.md              # Detailed change history
├── SESSION-5-SUMMARY.md      # Latest session work
├── SCHEMA.md                 # Schema documentation
├── TODO.LINUX.md             # Linux-specific TODOs
├── TODO.MACOS.md             # macOS-specific TODOs
├── package.json              # Dependencies & scripts
└── pnpm-lock.yaml
```

### Key Dependencies
```json
{
  "chalk": "^5.6.2",                  // Colored console output
  "inquirer": "^12.11.0",             // Interactive CLI prompts
  "@octokit/rest": "^22.0.1",         // GitHub API
  "simple-git": "^3.30.0",            // Git operations
  "cli-progress": "^3.12.0",          // Progress bars
  "diff": "^8.0.2"                    // File diffing
}
```

### Code Organization Patterns

1. **Setup Flow**: State machine with step tracking
   ```typescript
   type Step = 'os' | 'config' | 'secrets' | 'confirm' | 'files' | 'backup'
   let currentStep: Step = 'os'
   const stepOrder: Step[] = [...]
   ```

2. **Prompt Functions**: Each takes optional `showBack` parameter
   ```typescript
   async function promptX(showBack = false): Promise<Type | typeof BACK_OPTION>
   ```

3. **Data Flow**: Configuration object accumulates through steps
   ```typescript
   const config: SetupConfig = {
     os: 'macOS',
     configFiles: { versionControl: false, service: 'none' },
     secrets: { enabled: false }
   }
   // Modified as user goes through steps
   ```

4. **Error Handling**: Try-catch in main loop with graceful exit
   ```typescript
   try {
     // prompt and process
   } catch (error) {
     if (error?.name === 'ExitPromptError') {
       // Ctrl+C pressed - show message and exit
     }
   }
   ```

---

## 6. FILE DISCOVERY - 40+ CONFIG LOCATIONS

### Common Files (Cross-Platform)

**Shell Configuration** (7 files)
- .bashrc, .bash_profile
- .zshrc, .zprofile, .zshenv
- .shell_common
- .profile

**Secret Files** (9 files - auto-excluded from selection)
- .env, .env.sh, .secrets
- .zshsecrets, .bashsecrets
- .npmrc, .pypirc (may contain auth)
- .docker/config.json (registry auth)
- .aws/credentials

**Git Configuration** (5 files)
- .gitconfig
- .gitignore_global
- .config/git/config, .config/git/ignore
- .gitmessage

**Developer Tools** (20+ files)
- Node.js: .yarnrc, .yarnrc.yml, .config/pnpm/rc
- Python: .pythonrc, .config/pip/pip.conf
- Ruby: .gemrc, .irbrc
- Docker/K8s: .kube/config
- AWS: .aws/config (credentials excluded)
- Terraform: .terraformrc, .terraform.d
- tmux: .tmux.conf, .config/tmux
- wget/curl: .wgetrc, .curlrc

**SSH Configuration** (1 file)
- .ssh/config (keys auto-excluded)

**Editor & IDE** (26+ files)
- Vim/Neovim: .vimrc, .config/nvim
- VS Code: settings, keybindings, snippets, profiles, tasks, launch (Linux + macOS)
- Cursor: Full config support
- Windsurf: Complete configuration
- JetBrains: .config/JetBrains
- Sublime Text: Config + User packages
- Emacs: .emacs, .emacs.d
- Zed: .config/zed

**Terminal Emulators** (5 files)
- Ghostty, Alacritty, Kitty, WezTerm, Hyper

### macOS-Specific Files (6 files)
- Hammerspoon: .hammerspoon
- Karabiner: .config/karabiner
- Raycast: .config/raycast
- Finicky: .finicky.js
- SKHD: .skhdrc
- Yabai: .yabairc
- Homebrew: Brewfile, .Brewfile

### Linux-Specific Files (8 files)
- Window Managers: .config/i3, .config/sway, .config/hypr
- X11: .Xmodmap
- keyd: keyd-default.conf.backup
- Utilities: flameshot, ulauncher
- GNOME: extensions, gtk-3.0, gtk-4.0
- Custom Scripts: ~/scripts

---

## 7. CONFIGURATION FILES & DOCUMENTATION

### Documentation Files

1. **README.md** - Project overview, features, usage
2. **CHANGELOG.md** - Detailed change history with implementation details
3. **SCHEMA.md** - TypeScript schema documentation
4. **SESSION-5-SUMMARY.md** - Latest session accomplishments
5. **docs/CONFIGURATION.md** - Config system documentation
6. **docs/CONFIG-SCHEMA.md** - Complete schema with examples
7. **docs/TOKEN-MANAGEMENT.md** - GitHub authentication docs
8. **docs/IMPROVEMENTS.md** - Planned improvements
9. **TODO.LINUX.md** - Linux-specific TODOs
10. **TODO.MACOS.md** - macOS-specific TODOs

### Configuration Files Created During Setup

**Local (macOS)**
```
~/.dev-machine-backup-restore/
├── config.json           # App configuration
├── github-auth.json      # GitHub token (secure 0600)
├── backup-config.json    # User's backup preferences
└── cache/
```

**Local (Linux)**
```
~/.config/dev-machine-backup-restore/
├── config.json
├── github-auth.json
├── backup-config.json
└── cache/
```

**In Dotfiles Repository**
```
dotfiles-repo/
├── schema/
│   ├── backup-config.json  # Schema exported
│   └── README.md           # Schema explanation
├── macos/                  # or debian/, ubuntu/, etc.
│   ├── .zshrc
│   ├── .gitconfig
│   ├── .ssh/config
│   └── [other files]
└── .gitignore             # Auto-added, excludes secrets
```

---

## 8. OBVIOUS GAPS & ISSUES

### Missing Features (Prioritized)
1. **Restore Functionality** (HIGH)
   - No way to restore backed-up files to new machine
   - Need `pnpm run restore` command
   - Should parse schema and recreate environment

2. **Package Manager Support** (HIGH)
   - No Homebrew Bundle export/import
   - No apt/dnf/pacman support
   - Can't backup installed packages

3. **Application Detection** (MEDIUM)
   - Can't detect installed apps
   - Can't auto-generate installation scripts
   - No app management workflow

4. **Update Workflow** (MEDIUM)
   - No `pnpm run update` command
   - Can't do incremental backups
   - No change detection

5. **GUI Server Detection** (MEDIUM - Linux)
   - Don't detect X11 vs Wayland
   - Can't conditionally backup X11-specific configs

6. **Window Manager Configs** (LOW - Linux)
   - Limited i3/Sway support
   - No Hyprland-specific handling
   - Limited keybinding backup

### Potential UX Issues
1. **No rollback mechanism** - If symlink creation fails partway, user must manually fix
2. **No conflict preview** - When restoring, don't show conflicts in advance
3. **Long setup time** - Could benefit from pre-made templates or quick setup
4. **No validation on schema export** - Could verify files actually exist in repo
5. **No progress persistence** - If setup fails, must start over (no checkpoint saves)

### Edge Cases Not Handled
1. **Symlinks to directories** - Only files can be symlinked, directories are copied as-is
2. **Circular symlinks** - No detection/prevention
3. **Very large files** - No streaming, all in memory copy
4. **Special characters in paths** - May not handle properly on all shells
5. **Git with SSH keys** - No automated SSH key setup for repo access

### Security Considerations
1. **SSH Key Exclusion**: Implemented correctly (automatic exclusion)
2. **Secret Files**: Properly filtered from selection
3. **GitHub Token**: Stored locally with 0600 permissions (correct)
4. **Config Files**: Also stored with 0600 (correct)
5. ⚠️ **No encryption**: Secret files copied as-is (not encrypted unless user manually does)

---

## SUMMARY TABLE

| Aspect | Status | Details |
|--------|--------|---------|
| Backup Flow | ✅ Complete | 9-step wizard with full functionality |
| OS Support | ✅ macOS + Linux | Windows not supported |
| File Discovery | ✅ 40+ locations | Auto-detect + manual add |
| GitHub Integration | ✅ Complete | Device flow auth + repo creation |
| Multi-OS | ✅ Full support | Nested folder structure |
| Secrets | ✅ Configured | Multiple storage backends supported |
| Symlinks | ✅ Per-file | With automatic backup of existing |
| Back Navigation | ✅ Implemented | Through entire wizard |
| Restore | ❌ Missing | Next priority |
| Package Managers | ❌ Missing | Planned feature |
| Incremental Updates | ❌ Missing | Planned feature |

---

**Project Root**: `/home/user/dev-machine-backup-restore`
**Main File**: `/home/user/dev-machine-backup-restore/scripts/setup.ts` (1808 lines)
**Total Lines**: ~3000+ lines of TypeScript
**Latest Session**: Session 5 (Jan 17, 2025) - Multi-OS fixes, expanded file discovery, symlink workflow
