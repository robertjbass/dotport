/**
 * Git Operations Utility
 *
 * Provides reusable git operations with error handling and retry logic.
 * These functions ensure consistent git behavior across the application.
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import chalk from 'chalk'
import { expandTilde } from './path-helpers'

const execPromise = promisify(exec)

export type GitStatusResult = {
  hasChanges: boolean
  statusOutput: string
  stagedFiles: string[]
  unstagedFiles: string[]
  untrackedFiles: string[]
}

export type GitCommitResult = {
  success: boolean
  commitHash?: string
  error?: string
}

export type GitPushResult = {
  success: boolean
  error?: string
  retries: number
}

/**
 * Get the status of a git repository
 *
 * @param repoPath - Path to git repository (can contain tilde)
 * @returns Status information
 *
 * @example
 * const status = await getGitStatus('~/dev/dotfiles')
 * if (status.hasChanges) {
 *   console.log('Repository has changes')
 * }
 */
export async function getGitStatus(
  repoPath: string,
): Promise<GitStatusResult> {
  const absolutePath = expandTilde(repoPath)

  try {
    const { stdout } = await execPromise('git status --porcelain', {
      cwd: absolutePath,
    })

    const lines = stdout.trim().split('\n').filter(Boolean)
    const stagedFiles: string[] = []
    const unstagedFiles: string[] = []
    const untrackedFiles: string[] = []

    lines.forEach((line) => {
      const status = line.substring(0, 2)
      const file = line.substring(3)

      if (status[0] !== ' ' && status[0] !== '?') {
        stagedFiles.push(file)
      }
      if (status[1] !== ' ' && status[1] !== '?') {
        unstagedFiles.push(file)
      }
      if (status === '??') {
        untrackedFiles.push(file)
      }
    })

    return {
      hasChanges: lines.length > 0,
      statusOutput: stdout,
      stagedFiles,
      unstagedFiles,
      untrackedFiles,
    }
  } catch (error: any) {
    throw new Error(`Failed to get git status: ${error.message}`)
  }
}

/**
 * Stage all changes in a git repository
 *
 * @param repoPath - Path to git repository (can contain tilde)
 */
export async function stageAllChanges(repoPath: string): Promise<void> {
  const absolutePath = expandTilde(repoPath)

  try {
    await execPromise('git add .', { cwd: absolutePath })
  } catch (error: any) {
    throw new Error(`Failed to stage changes: ${error.message}`)
  }
}

/**
 * Create a git commit with a message
 *
 * @param repoPath - Path to git repository (can contain tilde)
 * @param message - Commit message
 * @param options - Additional options
 * @returns Commit result
 *
 * @example
 * await createGitCommit('~/dev/dotfiles', 'Update dotfiles')
 * await createGitCommit('~/dev/dotfiles', 'Update dotfiles', { author: 'Bot <bot@example.com>' })
 */
