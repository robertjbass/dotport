# Changelog

## [Unreleased] - Recent Updates (Session 4)

### Added

- **GitHub Repository Management** ([utils/github-repo.ts](utils/github-repo.ts))
  - Automatic repository existence checking
  - Repository creation with public/private visibility selection
  - Smart handling of existing repositories with option to use or rename
  - Repository listing and details retrieval
  - Full integration with GitHub API via Octokit

- **Multi-OS Support Configuration**
  - Ask users if they want to support multiple operating systems
  - Linux distribution selection with comprehensive list
  - Checkbox selection for multiple distributions
  - Support for common distros (Ubuntu, Debian, Fedora, Arch, etc.)
  - Full list of all major Linux distributions grouped by family

- **Linux Distribution Constants** ([utils/constants.ts](utils/constants.ts))
  - Comprehensive list of Linux distributions
  - Organized by family (Debian, Red Hat, Arch, SUSE, Other)
  - Common distributions for quick selection
  - Default repository and clone location constants

- **Clone Location Prompt**
  - Ask users where to clone the dotfiles repository
  - Default to `~` (home directory)
  - Path expansion for tilde (`~`) notation
  - Visual feedback showing expanded path

- **Backup Configuration Schema** ([types/backup-config.ts](types/backup-config.ts), [docs/CONFIG-SCHEMA.md](docs/CONFIG-SCHEMA.md))
  - Comprehensive TypeScript schema for all configuration
  - Support for multi-OS dotfiles with nested/flat structures
  - Secret file management (`.env.sh`) with multiple storage backends
  - Git repo, cloud services, password managers, OS keychain support
  - Secret encryption options (age, pgp, git-crypt, sops)
  - Symlink management with conflict resolution strategies
  - Tracked files and secrets per OS/distro
  - Shell auto-sourcing configuration
  - Metadata tracking for backups and restores
  - Detailed documentation with JSON examples

- **File Discovery & Selection** ([utils/file-discovery.ts](utils/file-discovery.ts))
  - Automatic discovery of common dotfiles and config files
  - Scans for 40+ common configuration files across categories:
    - Shell config (.zshrc, .bashrc, .shell_common, etc.)
    - Secret files (.env.sh, .zshsecrets, .bashsecrets)
    - Git config (.gitconfig, SSH config)
    - Editor config (Vim, Neovim, VS Code)
    - Terminal emulators (Ghostty, Alacritty, Kitty, WezTerm, Hyper)
    - macOS apps (Hammerspoon, Karabiner, Raycast, Homebrew)
    - Linux apps (Flameshot, Ulauncher, i3, Sway, GNOME extensions, keyd)
  - File existence checking with size and type detection
  - Categorized display with separators
  - Checkbox multi-select interface
  - Manual file addition with path validation
  - Secret file detection (automatically marked as untracked)
  - Stores original file paths for symlinking

- **Automated .gitignore File Creation** ([templates/dotfiles.gitignore](templates/dotfiles.gitignore))
  - Automatically adds .gitignore to newly created GitHub repositories
  - Template includes standard Node.js patterns and secret file exclusions
  - Added via GitHub API immediately after repository creation
  - Includes patterns for: `.env.sh`, `.secrets`, `.zshsecrets`, `.bashsecrets`, `*.key`, `*.pem`, etc.
  - Supports adding custom patterns for user-specified secret files
  - Both API-based (for GitHub repos) and local filesystem functions available

- **File Backup System** ([utils/file-backup.ts](utils/file-backup.ts))
  - Automated copying of dotfiles and config files to repository
  - Preserves directory structure for nested multi-OS repositories
  - Dry-run mode for testing without making changes
  - Detailed progress reporting with file counts and error handling
  - Preview functionality showing what will be backed up before executing
  - Supports both files and directories with recursive copying
  - Tracks original file locations for future symlinking

