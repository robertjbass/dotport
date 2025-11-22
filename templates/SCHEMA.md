# Backup Configuration Schema

This repository contains a backup configuration schema in `schema.json`.

## About This Schema

This schema tracks:
- Repository metadata (repo URL, branch, visibility)
- System information for each machine (OS, distro, nickname, shell)
- Files being backed up and their original locations
- Symlink configuration
- Secret management settings
- Package managers and installed packages
- Editor extensions and settings
- System services, settings, and runtimes

## Schema Structure

```json
{
  "version": "1.0.0",
  "metadata": {
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
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
      "secrets": { ... },
      "symlinks": { ... },
      "packages": { ... },
      "applications": { ... },
      "extensions": { ... },
      "services": { ... },
      "settings": { ... },
      "runtimes": { ... }
    }
  }
}
```

## Multi-Machine Support

The schema supports multiple machines. Each machine has:
- An entry in the `systems` array
- A corresponding directory in the repo (named by `repoPath`)
- Complete configuration under `dotfiles[repoPath]`

## Important Security Note

⚠️ **This schema does NOT contain sensitive information like:**
- GitHub personal access tokens
- API keys
- Passwords
- Encryption keys

Those are stored separately in your local configuration directory:
- macOS: `~/.dev-machine-backup-restore/`
- Linux: `~/.config/dev-machine-backup-restore/`
- Windows: `%APPDATA%\dev-machine-backup-restore\`

## Using This Schema

This schema can be used to:
1. Understand which files are being backed up
2. Restore your dotfiles on a new machine
3. Recreate symlinks to the correct locations
4. Track which files are secrets (not committed to git)
5. Install packages and extensions

## Modifying The Schema

You can manually edit `schema.json` to add or remove files from your backup.
After editing, run the backup tool to sync the changes.
