/**
 * GitHub Repository Operations
 *
 * Utilities for checking, creating, and managing GitHub repositories
 */

import { Octokit } from '@octokit/rest'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type RepoCheckResult = {
  exists: boolean
  isPrivate?: boolean
  url?: string
  sshUrl?: string
  httpsUrl?: string
}

export type CreateRepoOptions = {
  name: string
  isPrivate: boolean
  description?: string
  autoInit?: boolean
}

/**
 * Check if a repository exists for the authenticated user
 */
export async function checkRepositoryExists(
  octokit: Octokit,
  repoName: string,
): Promise<RepoCheckResult> {
  try {
    const { data: user } = await octokit.users.getAuthenticated()
    const owner = user.login

    try {
      const { data: repo } = await octokit.repos.get({
        owner,
        repo: repoName,
      })

      return {
        exists: true,
        isPrivate: repo.private,
        url: repo.html_url,
        sshUrl: repo.ssh_url,
        httpsUrl: repo.clone_url,
      }
    } catch (error: any) {
      if (error.status === 404) {
        return { exists: false }
      }
      throw error
    }
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to check repository existence'))
    console.error(chalk.gray('Error: ' + error.message))
    throw error
  }
}

/**
 * Create a new GitHub repository
 */
export async function createRepository(
  octokit: Octokit,
  options: CreateRepoOptions,
): Promise<{
  success: boolean
  url?: string
  sshUrl?: string
  httpsUrl?: string
  error?: string
}> {
  try {
    console.log(chalk.cyan(`\n📦 Creating repository "${options.name}"...\n`))

    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: options.name,
      description:
        options.description || 'Dotfiles and development machine configuration',
      private: options.isPrivate,
      auto_init: options.autoInit !== false, // Default to true
      gitignore_template: undefined,
      license_template: undefined,
    })

    console.log(chalk.green(`✅ Repository created successfully!`))
    console.log(chalk.gray(`   URL: ${repo.html_url}`))
    console.log(
      chalk.gray(`   Visibility: ${repo.private ? 'Private' : 'Public'}\n`),
    )

    return {
      success: true,
      url: repo.html_url,
      sshUrl: repo.ssh_url,
      httpsUrl: repo.clone_url,
    }
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to create repository'))

    let errorMessage = error.message
    if (error.status === 422) {
      errorMessage = 'Repository name already exists or is invalid'
    } else if (error.status === 403) {
      errorMessage = 'Insufficient permissions to create repository'
    }

    console.error(chalk.gray('Error: ' + errorMessage + '\n'))

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * List all repositories for the authenticated user
 */
export async function listUserRepositories(
  octokit: Octokit,
  options: {
    type?: 'all' | 'owner' | 'public' | 'private' | 'member'
    sort?: 'created' | 'updated' | 'pushed' | 'full_name'
    perPage?: number
  } = {},
): Promise<Array<{ name: string; private: boolean; url: string }>> {
  try {
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      type: options.type || 'owner',
      sort: options.sort || 'updated',
      per_page: options.perPage || 100,
    })

    return repos.map((repo) => ({
      name: repo.name,
      private: repo.private,
      url: repo.html_url,
    }))
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to list repositories'))
    console.error(chalk.gray('Error: ' + error.message))
    throw error
  }
}

/**
 * Get repository details including default branch
 */
export async function getRepositoryDetails(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<{
  defaultBranch: string
  isPrivate: boolean
  url: string
  sshUrl: string
  httpsUrl: string
}> {
  try {
    const { data } = await octokit.repos.get({ owner, repo })

    return {
      defaultBranch: data.default_branch,
      isPrivate: data.private,
      url: data.html_url,
      sshUrl: data.ssh_url,
      httpsUrl: data.clone_url,
    }
  } catch (error: any) {
    console.error(
      chalk.red(`❌ Failed to get repository details for ${owner}/${repo}`),
    )
    console.error(chalk.gray('Error: ' + error.message))
    throw error
  }
}

/**
 * Create .gitignore file in the repository from template (local file system)
 */
export function createGitignoreFile(
  repoPath: string,
  additionalPatterns?: string[],
): boolean {
  try {
    // Get the template path
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      'dotfiles.gitignore',
    )

    if (!fs.existsSync(templatePath)) {
      console.error(
        chalk.yellow(
          '⚠️  Warning: .gitignore template not found at ' + templatePath,
        ),
      )
      return false
    }

    // Read template content
    let gitignoreContent = fs.readFileSync(templatePath, 'utf-8')

    // Add any additional patterns (e.g., user-selected secret files)
    if (additionalPatterns && additionalPatterns.length > 0) {
      gitignoreContent += '\n\n# Additional user-specified files\n'
      additionalPatterns.forEach((pattern) => {
        gitignoreContent += `${pattern}\n`
      })
    }

    // Write to repository
    const gitignorePath = path.join(repoPath, '.gitignore')
    fs.writeFileSync(gitignorePath, gitignoreContent, 'utf-8')

    console.log(chalk.green('✅ Created .gitignore file'))
    console.log(chalk.gray(`   Location: ${gitignorePath}\n`))

    return true
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to create .gitignore file'))
    console.error(chalk.gray('Error: ' + error.message))
    return false
  }
}

/**
 * Add .gitignore file to GitHub repository via API
 */
export async function addGitignoreToRepo(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string = 'main',
  additionalPatterns?: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the template path
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      'dotfiles.gitignore',
    )

    if (!fs.existsSync(templatePath)) {
      return {
        success: false,
        error: '.gitignore template not found at ' + templatePath,
      }
    }

    // Read template content
    let gitignoreContent = fs.readFileSync(templatePath, 'utf-8')

    // Add any additional patterns (e.g., user-selected secret files)
    if (additionalPatterns && additionalPatterns.length > 0) {
      gitignoreContent += '\n\n# Additional user-specified files\n'
      additionalPatterns.forEach((pattern) => {
        gitignoreContent += `${pattern}\n`
      })
    }

    console.log(chalk.cyan('📝 Adding .gitignore file to repository...\n'))

    // Create the .gitignore file in the repository
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: '.gitignore',
      message: 'Add .gitignore file for dotfiles repository',
      content: Buffer.from(gitignoreContent).toString('base64'),
      branch,
    })

    console.log(chalk.green('✅ .gitignore file added to repository\n'))

    return { success: true }
  } catch (error: any) {
    console.error(chalk.red('❌ Failed to add .gitignore file'))
    console.error(chalk.gray('Error: ' + error.message + '\n'))

    return {
      success: false,
      error: error.message,
    }
  }
}