- **Schema Export** ([utils/schema-export.ts](utils/schema-export.ts))
  - Exports backup configuration schema to dotfiles repository
  - Sanitizes sensitive information (tokens, keys) before export
  - Creates `/schema` directory in repository
  - Generates `backup-config.json` with complete configuration
  - Auto-generates README.md explaining the schema structure
  - Schema tracks OS, files, symlinks, and secret management settings

### Changed

- **Setup Flow for GitHub Repositories**
  - After authentication, automatically checks if `dotfiles` repo exists
  - If exists: Option to use existing or specify different name
  - If not exists: Offer to create with public/private selection
  - Seamless repository creation during setup
  - All repository setup integrated into config step

- **Config File Storage Interface**
  - Added new fields: `repoExists`, `repoName`, `repoVisibility`, `cloneLocation`, `multiOS`, `supportedDistros`
  - Enhanced GitHub flow with repository management
  - Fallback to manual URL entry if authentication fails

- **Clone Location Prompt**
  - Smarter prompt that distinguishes between existing and new repositories
  - For existing repos: Asks "Where is your {repo} repository located?" with validation
  - For new repos: Asks "Where should we create the {repo} repository?"
  - Validates that existing repos actually exist and are valid git repositories
  - Default suggestion changes based on context (~/dev/{repo} for existing, ~ for new)
  - Full path validation and tilde expansion

- **Enhanced Setup Flow** ([scripts/setup.ts](scripts/setup.ts))
  - Added 'files' and 'backup' steps to main setup flow
  - After configuration, prompts user to select files for backup
  - Shows backup preview before execution
  - Non-destructive approach - asks for confirmation before copying files
  - Automatically generates repoPath based on OS and structure type (flat/nested)
  - Exports schema to repository after successful backup
  - Complete end-to-end setup from config to backed-up files

- **Secret File Configuration**
  - When selecting local file secret management, now prompts for:
    - Specific filename (e.g., `.env.sh`, `.secrets`)
    - File location (default: `~` with tilde expansion)
    - Checks if file exists at specified location
    - Offers to create file with secure permissions (0600) if it doesn't exist
  - Creates files with helpful template comments
  - Validates filenames (must start with `.` for security)

- **Comprehensive Editor & IDE Discovery**
  - Added extensive coverage for modern editors and IDEs:
    - **VS Code**: settings, keybindings, snippets, profiles, tasks, launch configs (both Linux and macOS paths)
    - **Cursor**: Full config support including settings, keybindings, snippets, profiles
    - **Windsurf**: Complete configuration backup (Codeium IDE)
    - **JetBrains IDEs**: Common settings directory
    - **Sublime Text**: Config and user packages (cross-platform)
    - **Vim/Neovim**: .vimrc and nvim config directory
    - **Emacs**: .emacs and .emacs.d directory
    - **Zed**: Modern editor configuration
  - All configs automatically discovered and available for selection

- **Developer Tools & Language Configuration**
  - New "Developer Tools & Languages" category with comprehensive coverage:
    - **Node.js ecosystem**: npm (.npmrc), Yarn (.yarnrc, .yarnrc.yml), pnpm
    - **Python**: PyPI config, Python startup script, pip config
    - **Ruby**: RubyGems config, IRB config
    - **Docker & Kubernetes**: Docker config, kubectl/kube config
    - **Cloud**: AWS config (credentials excluded from backup for security)
    - **Infrastructure**: Terraform config and plugins directory
    - **tmux**: Terminal multiplexer configuration
    - **Utilities**: wget, curl configurations
  - Enhanced Git category with global ignore and commit message templates
  - All tools auto-discovered without manual configuration

- **Git Commit & Push Workflow**
  - After successful backup, prompts user to commit and push changes
  - Two options: "Yes, commit and push now" or "No, I will do it manually later"
  - Automatic workflow:
    - Checks git status for changes
    - Stages all changes with `git add .`
    - Creates descriptive commit with co-authorship attribution
    - Pushes to remote repository
  - Manual workflow:
    - Shows repository location
    - Provides step-by-step git commands
    - Includes tip: `git switch -c <branch_name>` to create new branch
  - Graceful error handling with fallback to manual instructions

