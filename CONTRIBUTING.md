# Contributing to Dev Machine Backup & Restore

Thank you for your interest in contributing! This document explains how to add new features, file discovery patterns, and run tests.

---

## Table of Contents

1. [Adding File Discovery Patterns](#adding-file-discovery-patterns)
2. [Adding Secret Detection Patterns](#adding-secret-detection-patterns)
3. [Running Tests](#running-tests)
4. [Code Style](#code-style)
5. [Submitting Pull Requests](#submitting-pull-requests)

---

## Adding File Discovery Patterns

The tool automatically discovers dotfiles and config files using patterns defined in `config/file-discovery-patterns.json`. To add support for a new application or config file:

### 1. Edit the Configuration File

Open `config/file-discovery-patterns.json` and add your pattern to the appropriate section:

```json
{
  "common": {
    "devtools": [
      {
        "path": "~/.newrc",
        "name": "NewTool config",
        "description": "Configuration for NewTool",
        "autoExclude": false,
        "warnSecrets": false
      }
    ]
  }
}
```

### 2. Choose the Right Section

- **`common`**: Cross-platform files (macOS, Linux, Windows)
- **`macos`**: macOS-specific files
- **`linux`**: Linux-specific files

### 3. Choose the Right Category

Within each section, files are grouped by category:

- **`shell`**: Shell configuration (.zshrc, .bashrc, etc.)
- **`secrets`**: Secret files (auto-excluded from git)
- **`git`**: Git configuration
- **`devtools`**: Developer tools and language configs
- **`ssh`**: SSH configuration
- **`editor`**: Editor and IDE configurations
- **`terminal`**: Terminal emulator configurations
- **`appConfig`**: Application-specific configurations

### 4. Field Descriptions

| Field | Required | Description |
|-------|----------|-------------|
| `path` | ✅ Yes | Path to the file (must start with `~/`) |
| `name` | ✅ Yes | Display name shown to users |
| `description` | ✅ Yes | Human-readable explanation of the file's purpose |
| `autoExclude` | No | Set to `true` for secret files that should never be backed up to git |
| `warnSecrets` | No | Set to `true` to warn users that the file may contain secrets |

### 5. Example: Adding Starship Configuration

```json
{
  "common": {
    "terminal": [
      {
        "path": "~/.config/starship.toml",
        "name": "Starship prompt config",
        "description": "Starship cross-shell prompt configuration"
      }
    ]
  }
}
```

### 6. Validate Your Changes

After editing, validate the configuration:

```bash
pnpm test:file-patterns
```

This ensures your patterns follow the correct schema.

---

## Adding Secret Detection Patterns

Secret detection patterns are also defined in `config/file-discovery-patterns.json` under the `secretPatterns` section.

### 1. Add a New Pattern

```json
{
  "secretPatterns": {
    "patterns": [
      {
        "name": "Stripe API Key",
        "regex": "sk_(test|live)_[a-zA-Z0-9]{24}",
        "severity": "critical"
      }
    ]
  }
}
```

### 2. Severity Levels

- **`critical`**: Immediately excludes file from backup (e.g., private keys, passwords)
- **`high`**: Recommends exclusion (e.g., API keys, tokens)
- **`medium`**: Warns user to review (e.g., potential secrets)
- **`low`**: Informational only

### 3. Testing Secret Patterns

Create a test file and run the secret scanner:

```bash
# Create test file
echo "STRIPE_KEY=sk_live_123456789012345678901234" > /tmp/test-secrets.txt

# Run scanner
pnpm test:secret-scanner
```

---

## Running Tests

The project uses Node's built-in test runner (`node:test`).

### Run All Tests

```bash
pnpm test
```

### Run Specific Tests

```bash
# Secret scanner tests
pnpm test:secret-scanner

# Dry-run integration tests
pnpm test:dry-run
```

### Watch Mode (Auto-run on Changes)

```bash
pnpm test:watch
```

### Writing New Tests

Tests use Node's native test runner and are located in `tests/`.

Example test structure:

```typescript
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'

describe('My Feature', () => {
  before(() => {
    // Setup
  })

  after(() => {
    // Cleanup
  })

  it('should do something', () => {
    assert.strictEqual(1 + 1, 2)
  })
})
```

### Dry-Run Testing

The `tests/dry-run.test.ts` file demonstrates how to test the backup flow using temporary directories:

- Creates temporary home directory
- Creates temporary git repository (local only, no remote)
- Tests complete backup flow without touching real files
- Cleans up automatically

---

## Code Style

### TypeScript Guidelines

- Use TypeScript for all new code
- Add type definitions to `types/` directory
- Export interfaces for reusable types
- Use JSDoc comments for public functions

### Formatting

We use Prettier for code formatting:

```bash
# Format all files
pnpm run format

# Check formatting
pnpm run format:check
```

### File Organization

```
dev-machine-backup-restore/
├── scripts/          # CLI scripts
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
├── config/           # Configuration files (JSON)
├── tests/            # Test files
├── docs/             # Documentation
└── templates/        # Template files
```

---

## Schema Tracking

### Symlink State Tracking

The `TrackedFile` interface now includes symlink state:

```typescript
export interface TrackedFile {
  name: string
  sourcePath: string
  repoPath: string
  symlinkEnabled: boolean
  tracked: boolean

  // New fields
  symlinkCreated?: boolean      // Whether symlink was created
  symlinkCreatedAt?: string     // Timestamp
  symlinkTarget?: string        // Where symlink points
  backupPath?: string           // Location of .backup file
  containsSecrets?: boolean     // Secret detection result
  secretsScannedAt?: string     // When scanned
}
```

When implementing features that create/modify symlinks, update these fields in the schema.

---

## Submitting Pull Requests

### Before Submitting

1. **Run all tests**: `pnpm test`
2. **Validate config changes**: Ensure JSON files are valid
3. **Update documentation**: Add/update relevant docs
4. **Test manually**: Run `pnpm setup` to test the full flow

### PR Checklist

- [ ] Tests pass (`pnpm test`)
- [ ] Code is formatted (`pnpm run format`)
- [ ] Documentation updated (if adding features)
- [ ] File discovery patterns validated (if adding patterns)
- [ ] Secret detection tested (if adding secret patterns)
- [ ] TypeScript compiles without errors
- [ ] Tested manually with `pnpm setup`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New file discovery pattern
- [ ] New secret detection pattern
- [ ] New feature
- [ ] Documentation update

## Testing
- [ ] Added/updated tests
- [ ] All tests pass
- [ ] Manually tested

## Files Changed
- `config/file-discovery-patterns.json` - Added XYZ config support
- `tests/xyz.test.ts` - Added tests for XYZ
```

---

## Common Contributions

### Adding Support for a New Editor

1. Find the editor's config location
2. Add to `config/file-discovery-patterns.json`:
   ```json
   {
     "common": {
       "editor": [
         {
           "path": "~/.config/my-editor/config.json",
           "name": "MyEditor config",
           "description": "MyEditor text editor configuration"
         }
       ]
     }
   }
   ```
3. Test: `pnpm setup` and verify it's discovered
4. Submit PR with example screenshot

### Adding Support for a New OS

Currently supports macOS and Linux. For Windows or other OS:

1. Add new OS section in config
2. Update `types/backup-config.ts` `OperatingSystem` type
3. Update file discovery logic in `utils/file-discovery.ts`
4. Add tests in `tests/`

### Improving Secret Detection

1. Research common secret patterns for the service
2. Add regex pattern to `config/file-discovery-patterns.json`
3. Set appropriate severity level
4. Add test case in `tests/secret-scanner.test.ts`
5. Document in PR why the pattern is needed

---

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Features**: Open a GitHub Issue with `[Feature Request]` tag

---

## Thank You! 🎉

Your contributions help make this tool better for everyone. Whether it's adding a single config file pattern or implementing a major feature, every contribution is valuable!
