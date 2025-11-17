# Configuration System

## Overview

The dev-machine-backup-restore tool uses a centralized configuration system to manage file paths, user preferences, and platform-specific settings. This ensures consistent behavior across different operating systems (macOS, Linux, Windows).

## Configuration Location

The configuration system stores all data in platform-specific directories:

### macOS
```
~/.dev-machine-backup-restore/
├── config.json           # Application configuration
├── github-auth.json      # GitHub authentication token
├── backup-config.json    # Backup preferences
└── cache/               # Temporary cache files
```

### Linux
```
~/.config/dev-machine-backup-restore/
├── config.json
├── github-auth.json
├── backup-config.json
└── cache/
```

### Windows
```
%APPDATA%\dev-machine-backup-restore\
├── config.json
├── github-auth.json
├── backup-config.json
└── cache\
```

## Security

All configuration directories and files are created with secure permissions:

- **Directories**: `0o700` (rwx------) - Only owner can read, write, and execute
- **Files**: `0o600` (rw-------) - Only owner can read and write

This ensures that sensitive data like GitHub tokens are not accessible to other users on the system.

## Configuration Structure

The main configuration file (`config.json`) contains:

```json
{
  "version": "1.0.0",
  "paths": {
    "dataDir": "/Users/username/.dev-machine-backup-restore",
    "githubAuth": "/Users/username/.dev-machine-backup-restore/github-auth.json",
    "backupConfig": "/Users/username/.dev-machine-backup-restore/backup-config.json",
    "cache": "/Users/username/.dev-machine-backup-restore/cache"
  },
  "preferences": {
    "autoRefreshTokens": false,
    "verbose": false
  },
  "platform": {
    "os": "darwin",
    "homeDir": "/Users/username"
  }
}
```

## Usage in Code

### Importing the Config System

```typescript
import { getConfig, ensureDirectories } from '../utils/config.js'
```

### Getting Configuration

```typescript
const config = getConfig()

// Access paths
const authPath = config.paths.githubAuth
const backupPath = config.paths.backupConfig
const cacheDir = config.paths.cache

// Access preferences
const verbose = config.preferences.verbose

// Access platform info
const osType = config.platform.os
const homeDir = config.platform.homeDir
```

### Ensuring Directories Exist

Before writing files, ensure the directory structure exists:

```typescript
import { ensureDirectories } from '../utils/config.js'

// Creates all required directories with proper permissions
ensureDirectories()

// Now you can safely write to config paths
fs.writeFileSync(config.paths.githubAuth, data)
```

### Updating Configuration

```typescript
import { updateConfig } from '../utils/config.js'

// Update specific preferences
updateConfig({
  preferences: {
    verbose: true,
    autoRefreshTokens: true
  }
})
```

### Resetting Configuration

```typescript
import { resetConfig } from '../utils/config.js'

// Reset to default configuration
const defaultConfig = resetConfig()
```

## API Reference

### Functions

#### `getConfig(): AppConfig`
Returns the current application configuration. Uses a singleton pattern for efficiency.

#### `saveConfig(config?: AppConfig): void`
Saves the configuration to disk. If no config is provided, saves the current config.

#### `updateConfig(updates: Partial<AppConfig>): AppConfig`
Updates specific configuration values and saves to disk. Returns the updated config.

#### `resetConfig(): AppConfig`
Resets configuration to platform-specific defaults. Returns the default config.

#### `getConfigPath(): string`
Returns the absolute path to the config.json file.

#### `ensureDirectories(): void`
Creates all required directories (dataDir, cache) with secure permissions if they don't exist.

### Types

```typescript
interface AppConfig {
  version: string
  paths: {
    dataDir: string
    githubAuth: string
    backupConfig: string
    cache: string
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

## Migration Guide

If you're updating code to use the new config system:

### Before
```typescript
import path from 'path'
import os from 'os'

const CONFIG_DIR = path.join(os.homedir(), '.dev-machine-backup-restore')
const AUTH_PATH = path.join(CONFIG_DIR, 'github-auth.json')
```

### After
```typescript
import { getConfig } from '../utils/config.js'

const config = getConfig()
const authPath = config.paths.githubAuth
```

## Best Practices

1. **Always use `getConfig()`** instead of hardcoding paths
2. **Call `ensureDirectories()`** before writing files
3. **Use platform-aware paths** from the config system
4. **Never hardcode directory separators** - use path.join()
5. **Check file permissions** when writing sensitive data
6. **Use config.platform.os** to handle OS-specific behavior

## Future Enhancements

Planned improvements to the configuration system:

- Environment variable overrides (e.g., `DEV_MACHINE_CONFIG_DIR`)
- XDG Base Directory specification support on Linux
- Config file validation with JSON schema
- Migration system for config version upgrades
- Per-project configuration support
