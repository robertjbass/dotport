# Dotport Setup Guide

This guide provides detailed setup instructions for Dotport, including system requirements, GitHub authentication, and understanding your dotfiles repository structure.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [GitHub Authentication Setup](#github-authentication-setup)
4. [Running Your First Backup](#running-your-first-backup)
5. [Understanding Your Dotfiles Repository](#understanding-your-dotfiles-repository)
6. [Restoring on a New Machine](#restoring-on-a-new-machine)
7. [Advanced Configuration](#advanced-configuration)
8. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Required Software

- **Node.js** version 24 or higher
  - We recommend using a version manager like [fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm)
- **Git** 2.x or higher
- **pnpm** (recommended) or npm/yarn
  - Install pnpm: `npm install -g pnpm`

### Supported Operating Systems

- **macOS** 10.15 (Catalina) or higher
- **Linux:**
  - Debian 11+ / Ubuntu 20.04+
  - Arch Linux
  - Fedora 35+
  - Pop!\_OS 21.04+
  - Other systemd-based distributions

### Optional Dependencies

- **GitHub Account** - For remote backup and multi-machine sync
- **SSH** - For secure git operations
- **gh CLI** - GitHub's official CLI (auto-detected if installed)

---

## Installation

### Clone the Repository

```bash
# Clone Dotport
git clone https://github.com/robertjbass/dotport.git
cd dotport

# Install dependencies
pnpm install

# Verify installation
pnpm run help
```

### Install Globally (Coming Soon)

```bash
# Future: Install via npm
npm install -g dotport

# Or run directly
npx dotport backup
```

---

## GitHub Authentication Setup

GitHub authentication allows Dotport to:

- Create and manage your private dotfiles repository
- Commit and push changes automatically
- Sync configurations across multiple machines

### Step 1: Understand Required Permissions

Dotport requires a GitHub Personal Access Token (PAT) with the **repo** scope.

**Why we need ALL repo permissions:**

- To create private repositories for your dotfiles
- To read from and write to your private repositories
- To check repository status and manage files
- To commit and push changes

The **repo** scope grants:

- Full control of private repositories
- Access to repository contents
- Ability to create, read, update, and delete files
- Commit and push permissions

### Step 2: Create a Personal Access Token

1. **Visit GitHub's token creation page:**
   - Go to: [https://github.com/settings/tokens/new](https://github.com/settings/tokens/new)
   - Or navigate: GitHub Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token

2. **Configure your token:**
   - **Note:** Enter a descriptive name like "Dotport - Dotfiles Backup"
   - **Expiration:** Choose an expiration period (90 days recommended)
   - **Select scopes:**
     - ☑️ **repo** (This is the only scope you need - it will select all sub-permissions automatically)
       - `repo:status` - Access commit status
       - `repo_deployment` - Access deployment status
       - `public_repo` - Access public repositories
       - `repo:invite` - Access repository invitations
       - `security_events` - Read security events

3. **Generate and copy the token:**
   - Click "Generate token" at the bottom
   - **Important:** Copy your token immediately - you won't be able to see it again!
   - Store it somewhere safe temporarily (you'll paste it into Dotport next)

### Step 3: Authenticate with Dotport

When you run `pnpm backup` for the first time, Dotport will prompt you to authenticate:

```
📝 Personal Access Token Setup

To access your private dotfiles repository, please create a Personal Access Token.

Required GitHub permissions:

  ☑️  repo (Full control of private repositories)
      ↳ This grants ALL repository permissions
      ↳ Required for private repository access

To create your token:

  1. Visit: https://github.com/settings/tokens/new
  2. Give it a descriptive name (e.g., "dotport")
  3. Select the "repo" scope checkbox (this selects all repo permissions)
  4. Click "Generate token"
  5. Copy the token and paste it below

⚠️  Important: Save your token somewhere safe - you won't see it again!

? Enter your GitHub Personal Access Token: [paste token here]
```

### Token Storage Location

Your GitHub token is stored securely at:

```
~/.dotport/config/github-auth.json
```

**Security Notes:**

- File permissions are set to `0600` (only you can read/write)
- The token is NEVER committed to your dotfiles repository
- The token is only stored on your local machine
- If compromised, revoke it immediately at: [https://github.com/settings/tokens](https://github.com/settings/tokens)

### Re-authenticating or Changing Tokens

To use a different GitHub account or update your token:

1. **Remove the existing token:**

   ```bash
   rm ~/.dotport/config/github-auth.json
   ```

2. **Run backup again:**

   ```bash
   pnpm backup
   ```

3. **Enter your new token when prompted**

---

## Running Your First Backup

### Step-by-Step Walkthrough

```bash
# Start the interactive backup wizard
pnpm backup
```

You'll go through 6 steps:

#### **Step 1: System Detection**

- Dotport auto-detects your OS, shell, and runtime
- Confirm the detected information or update if needed
- Enter a nickname for this machine (e.g., "macbook-air-m2")

#### **Step 2: GitHub Authentication**

- Choose whether to use GitHub for remote backup
- If yes, you'll authenticate with your Personal Access Token
- If no, you can still create a local backup

#### **Step 3: Repository Setup**

- Dotport will check if you have an existing dotfiles repository
- **First time:** Create a new repository (public or private recommended)
- **Returning user:** Connect to your existing repository
- Choose where to store the repository locally (default: `~/dev/dotfiles`)

#### **Step 4: Secret Management**

- Configure how you want to handle secret files (.env, .env.sh, etc.)
- Secrets are NEVER committed to your dotfiles repository
- They're stored separately and automatically excluded via .gitignore

#### **Step 5: File Selection & System Detection**

- Dotport scans your system for common config files
- Review and select files to back up using the checkbox interface
- Add any custom files not in the automatic scan
- Dotport also detects:
  - Package managers and installed packages
  - Editor extensions (VS Code, Cursor, Windsurf)
  - Runtime versions (Node.js, Python, Ruby, Go)

#### **Step 6: Backup Execution**

- Review a preview of what will be backed up
- Confirm to execute the backup
- Files are copied to your dotfiles repository
- Optionally commit and push to GitHub
- Optionally create symlinks for easier management

### After Your First Backup

Your dotfiles repository is now set up! Here's what happened:

1. **Files copied** - Selected config files copied to repository
2. **Schema created** - `schema.json` created with backup metadata
3. **Git initialized** - Repository initialized with git (if new)
4. **Changes committed** - Files committed to git (if you chose to)
5. **Pushed to GitHub** - Changes pushed to remote (if you chose to)

---

## Understanding Your Dotfiles Repository

### Repository File Structure

After backup, your dotfiles repository will have this structure:

```
dotfiles/
├── .git/                                    # Git repository data
├── .gitignore                               # Excludes secrets automatically
├── schema.json                              # Backup configuration metadata
└── macos-darwin-macbook-air-m2/             # Machine-specific directory
    ├── .zshrc                               # Shell configuration
    ├── .bashrc                              # Shell configuration
    ├── .gitconfig                           # Git configuration
    ├── .ssh/
    │   └── config                           # SSH config (private keys excluded)
    ├── .config/
    │   ├── ghostty/
    │   │   └── config                       # Terminal emulator config
    │   ├── nvim/
    │   │   └── init.vim                     # Neovim configuration
    │   └── git/
    │       └── ignore                       # Global gitignore
    └── Library/                             # macOS-specific
        └── Application Support/
            └── Code/
                └── User/
                    ├── settings.json        # VS Code settings
                    └── keybindings.json     # VS Code keybindings
```

### Machine Directory Naming

Each machine gets a unique directory with the format:

```
<os>-<distro>-<nickname>/
```

Examples:

- `macos-darwin-macbook-air-m2/`
- `linux-ubuntu-thinkpad/`
- `linux-arch-desktop/`

This allows you to back up multiple machines to the same repository.

### Schema.json Structure

The `schema.json` file contains metadata about your backups:

```json
{
  "version": "1.0.0",
  "metadata": {
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  },
  "repo": {
    "repoType": "github",
    "repoName": "dotfiles",
    "repoUrl": "https://github.com/username/dotfiles",
    "repoOwner": "username",
    "branch": "main",
    "visibility": "private"
  },
  "systems": [
    {
      "os": "macos",
      "distro": "darwin",
      "nickname": "macbook-air-m2",
      "repoPath": "macos-darwin-macbook-air-m2",
      "shell": "zsh",
      "shellConfigFile": ".zshrc"
    }
  ],
  "dotfiles": {
    "macos-darwin-macbook-air-m2": {
      "tracked-files": { ... },
      "packages": { ... },
      "extensions": { ... },
      "runtimes": { ... }
    }
  }
}
```

### What Gets Backed Up

**Always Backed Up:**

- Config files you selected
- Package manager lists (Homebrew, apt, npm, etc.)
- Editor extension lists
- Runtime version information
- Backup metadata (schema.json)

**Never Backed Up (Automatically Excluded):**

- SSH private keys (id_rsa, id_ed25519, etc.)
- GitHub Personal Access Tokens
- Secret files (.env, .secrets, etc.)
- authorized_keys, known_hosts
- Third-party GNOME extensions (only custom ones included)

---

## Restoring on a New Machine

### Prerequisites

1. **Install Dotport on the new machine** (see Installation section)
2. **Have your dotfiles repository accessible**
   - On GitHub (recommended)
   - Or cloned locally

### Restoration Process

```bash
# Start the restore wizard
pnpm restore
```

The wizard will:

1. **Find your dotfiles repository**
   - Auto-detect if cloned locally
   - Or clone from GitHub

2. **Load your backup configuration**
   - Read schema.json
   - Detect which machine's config to restore

3. **Choose what to restore**
   - Files (config files)
   - Packages (install backed up packages)
   - Runtimes (install language runtimes)
   - Or manage existing backups

4. **Restore files**
   - Choose restore method per file:
     - **Link** - Create symlink to dotfiles repo
     - **Copy** - Copy file to home directory
     - **Replace** - Overwrite existing file
     - **Skip** - Don't restore this file

5. **Optionally install packages**
   - Homebrew packages (macOS)
   - apt packages (Linux)
   - npm/pnpm global packages
   - And more...

### Test Mode

Before making changes, you can run restore in test mode:

```bash
# Test mode shows what would happen without making changes
# (Feature available in restore wizard)
```

---

## Advanced Configuration

### Manual Configuration Files

You can manually edit configuration files if needed:

```bash
# Your local system configuration
~/.dotport/config/user-system.json

# Your GitHub authentication
~/.dotport/config/github-auth.json

# Your dotfiles repository schema
~/dev/dotfiles/schema.json
```

### Symlinking Strategy

Symlinks allow you to edit files in your dotfiles repository and have changes immediately reflected in their normal locations.

**Example:**

```bash
# Without symlinks:
~/.zshrc                                    # Actual file in home directory
~/dev/dotfiles/macos-darwin-mbp/.zshrc      # Copy in repository

# With symlinks:
~/.zshrc -> ~/dev/dotfiles/macos-darwin-mbp/.zshrc    # Symlink
~/dev/dotfiles/macos-darwin-mbp/.zshrc                # Actual file
```

**Benefits:**

- Edit files in one place (the repository)
- Changes immediately take effect
- Easy to commit and push updates
- Version control for all edits

**When NOT to use symlinks:**

- Files that applications might delete and recreate
- Files that need different content per machine
- Temporary or frequently-changing files

---

## Troubleshooting

### Common Issues

#### "GitHub authentication failed"

**Problem:** Token is invalid, expired, or missing permissions.

**Solution:**

1. Verify token hasn't expired: [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Check token has `repo` scope selected
3. Create a new token if needed
4. Clear old token: `rm ~/.dotport/config/github-auth.json`
5. Run `pnpm backup` again

#### "Repository already exists"

**Problem:** Trying to create a repository that already exists.

**Solution:**

- Choose "Use existing repository" when prompted
- Or rename your new repository to something different

#### "Permission denied" errors

**Problem:** Dotport can't write to config directory.

**Solution:**

```bash
# Fix permissions
chmod 700 ~/.dotport
chmod 700 ~/.dotport/config
chmod 600 ~/.dotport/config/*.json
```

#### "File not found" during restore

**Problem:** File exists in schema but not in repository.

**Solution:**

- The file may have been deleted
- Check your dotfiles repository for the file
- Choose "Skip" for missing files during restore

#### SSH keys were backed up (they shouldn't be)

**Problem:** Private SSH keys accidentally included.

**Solution:**

```bash
# Remove private keys from repository
cd ~/dev/dotfiles
git rm <machine-id>/.ssh/id_*
git rm <machine-id>/.ssh/authorized_keys
git rm <machine-id>/.ssh/known_hosts
git commit -m "Remove SSH private keys"
git push

# Update .gitignore to ensure they stay excluded
```

### Getting Help

If you encounter issues not covered here:

1. **Check existing issues:** [https://github.com/robertjbass/dotport/issues](https://github.com/robertjbass/dotport/issues)
2. **Create a new issue:** Include:
   - Operating system and version
   - Node.js version
   - Error message (full output)
   - Steps to reproduce
3. **Ask in discussions:** For questions and general help

---

## Next Steps

- **Customize:** Edit files in your dotfiles repository
- **Commit often:** Keep your backups up to date
- **Explore:** Check out [TODO.md](../TODO.md) for upcoming features
- **Contribute:** Submit issues or pull requests on GitHub

---

**Last Updated:** 2025-01-20