- **Symlink Creation Workflow**
  - After git commit/push, prompts user to create symlinks
  - Explains that symlinks store files centrally in dotfiles repo while keeping them accessible at expected locations
  - Two options: "Yes, let me select which files to symlink" or "No, I will create them manually later"
  - Individual file selection:
    - Shows each file with source (in repo) and target (home directory) paths
    - Detects existing symlinks and warns user
    - Detects existing files and offers automatic backup (`.backup` suffix)
    - Confirm/skip each file individually
  - Automatic symlink creation:
    - Backs up existing regular files to `.backup`
    - Removes and replaces existing symlinks
    - Creates parent directories if needed
    - Shows progress for each file
    - Summary with success/error counts
  - Manual workflow:
    - Shows example `ln -sf` command
    - Provides sample usage with actual repo path
  - Only symlinks files (skips directories which have `symlinkEnabled: false`)

### Fixed

- **Linux Distribution Selection**
  - Fixed missing prompt when selecting "just one Linux distro"
  - Now properly asks which specific distribution to use
  - Returns single distro in array format for consistent schema

- **Existing Repository Handling**
  - Added check for existing repositories before file backup
  - Offers choice to "Add/update files" or "Skip file backup"
  - Prevents overwriting existing setups without user confirmation
  - Allows users with pre-configured repos to skip directly to completion

- **Secret File Exclusion from Backup**
  - Secret files (`.env.sh`, `.secrets`, etc.) are now excluded from file selection
  - Shows informational message about detected secret files
  - Directs users to configure secrets through the Secret Management section
  - Prevents accidental inclusion of secrets in version control

- **SSH Key Protection**
  - SSH directory backup now shows warning about private keys
  - Only backs up `~/.ssh/config` file
  - Automatically excludes private keys: `id_rsa`, `id_dsa`, `id_ecdsa`, `id_ed25519`
  - Also excludes: `authorized_keys`, `known_hosts`, and public keys
  - Shows skip messages during backup for excluded files

- **Multi-OS Directory Structure**
  - Fixed critical bug where files were saved to repository root instead of OS-specific subdirectories
  - When multi-OS support is enabled, files now correctly save to `macos/`, `debian/`, etc. folders
  - Explicitly passes `structureType: 'nested'` when `multiOS = true`
  - Ensures consistent directory structure matching user configuration
  - Directory creation is automatic via recursive mkdir

- **File Path Structure Preservation**
  - Fixed bug where nested config files lost their directory structure
  - Now preserves full path from home directory (e.g., `~/.ssh/config` → `.ssh/config`)
  - Previously used `basename()` which would incorrectly save `~/.ssh/config` as just `config`
  - Now correctly saves as `macos/.ssh/config` (multi-OS) or `.ssh/config` (single OS)
  - Applied to both automatic file discovery and manual file addition flows
  - Ensures proper directory structure in backup repository for accurate symlinking later

- **Linux Distribution Folder Naming**
  - Fixed to use specific distro names (e.g., `debian`, `popos`) instead of generic `linux`
  - Distro names are already normalized and lowercase in constants (Pop!_OS → `popos`)
  - Files now save to correct distro folders: `debian/.zshrc`, `popos/.bashrc`, etc.
  - Only prompts for Linux distribution selection when running on Linux
  - macOS users enabling multi-OS support skip distro questions entirely

### Files Created

- [utils/github-repo.ts](utils/github-repo.ts) - GitHub repository operations and .gitignore management
- [utils/constants.ts](utils/constants.ts) - Linux distributions and constants
- [types/backup-config.ts](types/backup-config.ts) - Complete TypeScript schema for backup configuration
- [docs/CONFIG-SCHEMA.md](docs/CONFIG-SCHEMA.md) - Comprehensive schema documentation with examples
- [utils/file-discovery.ts](utils/file-discovery.ts) - File discovery and scanning utility
- [utils/file-backup.ts](utils/file-backup.ts) - File backup operations with dry-run and preview support
- [utils/schema-export.ts](utils/schema-export.ts) - Schema export and README generation
- [templates/dotfiles.gitignore](templates/dotfiles.gitignore) - Standard .gitignore template for dotfiles repositories

