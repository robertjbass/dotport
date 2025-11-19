# Configuration Schema Documentation

## Overview

The dev-machine-backup-restore tool uses a structured configuration file to manage dotfiles, secrets, and repository information. This document describes the complete schema.

## File Location

The configuration is stored at:

- **macOS**: `~/.dev-machine-backup-restore/backup-config.json`
- **Linux**: `~/.config/dev-machine-backup-restore/backup-config.json`
- **Windows**: `%APPDATA%\dev-machine-backup-restore\backup-config.json` (not supported)

## Complete Schema

```typescript
type BackupConfig = {
  // Schema version for migrations
  version: string

  // Operating system configuration
  system: {
    primary: 'macos' | 'linux' | 'windows'
    shell: 'bash' | 'zsh' | 'fish' | 'other'
    shellConfigFile: string // e.g., '.zshrc', '.bashrc'
  }

  // Multi-OS support
  multiOS: {
    enabled: boolean
    supportedOS: Array<'macos' | 'linux' | 'windows'>
    linuxDistros?: string[] // e.g., ['debian', 'ubuntu', 'fedora']
  }

  // Dotfiles repository configuration
  dotfiles: {
    enabled: boolean
    repoType: 'github' | 'gitlab' | 'bitbucket' | 'other-git' | 'none'
    repoName: string // e.g., 'dotfiles'
    repoUrl: string // e.g., 'https://github.com/username/dotfiles'
    repoOwner?: string // e.g., 'username'
    branch: string // e.g., 'main' or 'master'
    visibility: 'public' | 'private'

    // Directory structure within repo
    structure: {
      // Structure type: 'flat' or 'nested'
      type: 'flat' | 'nested'

      // For nested structure, map OS/distro to directory
      directories: {
        [osOrDistro: string]: string // e.g., 'macos' -> 'macos/', 'debian' -> 'linux/debian/'
      }
    }

    // Files tracked per OS/distro
    trackedFiles: {
      // OS or distro name as key
      [osOrDistro: string]: {
        cloneLocation: string // e.g., '/Users/username/dev/dotfiles' on macOS, '/home/username/dev/dotfiles' on Linux
        files: Array<{
          name: string // e.g., '.bashrc', '.zshrc'
          sourcePath: string // Home directory path: '~/.bashrc'
          repoPath: string // Path in repo: 'macos/.bashrc'
          symlinkEnabled: boolean // Whether to create symlink
          tracked: boolean // Whether file is tracked in git
        }>
      }
    }
  }

  // Secrets management configuration
  secrets: {
    enabled: boolean

    // Secret file configuration
    secretFile: {
      name: string // Default: '.env.sh'
      location: string // Default: '~'
      format: 'shell-export' | 'dotenv' | 'json' | 'yaml'
      // shell-export: export KEY=value
      // dotenv: KEY=value
    }

    // How secrets are stored
    storage: {
      type:
        | 'git-repo'
        | 'cloud-service'
        | 'local-only'
        | 'password-manager'
        | 'os-keychain'

      // If using git-repo
      repo?: {
        repoType: 'github' | 'gitlab' | 'bitbucket' | 'other-git'
        repoName: string // e.g., 'my-secrets'
        repoUrl: string
        repoOwner?: string
        branch: string
        visibility: 'private' // Secrets should always be private
        encryption: 'none' | 'age' | 'pgp' | 'git-crypt' | 'sops'
        encryptionKey?: string // Path to encryption key
      }

      // If using cloud service
      cloud?: {
        provider:
          | 'aws-secrets-manager'
          | 'gcp-secret-manager'
          | 'azure-key-vault'
          | 'hashicorp-vault'
        region?: string
        vaultUrl?: string
        configPath?: string
      }

      // If using password manager
      passwordManager?: {
        type: '1password' | 'lastpass' | 'bitwarden' | 'pass'
        cliPath?: string
      }
    }

    // Secret files per OS/distro
    trackedSecrets: {
      [osOrDistro: string]: {
        files: Array<{
          name: string // e.g., '.env.sh'
          sourcePath: string // e.g., '~/.env.sh'
          repoPath?: string // Only if using git-repo storage
          encrypted: boolean
        }>

        // Individual secrets (if crawling)
        variables?: Array<{
          name: string // e.g., 'API_KEY'
          description?: string
          required: boolean
        }>
      }
    }
  }

  // Symlink management
  symlinks: {
    enabled: boolean
    strategy: 'direct' | 'stow' | 'custom'
    // direct: Create symlinks directly from repo to home
    // stow: Use GNU Stow
    // custom: User-defined script

    customScript?: string // Path to custom symlink script

    // Conflicts handling
    conflictResolution: 'backup' | 'overwrite' | 'skip' | 'ask'
    backupLocation?: string // Where to backup existing files
  }

  // Metadata
  metadata: {
    createdAt: string // ISO 8601 timestamp
    updatedAt: string
    lastBackup?: string
    lastRestore?: string
  }
}
```

## Example Configuration

### Single OS (macOS only)

