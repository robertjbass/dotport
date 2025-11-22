/**
 * GitHub Auth - OAuth device flow authentication for GitHub
 */

import { Octokit } from '@octokit/rest'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { GITHUB_AUTH_FILE } from '../constants/app-config'
import { expandTilde } from './path-helpers'
import { ensureDotPortDirectories } from './directory-manager'
import type { GitHubAuthConfig } from '../types/user-system-config'

export async function authenticateWithGitHub(): Promise<Octokit> {
  // Check if we already have a valid token
  const existingAuth = loadAuthConfig()
  if (existingAuth) {
    try {
      const octokit = new Octokit({ auth: existingAuth.token })
      const { data: user } = await octokit.users.getAuthenticated()

      // Validate token scopes
      const scopeCheck = await validateTokenScopes(octokit)

      if (!scopeCheck.valid) {
        console.log(
          chalk.yellow(
            `⚠️  Authenticated as ${user.login}, but token is missing permissions:\n`,
          ),
        )
        scopeCheck.missing.forEach((scope) => {
          console.log(chalk.red(`  ✗ ${scope}`))
        })
        console.log(
          chalk.gray(
            '\nPlease re-authenticate with a token that has the required scopes.\n',
          ),
        )

        // Clear the invalid token
        clearAuthConfig()

        // Prompt for new token
        return await promptForPersonalAccessToken()
      }

      console.log(
        chalk.green(`🔓 Authenticated as ${chalk.bold(user.login)}\n`),
      )
      return octokit
    } catch (error: any) {
      if (error.status === 401) {
        console.log(
          chalk.yellow('⚠️  Existing token has expired or is invalid.\n'),
        )
        console.log(chalk.gray('Please create a new token at:'))
        console.log(chalk.cyan('https://github.com/settings/tokens/new\n'))

        // Clear the expired token
        clearAuthConfig()

        // Prompt for new token
        return await promptForPersonalAccessToken()
      } else {
        console.log(
          chalk.yellow(
            '⚠️  Could not validate existing token, re-authenticating...\n',
          ),
        )

        // Prompt for new token
        return await promptForPersonalAccessToken()
      }
    }
  }

  // No existing token found - show authentication required message
  console.log(chalk.cyan('\n🔐 GitHub Authentication Required\n'))
  console.log(
    chalk.gray(
      'To perform operations on your GitHub repositories, we need to authenticate.\n',
    ),
  )
  console.log(
    chalk.yellow('📱 Starting GitHub device authentication flow...\n'),
  )
  console.log(
    chalk.gray(
      'We will open GitHub in your browser to approve this application.\n',
    ),
  )

  // For now, prompt for a Personal Access Token as a simpler alternative
  // In production, implement full OAuth device flow
  return await promptForPersonalAccessToken()
}

/**
 * Prompt user to create and enter a Personal Access Token
 * This is a simpler alternative to OAuth device flow for now
 */
async function promptForPersonalAccessToken(): Promise<Octokit> {
  const inquirer = (await import('inquirer')).default

  console.log(chalk.cyan('📝 Personal Access Token Setup\n'))
  console.log(
    chalk.gray(
      'To access your private dotfiles repository, please create a Personal Access Token.\n',
    ),
  )
  console.log(chalk.white('Required GitHub permissions:\n'))
  console.log(
    chalk.gray('  ☑️  repo') +
      chalk.white(' (Full control of private repositories)'),
  )
  console.log(chalk.gray('      ↳ This grants ALL repository permissions'))
  console.log(chalk.gray('      ↳ Required for private repository access\n'))
  console.log(chalk.white('To create your token:\n'))
  console.log(chalk.cyan('  1. Visit: https://github.com/settings/tokens/new'))
  console.log(chalk.gray('  2. Give it a descriptive name (e.g., "dotport")'))
  console.log(
    chalk.gray(
      '  3. Select the "repo" scope checkbox (this selects all repo permissions)',
    ),
  )
  console.log(chalk.gray('  4. Click "Generate token"'))
  console.log(chalk.gray('  5. Copy the token and paste it below\n'))
  console.log(
    chalk.yellow(
      "⚠️  Important: Save your token somewhere safe - you won't see it again!\n",
    ),
  )

  let token: string
  try {
    const response = await inquirer.prompt<{ token: string }>([
      {
        type: 'password',
        name: 'token',
        message: 'Enter your GitHub Personal Access Token:',
        mask: '*', // Show asterisks for visual feedback
        validate: (input) => {
          if (!input.trim()) return 'Token is required'
          if (input.length < 20) return 'Token seems too short'
          return true
        },
      },
    ])
    token = response.token
  } catch (error: any) {
    // Handle Ctrl+C gracefully
    if (
      error?.name === 'ExitPromptError' ||
      error?.message?.includes('force closed')
    ) {
      console.log(chalk.yellow('\n\n⚠️  Authentication cancelled.\n'))
      process.exit(0)
    }
    throw error
  }

  // Validate the token
  try {
    const octokit = new Octokit({ auth: token })
    const { data: user } = await octokit.users.getAuthenticated()

    // Check token scopes
    const scopeCheck = await validateTokenScopes(octokit)

    if (!scopeCheck.valid) {
      console.log(
        chalk.yellow(
          '\n⚠️  Token is valid but missing required permissions:\n',
        ),
      )
      scopeCheck.missing.forEach((scope) => {
        console.log(chalk.red(`  ✗ ${scope}`))
      })
      console.log(
        chalk.gray('\nPlease create a new token with these scopes at:'),
      )
      console.log(chalk.cyan('https://github.com/settings/tokens/new\n'))

      let continueAnyway: string
      try {
        const response = await inquirer.prompt<{ continueAnyway: string }>([
          {
            type: 'list',
            name: 'continueAnyway',
            message: 'Continue with limited permissions?',
            choices: [
              { name: 'No, let me create a new token', value: 'no' },
              { name: 'Yes, continue anyway', value: 'yes' },
            ],
          },
        ])
        continueAnyway = response.continueAnyway
      } catch (error: any) {
        // Handle Ctrl+C gracefully
        if (
          error?.name === 'ExitPromptError' ||
          error?.message?.includes('force closed')
        ) {
          console.log(chalk.yellow('\n\n⚠️  Authentication cancelled.\n'))
          process.exit(0)
        }
        throw error
      }

      if (continueAnyway === 'no') {
        throw new Error('Insufficient token permissions')
      }
    }

    console.log(
      chalk.green(
        `\n✅ Successfully authenticated as ${chalk.bold(user.login)}!\n`,
      ),
    )

    if (scopeCheck.valid) {
      console.log(chalk.green('✓ Token has all required permissions\n'))
    }

    // Save the token with metadata
    saveAuthConfig({
      token,
      username: user.login,
      expiresAt: getTokenExpirationInfo(token),
    })

    return octokit
  } catch (error: any) {
    if (error.status === 401) {
      console.error(chalk.red('\n❌ Token is invalid or has expired.'))
      console.error(chalk.gray('Please create a new Personal Access Token at:'))
      console.error(chalk.cyan('https://github.com/settings/tokens/new\n'))
    } else if (error.message === 'Insufficient token permissions') {
      console.error(
        chalk.yellow(
          '\n⚠️  Setup cancelled. Please create a token with the required permissions.\n',
        ),
      )
    } else {
      console.error(
        chalk.red('\n❌ Failed to authenticate with the provided token.'),
      )
      console.error(chalk.gray('Error: ' + error.message + '\n'))
    }
    throw error
  }
}

