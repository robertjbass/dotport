# Feature Backlog - Prioritized

**Last Updated**: 2025-01-17
**Status**: Post-UX Review - Production Readiness Roadmap

This document outlines the prioritized feature backlog for the dev-machine-backup-restore tool, organized by priority level based on user impact, release requirements, and development effort.

---

## Priority 1: Release Blockers 🚨

These features are **REQUIRED** before the tool can be publicly released. Without these, the tool provides incomplete value to users.

### 1.1 Restore Functionality ⭐⭐⭐⭐⭐
**Impact**: CRITICAL - Users can back up but can't restore on new machines
**Effort**: HIGH (3-5 days)
**Dependencies**: None

**Requirements**:
- Detect existing `backup-config.json` schema in dotfiles repository
- Clone dotfiles repo on new machine (or use existing clone)
- Parse schema to understand:
  - Which files belong where
  - OS-specific vs shared files
  - Directory structure (flat vs nested)
- Copy files from repo to home directory
  - Respect OS/distro folders (macos/, debian/, etc.)
  - Preserve directory structures (.ssh/config → ~/.ssh/config)
- Create symlinks based on schema configuration
  - Per-file symlink preferences
  - Skip files where symlinkEnabled is false
- Handle conflicts intelligently:
  - Detect existing files at target locations
  - Offer: overwrite, skip, diff, or backup existing
  - Show which files will be affected before proceeding
- Support multi-OS restoration:
  - Detect current OS
  - Only restore files for current OS
  - Handle "shared" files that apply to all OSes
- Validation:
  - Verify all source files exist in repo
  - Check destination paths are valid
  - Confirm symlink targets exist

**User Stories**:
- As a user setting up a new machine, I want to restore my dotfiles so I can quickly get my environment configured
- As a multi-OS user, I want only my macOS files restored when on macOS and only Linux files restored when on Linux
- As a cautious user, I want to preview which files will be overwritten before confirming the restore

**Success Criteria**:
- ✅ User can run `pnpm run restore` on a new machine
- ✅ All backed up files are restored to correct locations
- ✅ Symlinks are created matching the schema
- ✅ Existing files are safely backed up (not lost)
- ✅ Multi-OS configurations restore correctly per OS

---

### 1.2 State Persistence for Crash Recovery ⭐⭐⭐⭐⭐
**Impact**: HIGH - Setup takes 10-15 minutes; crashes lose all progress
**Effort**: MEDIUM (1-2 days)
**Dependencies**: None

**Requirements**:
- Save setup progress to temporary state file:
  - Location: `~/.dev-machine-backup-restore/.setup-state.json`
  - Permissions: 0600 (user-only read/write)
- State should include:
  - Current step in wizard
  - All answers/selections made so far
  - Selected files
  - Repository details
- On script restart:
  - Detect existing state file
  - Offer: "Resume previous setup" or "Start fresh"
  - If resume: load state and jump to last completed step
  - If start fresh: delete state file and begin from step 1
- Clear state file:
  - On successful completion
  - On explicit user cancellation (after confirmation)
  - After 24 hours (stale state)
- Error handling:
  - Corrupted state file: warn user, offer start fresh
  - State from different tool version: warn about compatibility

**User Stories**:
- As a user whose setup was interrupted, I want to resume where I left off instead of starting over
- As a user who made a mistake, I want to restart the setup without being forced to resume

**Success Criteria**:
- ✅ State is saved after each major step
- ✅ User can resume after Ctrl+C or crash
- ✅ State is cleared on successful completion
- ✅ Stale state (>24h) is automatically cleared

---

### 1.3 Comprehensive Error Recovery ⭐⭐⭐⭐
**Impact**: HIGH - Network failures and permission errors break the flow
**Effort**: MEDIUM (2-3 days)
**Dependencies**: None

**Requirements**:
- **Network Operations** (GitHub, git push, etc.):
  - Retry logic with exponential backoff (2s, 4s, 8s, 16s)
  - Max 3 retries
  - Show retry attempt number: "Retrying (2/3)..."
  - Timeout after 30 seconds per attempt
  - On failure: offer manual fallback options
- **File Operations**:
  - Permission denied → explain required permissions
  - Disk full → show space needed vs available
  - Path doesn't exist → offer to create or change path
- **Git Operations**:
  - Push rejected → explain branch protection or auth issues
  - Merge conflicts → guide to manual resolution
  - No git installed → provide installation instructions
- **Common Error Patterns**:
  - Map error codes to user-friendly messages
  - Provide actionable next steps
  - Show relevant documentation links
