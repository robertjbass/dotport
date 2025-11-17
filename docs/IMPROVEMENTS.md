# Recent Improvements

## Overview

This document outlines the improvements made to the dev-machine-backup-restore CLI tool based on user feedback.

## ✅ Completed Improvements

### 1. Separator Width Fix

**Issue**: Separator lines (`=====...`) were too wide (70 characters)

**Solution**: Changed to `'='.repeat(20)` for better display on various terminal sizes

```typescript
// Before
console.log(chalk.cyan.bold('='.repeat(70)))

// After
console.log(chalk.cyan.bold('='.repeat(20)))
```

---

### 2. Operating System Detection

**Issue**: No confirmation of detected OS; took string input instead of selection

**Solution**:
- Shows detected OS with confirmation prompt
- Provides Yes/No list selection
- If "No", allows selection between macOS and Linux only

```
Operating System Detected (macOS). Is this correct?
  › Yes
    No

If No:
Select your operating system:
  › 🍎  macOS
    🐧  Linux
```

---

### 3. Prompt Type Consistency

**Issue**: Inconsistent use of confirm prompts (y/N) vs. selectable lists

**Solution**: All prompts now use `type: 'list'` with arrow key navigation

**Converted Prompts**:
- OS confirmation
- Config files in version control
- Secret management setup
- Already use secret service
- Save configuration

---

### 4. GitHub URL Format Support

**Issue**: Only accepted full URLs; no validation for various formats

**Solution**: Created comprehensive URL parser supporting:

| Format | Example |
|--------|---------|
| SSH | `git@github.com:robertjbass/dotfiles.git` |
| HTTPS with .git | `https://github.com/robertjbass/dotfiles.git` |
| HTTPS | `https://github.com/robertjbass/dotfiles` |
| Domain | `github.com/robertjbass/dotfiles` |
| Shorthand | `robertjbass/dotfiles` |

**Features**:
- Real-time validation
- Visual feedback showing parsed `owner/repo`
- Automatic normalization to HTTPS format

---

### 5. Clearer Secret Management Questions

**Issue**: Ambiguous wording about "this tool" vs. storage service

**Solution**: Updated question wording for clarity

```
Before:
"Do you want to manage secrets with this tool?"

After:
"Do you want to set up secret management?"
```

```
Before:
"Do you currently backup your secrets?"

After:
"Do you already use a service for managing your secrets?"
```

---

### 6. Graceful Exit Handling

**Issue**: Ctrl+C exits ungracefully without cleanup

**Solution**: Added SIGINT and SIGTERM handlers

```typescript
function setupExitHandlers() {
  const handleExit = () => {
    console.log(chalk.yellow('\n\n⚠️  Setup interrupted. Run this script again to configure.\n'))
    process.exit(0)
  }

  process.on('SIGINT', handleExit)
  process.on('SIGTERM', handleExit)
}
```

**Result**: Clean exit with helpful message when user presses Ctrl+C

---

### 7. GitHub Authentication with Octokit

**Issue**: No authentication mechanism for GitHub operations

**Solution**: Implemented Personal Access Token authentication

**Features**:
- Prompts for PAT when GitHub is selected
- Validates token against GitHub API
- Securely stores token in `~/.dev-machine-backup-restore/github-auth.json`
- File permissions: `0o600` (owner read/write only)
- Persistent authentication across sessions
- Validates existing tokens on subsequent runs

**Usage**:
```
📝 Personal Access Token Setup

Please create a Personal Access Token with the following scopes:
  - repo (Full control of private repositories)
  - read:user (Read user profile data)

Create one at: https://github.com/settings/tokens/new

? Enter your GitHub Personal Access Token: [hidden]

✅ Successfully authenticated as robertjbass!
```

---

## Architecture

### New Utilities

#### `utils/git-url-parser.ts`
- Exports `parseGitUrl()` for URL parsing
- Exports `isValidGitUrl()` for validation
- Returns `ParsedGitUrl` interface with normalized URLs

#### `utils/github-auth.ts`
- Exports `authenticateWithGitHub()` for authentication flow
- Exports `getAuthenticatedOctokit()` for retrieving existing auth
- Exports `clearAuthConfig()` for logout
- Handles token storage and validation

---

## Testing

Run the setup script to test all improvements:

```bash
pnpm run script:setup
```

---

## Future Enhancements

### OAuth Device Flow
Currently uses Personal Access Token. Future versions could implement full OAuth device flow:

1. Display code to user
2. Open browser to GitHub authorization URL
3. Poll GitHub for authorization
4. Store OAuth token with refresh capability

### Additional Git Services
Extend URL parser to support:
- GitLab
- Bitbucket
- Self-hosted Git servers

---

## Dependencies Added

```bash
pnpm add @octokit/rest simple-git cli-progress diff @types/cli-progress
```

---

## Security Considerations

1. **Token Storage**: Stored in user's home directory with restrictive permissions (0o600)
2. **Password Input**: Uses inquirer's `type: 'password'` to hide input
3. **Config Directory**: Created with 0o700 permissions (owner only)
4. **No Hardcoded Secrets**: Prompts user for their own tokens
5. **Token Validation**: Validates with GitHub API before saving

---

## Migration Notes

No breaking changes. Existing configurations will continue to work. New features are opt-in during setup flow.