export async function createGitCommit(
  repoPath: string,
  message: string,
  options: {
    author?: string
    coAuthors?: string[]
  } = {},
): Promise<GitCommitResult> {
  const absolutePath = expandTilde(repoPath)
  const { author, coAuthors = [] } = options

  try {
    // Build commit message with co-authors
    let fullMessage = message
    if (coAuthors.length > 0) {
      fullMessage += '\n\n'
      coAuthors.forEach((coAuthor) => {
        fullMessage += `Co-Authored-By: ${coAuthor}\n`
      })
    }

    // Use heredoc for safe commit message handling
    const commitCommand = `git commit -m "$(cat <<'EOF'
${fullMessage}
EOF
)"`

    const execOptions: any = { cwd: absolutePath }
    if (author) {
      execOptions.env = { ...process.env, GIT_AUTHOR_NAME: author }
    }

    await execPromise(commitCommand, execOptions)

    // Get the commit hash
    const { stdout: hash } = await execPromise('git rev-parse HEAD', {
      cwd: absolutePath,
    })

    return {
      success: true,
      commitHash: hash.trim(),
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Push changes to remote with retry logic and exponential backoff
 *
 * @param repoPath - Path to git repository (can contain tilde)
 * @param options - Push options
 * @returns Push result with retry information
 *
 * @example
 * const result = await pushToRemote('~/dev/dotfiles')
 * if (!result.success) {
 *   console.error(`Push failed after ${result.retries} retries`)
 * }
 */
export async function pushToRemote(
  repoPath: string,
  options: {
    branch?: string
    remote?: string
    setUpstream?: boolean
    maxRetries?: number
    verbose?: boolean
  } = {},
): Promise<GitPushResult> {
  const absolutePath = expandTilde(repoPath)
  const {
    branch,
    remote = 'origin',
    setUpstream = false,
    maxRetries = 4,
    verbose = false,
  } = options

  let pushCommand = 'git push'
  if (setUpstream && branch) {
    pushCommand += ` -u ${remote} ${branch}`
  } else if (branch) {
    pushCommand += ` ${remote} ${branch}`
  }

  let retries = 0
  let lastError: string | undefined

  while (retries <= maxRetries) {
    try {
      if (verbose && retries > 0) {
        console.log(
          chalk.yellow(
            `  Retry ${retries}/${maxRetries} after ${2 ** retries}s delay...`,
          ),
        )
      }

      await execPromise(pushCommand, { cwd: absolutePath })

      return {
        success: true,
        retries,
      }
    } catch (error: any) {
      lastError = error.message
      retries++

      // Only retry on network errors, not on auth failures or other errors
      if (!isNetworkError(error.message) || retries > maxRetries) {
        break
      }

      // Exponential backoff: 2^retry seconds (2s, 4s, 8s, 16s)
      const delay = 2 ** retries * 1000
      await sleep(delay)
    }
  }

  return {
    success: false,
    error: lastError,
    retries: retries - 1, // Don't count the final failed attempt
  }
}

/**
 * Fetch from remote with retry logic
 *
 * @param repoPath - Path to git repository (can contain tilde)
 * @param options - Fetch options
 * @returns Success status
 */
export async function fetchFromRemote(
  repoPath: string,
  options: {
    branch?: string
    remote?: string
    maxRetries?: number
  } = {},
): Promise<{ success: boolean; error?: string }> {
  const absolutePath = expandTilde(repoPath)
  const { branch, remote = 'origin', maxRetries = 4 } = options

  let fetchCommand = 'git fetch'
  if (remote && branch) {
    fetchCommand += ` ${remote} ${branch}`
  } else if (remote) {
    fetchCommand += ` ${remote}`
  }

  let retries = 0
  let lastError: string | undefined

  while (retries <= maxRetries) {
    try {
      await execPromise(fetchCommand, { cwd: absolutePath })
      return { success: true }
    } catch (error: any) {
      lastError = error.message
      retries++

      if (!isNetworkError(error.message) || retries > maxRetries) {
        break
      }

      const delay = 2 ** retries * 1000
      await sleep(delay)
    }
  }

  return {
    success: false,
    error: lastError,
  }
}

/**
 * Pull from remote with retry logic
 *
 * @param repoPath - Path to git repository (can contain tilde)
 * @param options - Pull options
 * @returns Success status
 */
export async function pullFromRemote(
  repoPath: string,
  options: {
    branch?: string
    remote?: string
    maxRetries?: number
  } = {},
): Promise<{ success: boolean; error?: string }> {
  const absolutePath = expandTilde(repoPath)
  const { branch, remote = 'origin', maxRetries = 4 } = options

  let pullCommand = 'git pull'
  if (remote && branch) {
    pullCommand += ` ${remote} ${branch}`
  }

  let retries = 0
  let lastError: string | undefined

  while (retries <= maxRetries) {
    try {
      await execPromise(pullCommand, { cwd: absolutePath })
      return { success: true }
    } catch (error: any) {
      lastError = error.message
      retries++

      if (!isNetworkError(error.message) || retries > maxRetries) {
        break
      }

      const delay = 2 ** retries * 1000
      await sleep(delay)
    }
  }

  return {
    success: false,
    error: lastError,
  }
}

/**
 * Check if an error is a network error (should be retried)
 *
 * @param errorMessage - Error message from git command
 * @returns True if error appears to be network-related
 */
function isNetworkError(errorMessage: string): boolean {
  const networkErrorPatterns = [
    'Could not resolve host',
    'Failed to connect',
    'Connection timed out',
    'Connection refused',
    'Network is unreachable',
    'Temporary failure in name resolution',
    'unable to access',
  ]

  return networkErrorPatterns.some((pattern) =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase()),
  )
}

/**
 * Sleep for a specified duration
 *
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Get the current branch name
 *
 * @param repoPath - Path to git repository (can contain tilde)
 * @returns Current branch name
 */
export async function getCurrentBranch(repoPath: string): Promise<string> {
  const absolutePath = expandTilde(repoPath)

  try {
    const { stdout } = await execPromise('git branch --show-current', {
      cwd: absolutePath,
    })
    return stdout.trim()
  } catch (error: any) {
    throw new Error(`Failed to get current branch: ${error.message}`)
  }
}

/**
 * Check if the current branch is ahead of remote
 *
 * @param repoPath - Path to git repository (can contain tilde)
 * @returns True if local branch is ahead of remote
 */
export async function isAheadOfRemote(repoPath: string): Promise<boolean> {
  const absolutePath = expandTilde(repoPath)

  try {
    const { stdout } = await execPromise('git status -sb', {
      cwd: absolutePath,
    })
    return stdout.includes('ahead')
  } catch (error: any) {
    throw new Error(`Failed to check if ahead of remote: ${error.message}`)
  }
}

/**
 * Get the last commit author information
 *
 * @param repoPath - Path to git repository (can contain tilde)
 * @returns Object with author name and email
 */
export async function getLastCommitAuthor(
  repoPath: string,
): Promise<{ name: string; email: string }> {
  const absolutePath = expandTilde(repoPath)

  try {
    const { stdout } = await execPromise("git log -1 --format='%an %ae'", {
      cwd: absolutePath,
    })
    const [name, email] = stdout.trim().replace(/'/g, '').split(' ')
    return { name, email }
  } catch (error: any) {
    throw new Error(`Failed to get last commit author: ${error.message}`)
  }
}

/**
 * Get all branches (local and remote) in a repository
 *
 * @param repoPath - Path to git repository (can contain tilde)
 * @returns Object with local and remote branches
 */
export async function getAllBranches(repoPath: string): Promise<{
  local: string[]
  remote: string[]
}> {
  const absolutePath = expandTilde(repoPath)

  try {
    // Get local branches
    const { stdout: localOutput } = await execPromise('git branch', {
      cwd: absolutePath,
    })
    const local = localOutput
      .split('\n')
      .map((line) => line.replace('*', '').trim())
      .filter(Boolean)

    // Get remote branches
    const { stdout: remoteOutput } = await execPromise('git branch -r', {
      cwd: absolutePath,
    })
    const remote = remoteOutput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.includes('HEAD'))
      .map((line) => line.replace(/^origin\//, ''))

    return { local, remote }
  } catch (error: any) {
    throw new Error(`Failed to get branches: ${error.message}`)
  }
}

/**
 * Checkout a branch in a repository
 *
 * @param repoPath - Path to git repository (can contain tilde)
 * @param branch - Branch name to checkout
 * @param options - Checkout options
 * @returns Success status
 */
export async function checkoutBranch(
  repoPath: string,
  branch: string,
  options: {
    createIfMissing?: boolean
  } = {},
): Promise<{ success: boolean; error?: string }> {
  const absolutePath = expandTilde(repoPath)
  const { createIfMissing = false } = options

  try {
    let checkoutCommand = `git checkout ${branch}`
    if (createIfMissing) {
      checkoutCommand = `git checkout -b ${branch}`
    }

    await execPromise(checkoutCommand, { cwd: absolutePath })
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}