- **Rollback Capabilities**:
  - Track all file system changes
  - Offer undo for failed operations
  - Maintain operation log for debugging

**User Stories**:
- As a user with a slow network, I want retries to handle temporary failures instead of aborting the entire setup
- As a user who gets an error, I want clear explanation and steps to fix it, not just a stack trace

**Success Criteria**:
- ✅ Network failures retry automatically
- ✅ Error messages explain the problem AND the solution
- ✅ Users can recover from errors without restarting setup
- ✅ Failed operations can be rolled back

---

## Priority 2: High UX Impact 🎯

These features significantly improve user experience but aren't release blockers.

### 2.1 Enhanced Backup Preview ⭐⭐⭐⭐
**Impact**: MEDIUM-HIGH - Users can't see full impact before committing
**Effort**: LOW (1 day)

**Requirements**:
- Before executing backup, show comprehensive preview:
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Backup Preview
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Total files: 12 files (1.2 MB)
  Destination: ~/dev/dotfiles/macos/

  Files to backup:
  ✓ .zshrc (2.1 KB)           → macos/.zshrc [NEW]
  ✓ .gitconfig (1.5 KB)       → macos/.gitconfig [OVERWRITE]
  ⚠️ .config/nvim (450 KB)     → macos/.config/nvim/ [NEW DIR]
  ...

  Symlinks to create: 10 files
  Existing backups: 2 files
    - .gitconfig.backup (1.5 KB)
    - .zshrc.backup (2.0 KB)

  Git operations:
    - Commit message: "Update dotfiles configuration"
    - Push to: origin/main
  ```

**Success Criteria**:
- ✅ Shows which files are new vs overwrite
- ✅ Shows total size and file count
- ✅ Shows which files will be symlinked
- ✅ Highlights potential issues (large files, overwrites)

---

### 2.2 Help System (Contextual Help) ⭐⭐⭐⭐
**Impact**: MEDIUM - New users get confused by complex options
**Effort**: MEDIUM (2 days)

**Requirements**:
- Add "(Press 'h' for help)" to complex prompts
- When 'h' is pressed, show contextual help:
  - What this option means
  - What it affects
  - Recommended choice for common scenarios
  - Trade-offs between options
- Example prompts needing help:
  - "Multi-OS support" → Explain flat vs nested, when to use each
  - "Secret storage" → Explain each option, security trade-offs
  - "Symlinks" → What are symlinks, why use them, when not to
- Help content stored in `utils/help-text.ts`
- Help UI:
  - Clear formatting with examples
  - Back to prompt after reading help
  - Can press 'h' again to re-read

**Success Criteria**:
- ✅ Help available on 5+ complex prompts
- ✅ Help text explains concept clearly
- ✅ Recommendations guide users to best choice

---

### 2.3 Symlink Rollback & Bulk Actions ⭐⭐⭐
**Impact**: MEDIUM - Symlink creation can fail midway leaving partial state
**Effort**: MEDIUM (1-2 days)

**Requirements**:
- **Dry-run mode**:
  - Show all symlink operations that will be performed
  - Detect conflicts beforehand
  - Estimate time to complete
- **Bulk actions**:
  - "Yes to all remaining"
  - "No to all remaining"
  - "Only symlink [category]" (e.g., only shell configs)
  - "Preview all before confirming"
- **Rollback on failure**:
  - If any symlink fails, offer to undo all changes
  - Restore .backup files automatically
  - Show log of what was undone
- **Conflict handling**:
  - If existing symlink points to WRONG location:
    - Show current target vs expected target
    - Offer: Update, Skip, or Abort
  - If file exists (not symlink):
    - Show diff between existing and repo version
    - Offer: Overwrite, Merge, Skip

**Success Criteria**:
- ✅ Can preview all symlinks before creating
- ✅ Bulk actions reduce repetitive prompts
- ✅ Failed operations can be rolled back
- ✅ No partial state after failures

---

### 2.4 Configuration Summary Shows Files ⭐⭐⭐
**Impact**: MEDIUM - Users can't review file selection before proceeding
**Effort**: LOW (0.5 days)

**Requirements**:
- Update `displaySummary` to include selected files:
  ```
  Configuration Summary
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Operating System: macOS

  Config File Storage:
    Service: GitHub
    Repository: github.com/user/dotfiles
    Location: ~/dev/dotfiles

  Secret Management:
    Type: local-file
    Location: ~/.env.sh

  Selected Files (12 files, 1.2 MB):
    Shell (2): .zshrc, .bashrc
    Git (3): .gitconfig, .gitignore_global, .gitmessage
    Editor (5): VS Code settings, Neovim config, ...
    Terminal (2): Ghostty config, Alacritty config
  ```

**Success Criteria**:
- ✅ Summary shows file count and size
- ✅ Files grouped by category
- ✅ Long lists truncated with "... (N more)"

---

## Priority 3: Nice to Have 🌟

These features add polish but can wait until after initial release.

### 3.1 Better Secret Storage UX ⭐⭐⭐
**Impact**: MEDIUM - 9 options overwhelms new users
**Effort**: LOW (1 day)

**Requirements**:
- Group secret options into tiers:
  - **Simple**: Local file, OS keychain
  - **Cloud**: AWS, GCP, Azure
  - **Advanced**: Vault, Doppler, Git encrypted
- Show "Simple options" by default
- Add "Show more options" to reveal additional tiers
- Add "What should I choose?" help text:
  - For personal use → Local file
  - For team projects → Cloud secret manager
  - For maximum security → Vault or encrypted git

**Success Criteria**:
- ✅ Default view shows only 3-4 options
- ✅ Advanced options hidden until requested
- ✅ Help text guides decision-making

---

### 3.2 Package Manager Support ⭐⭐⭐⭐
**Impact**: HIGH - Restoring packages is critical for dev environment
**Effort**: HIGH (3-4 days)

**Requirements**:
- **Homebrew (macOS)**:
  - Detect installed packages: `brew bundle dump`
  - Export to Brewfile
  - Restore: `brew bundle install`
  - Support for: formulae, casks, mas apps, taps
- **apt (Debian/Ubuntu)**:
  - Export: `dpkg --get-selections > packages.txt`
  - Restore: `dpkg --set-selections < packages.txt && apt-get dselect-upgrade`
- **dnf/yum (Fedora/RHEL)**:
  - Export: `dnf list installed > packages.txt`
  - Restore: `dnf install $(cat packages.txt | awk '{print $1}')`
- **pacman (Arch)**:
  - Export: `pacman -Qqe > packages.txt`
  - Restore: `pacman -S --needed - < packages.txt`
- **Snap/Flatpak**:
  - Detect and export separately
  - Restore with snap/flatpak commands

**Success Criteria**:
- ✅ Packages exported during backup
- ✅ Packages restored during restore
- ✅ Handles missing repositories gracefully
- ✅ User can review package list before installing

---

### 3.3 Conflict Detection During Backup ⭐⭐⭐
**Impact**: MEDIUM - Can accidentally overwrite repo files
**Effort**: MEDIUM (1-2 days)

**Requirements**:
- Before backup, check for conflicts:
  - **File exists in repo with different content**:
    - Show diff
    - Offer: Overwrite, Skip, Merge (for text files)
  - **File deleted from home but exists in repo**:
    - Ask: Remove from repo or restore to home
  - **File in repo but not in current selection**:
    - Warn that it will remain in repo
- Conflict report:
  ```
  ⚠️  Found 2 conflicts:

  1. .gitconfig
     - Local: modified 2 days ago (1.5 KB)
     - Repo:  modified 5 days ago (1.4 KB)
     - Action: [Overwrite] [Skip] [Diff]

  2. .bashrc
     - Local: does not exist
     - Repo:  exists (800 bytes)
     - Action: [Delete from repo] [Restore to local] [Skip]
  ```

**Success Criteria**:
- ✅ Detects all types of conflicts
- ✅ Shows clear diff for text files
- ✅ User can choose action per conflict
- ✅ Bulk actions: "Overwrite all" or "Skip all"

---

### 3.4 Update/Incremental Backup Workflow ⭐⭐⭐
**Impact**: MEDIUM - No way to update existing backup without full re-run
**Effort**: MEDIUM (2 days)

**Requirements**:
- New command: `pnpm run update`
- Detect changes since last backup:
  - Compare file mtimes vs last backup timestamp
  - Show which files changed
- Incremental backup:
  - Only copy changed files
  - Update schema with new timestamps
  - Auto-commit with message: "Update dotfiles - [files changed]"
- Options:
  - `--force`: Backup all files regardless of changes
  - `--dry-run`: Show what would be backed up
  - `--auto`: Skip confirmations, auto-commit

**Success Criteria**:
- ✅ Only backs up changed files
- ✅ Faster than full setup (~30 seconds)
- ✅ Can be run repeatedly without issues
- ✅ Auto-commit option for scripting/cron

---

## Priority 4: Future Enhancements 🔮

Nice-to-have features for future versions. Not critical for release.

### 4.1 Application Detection & Installation ⭐⭐⭐
**Impact**: MEDIUM - Manually installing apps is tedious
**Effort**: HIGH (4-5 days)

**Requirements**:
- Detect installed applications:
  - macOS: `/Applications`, `brew list --cask`
  - Linux: `dpkg -l`, `snap list`, `flatpak list`
- Export application list to schema
- Generate installation scripts per OS:
  - Homebrew: `brew install --cask ...`
  - apt: `apt install ...`
  - Snap: `snap install ...`
- During restore:
  - Show detected vs missing applications
  - Offer to install missing apps
  - Show progress during installation

---

### 4.2 Diff Viewer (Local vs Repo) ⭐⭐
**Impact**: LOW-MEDIUM - Users want to see changes before pulling
**Effort**: MEDIUM (2 days)

**Requirements**:
- Command: `pnpm run diff`
- Show differences between local files and repo versions
- Support for:
  - Text files: line-by-line diff
  - Binary files: file size, mtime
- Actions:
  - Pull changes from repo
  - Push changes to repo
  - Open in external diff tool

---

### 4.3 Multiple Profiles ⭐⭐
**Impact**: LOW - Power users want different configs for different contexts
**Effort**: HIGH (3-4 days)

**Requirements**:
- Support multiple named profiles:
  - `work`: Work machine configuration
  - `personal`: Personal projects
  - `gaming`: Gaming/entertainment setup
- Each profile has its own:
  - File selection
  - Repository
  - Secret storage
- Switch between profiles: `pnpm run setup --profile work`
- Profile-specific dotfiles folders in repo

---

### 4.4 Auto-sync (Watch Mode) ⭐
**Impact**: LOW - Nice for power users, not essential
**Effort**: MEDIUM (2-3 days)

**Requirements**:
- Command: `pnpm run watch`
- Watch dotfiles for changes using `chokidar`
- On change:
  - Auto-backup to repo
  - Auto-commit with timestamp
  - Optional auto-push
- Configurable:
  - Which files to watch
  - Debounce delay (wait N seconds after last change)
  - Commit message template

---

### 4.5 Template Library ⭐⭐
**Impact**: MEDIUM - Speeds up setup for common use cases
**Effort**: MEDIUM (2 days)

**Requirements**:
- Pre-configured templates:
  - "Frontend Developer" (Node, VS Code, Git, Chrome tools)
  - "Backend Developer" (Docker, DB clients, API tools)
  - "DevOps Engineer" (Kubernetes, Terraform, Cloud CLIs)
  - "Data Scientist" (Python, Jupyter, R, data tools)
- During setup:
  - Offer: "Start from template" or "Custom setup"
  - If template: pre-select relevant files
  - User can still customize selection
- Templates stored in `templates/` directory

---

## Implementation Roadmap

### Phase 1: Release Readiness (Weeks 1-2)
1. Restore Functionality (5 days)
2. State Persistence (2 days)
3. Error Recovery (3 days)
4. Enhanced Backup Preview (1 day)

**Milestone**: v1.0.0 Release - Fully functional backup AND restore

### Phase 2: UX Polish (Weeks 3-4)
1. Help System (2 days)
2. Symlink Rollback & Bulk Actions (2 days)
3. Configuration Summary with Files (0.5 days)
4. Better Secret Storage UX (1 day)
5. Conflict Detection (2 days)

**Milestone**: v1.1.0 - Production-ready with excellent UX

### Phase 3: Extended Features (Month 2)
1. Package Manager Support (4 days)
2. Update Workflow (2 days)
3. Application Detection (5 days)

**Milestone**: v1.2.0 - Full dev environment restoration

### Phase 4: Advanced Features (Month 3+)
1. Diff Viewer (2 days)
2. Multiple Profiles (4 days)
3. Template Library (2 days)
4. Auto-sync Watch Mode (3 days)

**Milestone**: v2.0.0 - Power user features

---

## Success Metrics

### User Satisfaction:
- ⭐ Users can fully restore dev environment on new machine
- ⭐ Setup time: <15 minutes for first-time setup
- ⭐ Restore time: <5 minutes on new machine
- ⭐ Error recovery: >90% of errors have clear resolution path
- ⭐ Documentation: Every feature has clear guide

### Technical Metrics:
- 🎯 Test coverage: >80%
- 🎯 All edge cases from UX review addressed
- 🎯 Zero data loss scenarios
- 🎯 Cross-platform: macOS + 5 Linux distros tested
- 🎯 Network resilience: Handles intermittent connectivity

---

*This backlog serves as the roadmap for achieving production-ready status and beyond.*