```json
{
  "version": "1.0.0",
  "system": {
    "primary": "macos",
    "shell": "zsh",
    "shellConfigFile": ".zshrc"
  },
  "multiOS": {
    "enabled": false,
    "supportedOS": ["macos"]
  },
  "dotfiles": {
    "enabled": true,
    "repoType": "github",
    "repoName": "dotfiles",
    "repoUrl": "https://github.com/robertjbass/dotfiles",
    "repoOwner": "robertjbass",
    "branch": "main",
    "visibility": "public",
    "cloneLocation": "/Users/bob",
    "structure": {
      "type": "flat",
      "directories": {
        "macos": ""
      }
    },
    "trackedFiles": {
      "macos": {
        "files": [
          {
            "name": ".bashrc",
            "sourcePath": "~/.bashrc",
            "repoPath": ".bashrc",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".zshrc",
            "sourcePath": "~/.zshrc",
            "repoPath": ".zshrc",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".env.sh",
            "sourcePath": "~/.env.sh",
            "repoPath": ".env.sh",
            "symlinkEnabled": false,
            "tracked": false
          }
        ]
      }
    }
  },
  "secrets": {
    "enabled": true,
    "secretFile": {
      "name": ".env.sh",
      "location": "~",
      "format": "shell-export"
    },
    "storage": {
      "type": "local-only"
    },
    "trackedSecrets": {
      "macos": {
        "files": [
          {
            "name": ".env.sh",
            "sourcePath": "~/.env.sh",
            "encrypted": false
          }
        ],
        "variables": [
          {
            "name": "GITHUB_TOKEN",
            "description": "GitHub Personal Access Token",
            "required": false
          },
          {
            "name": "AWS_ACCESS_KEY_ID",
            "description": "AWS Access Key",
            "required": false
          }
        ]
      }
    }
  },
  "symlinks": {
    "enabled": true,
    "strategy": "direct",
    "conflictResolution": "backup",
    "backupLocation": "~/.dotfiles-backup"
  },
  "metadata": {
    "createdAt": "2025-11-17T19:30:00.000Z",
    "updatedAt": "2025-11-17T19:30:00.000Z"
  }
}
```

### Multi-OS (macOS + Debian)

```json
{
  "version": "1.0.0",
  "system": {
    "primary": "macos",
    "shell": "zsh",
    "shellConfigFile": ".zshrc"
  },
  "multiOS": {
    "enabled": true,
    "supportedOS": ["macos", "linux"],
    "linuxDistros": ["debian", "ubuntu"]
  },
  "dotfiles": {
    "enabled": true,
    "repoType": "github",
    "repoName": "dotfiles",
    "repoUrl": "https://github.com/robertjbass/dotfiles",
    "repoOwner": "robertjbass",
    "branch": "main",
    "visibility": "private",
    "cloneLocation": "~",
    "structure": {
      "type": "nested",
      "directories": {
        "macos": "macos/",
        "debian": "linux/debian/",
        "ubuntu": "linux/ubuntu/"
      }
    },
    "trackedFiles": {
      "macos": {
        "files": [
          {
            "name": ".bashrc",
            "sourcePath": "~/.bashrc",
            "repoPath": "macos/.bashrc",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".zshrc",
            "sourcePath": "~/.zshrc",
            "repoPath": "macos/.zshrc",
            "symlinkEnabled": true,
            "tracked": true
          }
        ]
      },
      "debian": {
        "files": [
          {
            "name": ".bashrc",
            "sourcePath": "~/.bashrc",
            "repoPath": "linux/debian/.bashrc",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".zshrc",
            "sourcePath": "~/.zshrc",
            "repoPath": "linux/debian/.zshrc",
            "symlinkEnabled": true,
            "tracked": true
          }
        ]
      }
    }
  },
  "secrets": {
    "enabled": true,
    "secretFile": {
      "name": ".env.sh",
      "location": "~",
      "format": "shell-export"
    },
    "storage": {
      "type": "git-repo",
      "repo": {
        "repoType": "github",
        "repoName": "my-secrets",
        "repoUrl": "https://github.com/robertjbass/my-secrets",
        "repoOwner": "robertjbass",
        "branch": "main",
        "visibility": "private",
        "encryption": "age",
        "encryptionKey": "~/.config/age/keys.txt"
      }
    },
    "trackedSecrets": {
      "macos": {
        "files": [
          {
            "name": ".env.sh",
            "sourcePath": "~/.env.sh",
            "repoPath": "macos/.env.sh.age",
            "encrypted": true
          }
        ]
      },
      "debian": {
        "files": [
          {
            "name": ".env.sh",
            "sourcePath": "~/.env.sh",
            "repoPath": "linux/debian/.env.sh.age",
            "encrypted": true
          }
        ]
      }
    }
  },
  "symlinks": {
    "enabled": true,
    "strategy": "direct",
    "conflictResolution": "ask",
    "backupLocation": "~/.dotfiles-backup"
  },
  "metadata": {
    "createdAt": "2025-11-17T19:30:00.000Z",
    "updatedAt": "2025-11-17T19:30:00.000Z",
    "lastBackup": "2025-11-17T20:00:00.000Z"
  }
}
```

## Shell Configuration Auto-Sourcing

The tool should automatically add the following to the user's shell config file (`.bashrc` or `.zshrc`):

```bash
# Auto-generated by dev-machine-backup-restore
# Source secret environment variables
if [ -f ~/.env.sh ]; then
    source ~/.env.sh
fi
```

## Secret File Format Examples

### Shell Export Format (default: .env.sh)

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"
export AWS_ACCESS_KEY_ID="AKIAXXXXXXXX"
export AWS_SECRET_ACCESS_KEY="xxxxxxxxxxxxxxx"
export DATABASE_URL="postgresql://user:pass@localhost/db"
```

### Dotenv Format (.env)

```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
AWS_ACCESS_KEY_ID=AKIAXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxx
DATABASE_URL=postgresql://user:pass@localhost/db
```

## Migration Path

When updating the schema version, the tool should:

1. Detect old schema version
2. Run migration scripts
3. Update `version` field
4. Backup old config to `backup-config.json.backup.{timestamp}`

## Validation

The configuration should be validated on load with:

- JSON schema validation
- Required fields check
- Path existence verification
- Git repository accessibility check
- Encryption key validation (if applicable)
