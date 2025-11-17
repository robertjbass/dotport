# GitHub Token Management

## Token Storage Location

GitHub Personal Access Tokens are stored securely at:

```
~/.dev-machine-backup-restore/github-auth.json
```

**Security Features:**
- File permissions: `0o600` (only owner can read/write)
- Directory permissions: `0o700` (only owner can access)
- Never committed to version control

## Token Requirements

The tool requires a GitHub Personal Access Token with the following scope:

- **`repo`** - Full control of private repositories
  - Needed to read, write, and manage your dotfiles repository
  - Allows creating, updating, and deleting files in repos
  - Provides access to repository information including owner details

## Creating a Token

1. Visit: https://github.com/settings/tokens/new
2. Give your token a descriptive name (e.g., "dev-machine-backup-restore")
3. Select an expiration period (recommended: 90 days)
4. Check the following scope:
   - ☑ `repo` (Full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** - you won't be able to see it again!

## Token Validation

The tool automatically validates your token when you authenticate:

### ✅ Valid Token
```
✅ Successfully authenticated as username!
✓ Token has all required permissions
```

### ⚠️ Missing Permissions
```
⚠️  Token is valid but missing required permissions:
  ✗ repo

Please create a new token with this scope at:
https://github.com/settings/tokens/new

? Continue with limited permissions?
  › No, let me create a new token
    Yes, continue anyway
```

### ❌ Expired or Invalid Token
```
❌ Token is invalid or has expired.
Please create a new Personal Access Token at:
https://github.com/settings/tokens/new
```

## Token Expiration

### Classic Tokens
- No expiration by default (not recommended)
- Can set custom expiration (30, 60, 90 days, 1 year, or custom)
- **Recommendation**: Set 90-day expiration for security

### Fine-Grained Tokens
- Maximum 1 year expiration
- More granular permissions
- Repository-specific access

### Handling Expired Tokens

When your token expires, the tool will:
1. Detect the expired token on next use
2. Show clear error message
3. Automatically clear the expired token
4. Prompt you to create a new token

## Revoking Access

To revoke the tool's access to your GitHub account:

1. **Via GitHub Settings:**
   - Visit: https://github.com/settings/tokens
   - Find your token in the list
   - Click "Delete"

2. **Via CLI:**
   ```bash
   rm ~/.dev-machine-backup-restore/github-auth.json
   ```

## Security Best Practices

1. **Never share your token** - Treat it like a password
2. **Set expiration dates** - Use 90-day expiration
3. **Use minimum permissions** - Only grant necessary scopes
4. **Rotate regularly** - Create new tokens before expiration
5. **Monitor usage** - Check GitHub's token activity logs
6. **Revoke if compromised** - Delete immediately if exposed

## Troubleshooting

### Token Not Working

If authentication fails:

1. **Check token hasn't expired**
   - Visit: https://github.com/settings/tokens
   - Look for expiration date

2. **Verify permissions**
   - Click on token in settings
   - Ensure `repo` is checked

3. **Test token manually**
   ```bash
   curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
   ```

4. **Create new token**
   - If all else fails, generate a fresh token
   - Delete old token from GitHub settings

### Re-authenticating

To re-authenticate with a new token:

```bash
# Option 1: Delete old token and run setup again
rm ~/.dev-machine-backup-restore/github-auth.json
pnpm run script:setup

# Option 2: The tool will auto-prompt if token is invalid
pnpm run script:setup
```

## Token Metadata

The stored authentication file contains:

```json
{
  "token": "ghp_xxx...",
  "username": "your-username",
  "expiresAt": undefined
}
```

Note: `expiresAt` is currently not populated as expiration date is not easily readable from the token itself. This may be enhanced in future versions.