### Files Modified

- [scripts/setup.ts](scripts/setup.ts) - Added complete file backup flow: selection, preview, and execution
- [utils/github-repo.ts](utils/github-repo.ts) - Added `addGitignoreToRepo()` and `createGitignoreFile()` functions
- [CHANGELOG.md](CHANGELOG.md) - Added Session 4 updates

## [Unreleased] - Recent Updates (Session 3)

### Added

- **Centralized Configuration Management** ([utils/config.ts](utils/config.ts))
  - Platform-specific data directory resolution
    - macOS: `~/.dev-machine-backup-restore`
    - Linux: `~/.config/dev-machine-backup-restore`
    - Windows: `%APPDATA%\dev-machine-backup-restore`
  - Unified configuration system for all file paths
  - Secure directory and file permissions (0o700 for dirs, 0o600 for files)
  - Config singleton pattern for efficient access
  - Support for user preferences and platform detection

### Changed

- **File Storage Locations** - Migrated from hardcoded paths to centralized config system
  - GitHub auth token: Now uses `config.paths.githubAuth`
  - Backup configuration: Now uses `config.paths.backupConfig`
  - Cache directory: Now uses `config.paths.cache`
  - All paths now platform-aware and properly managed

- **Setup Script** ([scripts/setup.ts](scripts/setup.ts))
  - Updated to use centralized configuration system
  - Backup config now saved to platform-specific location
  - Next steps display now shows actual config file path

- **GitHub Authentication** ([utils/github-auth.ts](utils/github-auth.ts))
  - Migrated from hardcoded paths to config system
  - Token storage location now platform-aware
  - Uses `ensureDirectories()` for proper setup

### Files Created

- [utils/config.ts](utils/config.ts) - Centralized configuration management system
- [docs/CONFIGURATION.md](docs/CONFIGURATION.md) - Configuration system documentation

### Files Modified

- [utils/github-auth.ts](utils/github-auth.ts) - Updated to use config system
- [scripts/setup.ts](scripts/setup.ts) - Updated to use config system
- [CHANGELOG.md](CHANGELOG.md) - Added Session 3 updates

## [Unreleased] - Recent Updates (Session 2)

### Added

- **Back Button Navigation** ([scripts/setup.ts](scripts/setup.ts))
  - State machine-based navigation system
  - "← Go back" option on all prompts (except first step)
  - Non-destructive navigation - preserve selections when going back
  - Full workflow navigation: OS → Config → Secrets → Confirm

- **Enhanced GitHub Token Validation** ([utils/github-auth.ts](utils/github-auth.ts))
  - Automatic scope validation (checks for `repo` and `read:user`)
  - Detailed error messages for missing permissions
  - Clear instructions for creating proper tokens
  - Expired token detection with helpful recovery flow
  - Permission validation on existing tokens
  - Option to continue with limited permissions

- **Token Storage Information**
  - Shows storage location after saving token
  - Displays file permissions (0o600)
  - Clear security messaging

- **Comprehensive Documentation** ([docs/TOKEN-MANAGEMENT.md](docs/TOKEN-MANAGEMENT.md))
  - Token creation guide
  - Storage location and security details
  - Expiration handling
  - Troubleshooting guide
  - Security best practices

### Changed

- **Secret Management Question** - Improved wording:
  - From: "Do you want to set up secret management?"
  - To: "Do you currently have secret management or wish to set up secret management?"
  - Clearer choice labels: "Yes, I want to set up or configure secret management" vs. "No, skip secret management"

- **Inquirer Version** - Downgraded from v13 to v12
  - Better stability and compatibility
  - Fixed list choice rendering issues
  - Proper arrow key navigation display