/**
 * Validate token has required scopes
 */
async function validateTokenScopes(
  octokit: Octokit,
): Promise<{ valid: boolean; missing: string[] }> {
  try {
    // Try to access a protected endpoint to check scopes
    // We'll check if we can list user repos (requires 'repo' scope)
    const response = await octokit.request('GET /user/repos', {
      per_page: 1,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })

    // Check the X-OAuth-Scopes header
    const scopes =
      response.headers['x-oauth-scopes']?.split(',').map((s) => s.trim()) || []
    const requiredScopes = ['repo'] // Only require repo scope
    const missing: string[] = []

    for (const required of requiredScopes) {
      if (!scopes.includes(required)) {
        missing.push(required)
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    }
  } catch (error) {
    // If we can't check scopes, assume they're missing
    return {
      valid: false,
      missing: ['repo'],
    }
  }
}

/**
 * Get token expiration information
 * Note: Classic tokens don't have expiration in the token itself
 * Fine-grained tokens have expiration but it's not easily readable from the token
 */
function getTokenExpirationInfo(token: string): string | undefined {
  // For now, we'll return undefined as we can't easily determine expiration
  // This could be enhanced by decoding fine-grained tokens or tracking creation date
  return undefined
}

/**
 * Load saved authentication config
 */
export function loadAuthConfig(): GitHubAuthConfig | null {
  const authPath = expandTilde(`~/${GITHUB_AUTH_FILE}`)

  try {
    if (fs.existsSync(authPath)) {
      const data = fs.readFileSync(authPath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error(chalk.yellow('⚠️  Failed to load GitHub auth config'))
  }
  return null
}

/**
 * Save authentication config
 */
function saveAuthConfig(authConfig: Partial<GitHubAuthConfig>): void {
  const authPath = expandTilde(`~/${GITHUB_AUTH_FILE}`)

  try {
    // Ensure directories exist
    ensureDotPortDirectories()

    // Add createdAt timestamp if not present
    const fullAuthConfig: GitHubAuthConfig = {
      token: authConfig.token || '',
      username: authConfig.username || '',
      scopes: authConfig.scopes || [],
      createdAt: authConfig.createdAt || new Date().toISOString(),
      expiresAt: authConfig.expiresAt,
    }

    // Ensure parent directory exists
    const authDir = path.dirname(authPath)
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true, mode: 0o755 })
    }

    fs.writeFileSync(authPath, JSON.stringify(fullAuthConfig, null, 2), {
      mode: 0o600, // Only owner can read/write
    })

    console.log(
      chalk.gray(`📁 Token stored securely at: ${chalk.bold(authPath)}`),
    )
    console.log(
      chalk.gray(`   (Permissions: 0600 - only you can read/write)\n`),
    )
  } catch (error) {
    console.error(chalk.red('❌ Failed to save GitHub auth config'))
    throw error
  }
}

/**
 * Clear saved authentication
 */
export function clearAuthConfig(): void {
  const authPath = expandTilde(`~/${GITHUB_AUTH_FILE}`)

  try {
    if (fs.existsSync(authPath)) {
      fs.unlinkSync(authPath)
      console.log(chalk.green('✅ GitHub authentication cleared\n'))
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to clear GitHub auth config'))
  }
}

/**
 * Get an authenticated Octokit instance if available
 */
export function getAuthenticatedOctokit(): Octokit | null {
  const auth = loadAuthConfig()
  if (auth) {
    return new Octokit({ auth: auth.token })
  }
  return null
}