- **GitHub Token Requirements** - Simplified permissions:
  - Only requires `repo` scope (removed `read:user` requirement)
  - Username is extracted from repository URL instead
  - Simpler token creation process

- **Password Input** - Added visual feedback:
  - Token input now shows asterisks (`*`) as you type
  - Better indication that input is being received

### Fixed

- **GitHub Authentication Error Handling**
  - 401 errors now show clear "expired or invalid" message
  - Missing permission errors show specific scopes needed
  - Auto-clears invalid tokens before re-prompting

- **Graceful Ctrl+C Handling**
  - Properly catches inquirer's `ExitPromptError` when user presses Ctrl+C
  - Shows clean exit message instead of error stack trace
  - Handles exit in all prompts including token input and permission confirmation

- **GitHub Token Reuse**
  - Fixed issue where existing valid tokens weren't being reused
  - Now properly returns early when valid token is found
  - Avoids unnecessary re-authentication prompts

## [Unreleased] - Recent Updates (Session 1)

### Added

- **URL Parser Utility** ([utils/git-url-parser.ts](utils/git-url-parser.ts))
  - Supports multiple GitHub URL formats:
    - SSH: `git@github.com:owner/repo.git`
    - HTTPS: `https://github.com/owner/repo.git`
    - HTTPS (no .git): `https://github.com/owner/repo`
    - Domain: `github.com/owner/repo`
    - Shorthand: `owner/repo`
  - Normalizes all URLs to standard HTTPS format
  - Provides validation and parsing utilities

- **GitHub Authentication** ([utils/github-auth.ts](utils/github-auth.ts))
  - Personal Access Token authentication
  - Secure token storage in `~/.dev-machine-backup-restore/github-auth.json`
  - Token validation with GitHub API
  - Persistent authentication across sessions
  - Integration with Octokit for repository operations

- **Graceful Exit Handlers**
  - SIGINT (Ctrl+C) handling
  - SIGTERM handling
  - Clean exit messages

### Changed

- **Separator Widths**: Changed from `'='.repeat(70)` to `'='.repeat(20)` for better display on narrower terminals

- **Operating System Detection**:
  - Now shows "Operating System Detected (macOS). Is this correct?"
  - Provides Yes/No selection
  - If "No", prompts to select between macOS and Linux only

- **All Confirm Prompts**: Converted from `type: 'confirm'` (y/N) to `type: 'list'` with selectable Yes/No options
  - Better UX with arrow key navigation
  - More consistent interface
  - Affected prompts:
    - OS confirmation
    - Config files in version control
    - Secret management setup
    - Already use secret service
    - Save configuration

- **Secret Management Questions**:
  - Changed "Do you want to manage secrets with this tool?" to "Do you want to set up secret management?"
  - Changed "Do you currently backup your secrets?" to "Do you already use a service for managing your secrets?"
  - Clearer distinction between tool setup and service usage

- **Repository URL Input**:
  - Enhanced validation for GitHub URLs
  - Real-time feedback showing parsed owner/repo
  - Automatic normalization to HTTPS format
  - Support for all common GitHub URL formats

### Dependencies Added

```json
{
  "@octokit/rest": "^22.0.1",
  "simple-git": "^3.30.0",
  "cli-progress": "^3.12.0",
  "diff": "^8.0.2",
  "@types/cli-progress": "^3.11.6"
}
```

### Technical Improvements

- Better error handling for GitHub authentication
- Secure file permissions (0o600) for auth config
- Type-safe URL parsing
- Improved user feedback and messaging
- Consistent prompt styling with chalk colors

### Files Modified

- [scripts/setup.ts](scripts/setup.ts) - Main setup script updates
- [package.json](package.json) - Added new dependencies

### Files Created

- [utils/git-url-parser.ts](utils/git-url-parser.ts) - URL parsing utility
- [utils/github-auth.ts](utils/github-auth.ts) - GitHub authentication
- [CHANGELOG.md](CHANGELOG.md) - This file
