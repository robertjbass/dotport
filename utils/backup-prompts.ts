/**
 * Backup Prompts - prompt functions for the backup process
 */

import inquirer from 'inquirer'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { displayStepProgress, displayDivider } from './prompt-helpers'
import type { DetectedSystemInfo } from './system-detection'
import {
  detectAllSystemInfo,
  generateDefaultNickname,
  validateNickname,
  normalizeNickname,
  getOSDisplayName,
  getDistroDisplayName,
} from './system-detection'
import { readUserSystemConfig } from './user-system-config'
import { expandTilde, isGitRepository } from './path-helpers'
import {
  getCurrentBranch,
  getAllBranches,
  checkoutBranch,
  pullFromRemote,
  fetchFromRemote,
} from './git-operations'

function findPotentialSecretFiles(): string[] {
  try {
    const homeDir = os.homedir()
    const secretPatterns = [
      'env',
      'secret',
      'key',
      'credential',
      'token',
      'password',
      'auth',
    ]

    // Read all files in home directory (not recursive, just top level)
    // Include hidden files starting with '.'
    const files = fs.readdirSync(homeDir)

    const potentialSecrets: string[] = []

    for (const file of files) {
      // Skip current and parent directory references
      if (file === '.' || file === '..') {
        continue
      }

      // Skip example files
      if (file.toLowerCase().includes('.example')) {
        continue
      }

      const fullPath = path.join(homeDir, file)

      // Skip directories, only look at files
      try {
        const stats = fs.statSync(fullPath)
        if (stats.isDirectory()) {
          continue
        }

        // Check if filename contains any secret-related patterns
        const lowerFileName = file.toLowerCase()
        const matchesPattern = secretPatterns.some((pattern) =>
          lowerFileName.includes(pattern),
        )

        if (matchesPattern) {
          potentialSecrets.push(`~/${file}`)
        }
      } catch (err) {
        // Skip files we can't access (permissions, etc.)
        continue
      }
    }

    // Sort by likely relevance - .env files first, then others
    return potentialSecrets.sort((a, b) => {
      const aIsEnv = a.includes('.env')
      const bIsEnv = b.includes('.env')
      if (aIsEnv && !bIsEnv) return -1
      if (!aIsEnv && bIsEnv) return 1
      return a.localeCompare(b)
    })
  } catch (error) {
    // If we can't read home directory for any reason, return empty array
    return []
  }
}

/**
 * Detect secret file format by analyzing file content
 */
function detectSecretFileFormat(
  filePath: string,
): 'shell-export' | 'dotenv' | 'json' | null {
  try {
    const expandedPath = expandTilde(filePath)
    if (!fs.existsSync(expandedPath)) {
      return null
    }

    const content = fs.readFileSync(expandedPath, 'utf-8')
    const lines = content
      .split('\n')
      .filter((line) => line.trim() && !line.trim().startsWith('#'))

    if (lines.length === 0) {
      return null
    }

    // Check for JSON format
    const trimmedContent = content.trim()
    if (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) {
      try {
        JSON.parse(trimmedContent)
        return 'json'
      } catch {
        // Not valid JSON
      }
    }

    // Count different patterns
    let shellExportCount = 0
    let dotenvCount = 0

    for (const line of lines) {
      // Check for shell export pattern: export VAR="value" or export VAR=value
      if (/^\s*export\s+[A-Z_][A-Z0-9_]*\s*=/.test(line)) {
        shellExportCount++
      }
      // Check for dotenv pattern: VAR="value" or VAR=value (without export)
      else if (/^\s*[A-Z_][A-Z0-9_]*\s*=/.test(line)) {
        dotenvCount++
      }
    }

    // Return the most common format
    if (shellExportCount > dotenvCount) {
      return 'shell-export'
    } else if (dotenvCount > 0) {
      return 'dotenv'
    }

    return null
  } catch (error) {
    return null
  }
}

// ============================================================================
// STEP 1: System Detection & Confirmation
// ============================================================================

export type Step1Result = {
  systemInfo: DetectedSystemInfo
  nickname: string
}

/**
 * Step 1: System Detection & Confirmation
 * Consolidates OS, shell, distro, and runtime detection into one screen
 */
export async function promptStep1SystemDetection(): Promise<Step1Result> {
  displayStepProgress(1, 6, 'System Detection')

  // Detect all system information
  const systemInfo = detectAllSystemInfo()

  // Loop to allow multiple updates
  let confirmed = ''
  while (confirmed !== 'yes') {
    console.log(
      chalk.gray("\nWe've detected the following system information:\n"),
    )

    // Display detected info
    console.log(
      chalk.white('  Operating System:   ') +
        chalk.cyan(getOSDisplayName(systemInfo.os)),
    )
    console.log(
      chalk.white('  Distribution:       ') +
        chalk.cyan(getDistroDisplayName(systemInfo.distro)),
    )
    console.log(
      chalk.white('  Shell:              ') + chalk.cyan(systemInfo.shell),
    )
    console.log(
      chalk.white('  Home Directory:     ') +
        chalk.cyan(systemInfo.homeDirectory),
    )
    console.log()
    console.log(
      chalk.white('  Runtime:            ') +
        chalk.cyan(`node (v${systemInfo.runtimeData.node.version})`),
    )
    console.log(
      chalk.white('  Package Manager:    ') +
        chalk.cyan(systemInfo.runtimeData.node.packageManager),
    )
    console.log(
      chalk.white('  Version Manager:    ') +
        chalk.cyan(systemInfo.runtimeData.node.versionManager),
    )
    console.log()

    // Confirm information is correct
    const response = await inquirer.prompt<{ confirmed: string }>([
      {
        type: 'list',
        name: 'confirmed',
        message: 'Is this information correct?',
        choices: [
          { name: 'Yes, continue', value: 'yes' },
          new inquirer.Separator(),
          { name: '✏️  Update Operating System', value: 'os' },
          { name: '✏️  Update Distribution', value: 'distro' },
          { name: '✏️  Update Shell', value: 'shell' },
          { name: '✏️  Update Runtime Information', value: 'runtime' },
        ],
      },
    ])
    confirmed = response.confirmed

    // Handle manual updates
    if (confirmed === 'os') {
      const { newOS } = await inquirer.prompt<{ newOS: string }>([
        {
          type: 'list',
          name: 'newOS',
          message: 'Select your operating system:',
          choices: [
            { name: 'macOS', value: 'macos' },
            { name: 'Linux', value: 'linux' },
            { name: 'Windows', value: 'windows' },
          ],
        },
      ])
      systemInfo.os = newOS as any
    } else if (confirmed === 'distro') {
      const { newDistro } = await inquirer.prompt<{ newDistro: string }>([
        {
          type: 'input',
          name: 'newDistro',
          message: 'Enter your distribution (e.g., darwin, ubuntu, arch):',
          default: systemInfo.distro,
        },
      ])
      systemInfo.distro = newDistro
    } else if (confirmed === 'shell') {
      const { newShell } = await inquirer.prompt<{ newShell: string }>([
        {
          type: 'list',
          name: 'newShell',
          message: 'Select your shell:',
          choices: [
            { name: 'zsh', value: 'zsh' },
            { name: 'bash', value: 'bash' },
            { name: 'fish', value: 'fish' },
            { name: 'other', value: 'other' },
          ],
        },
      ])
      systemInfo.shell = newShell as any
    } else if (confirmed === 'runtime') {
      console.log(chalk.cyan('\nUpdate Runtime Information:\n'))

      const { packageManager } = await inquirer.prompt<{
        packageManager: string
      }>([
        {
          type: 'list',
          name: 'packageManager',
          message: 'Select package manager:',
          choices: ['npm', 'pnpm', 'yarn', 'bun'],
          default: systemInfo.runtimeData.node.packageManager,
        },
      ])

      const { versionManager } = await inquirer.prompt<{
        versionManager: string
      }>([
        {
          type: 'list',
          name: 'versionManager',
          message: 'Select version manager:',
          choices: ['fnm', 'nvm', 'n', 'asdf', 'none'],
          default: systemInfo.runtimeData.node.versionManager,
        },
      ])

      const { version } = await inquirer.prompt<{ version: string }>([
        {
          type: 'input',
          name: 'version',
          message: 'Enter Node.js version:',
          default: systemInfo.runtimeData.node.version,
        },
      ])

      systemInfo.runtimeData.node.packageManager = packageManager
      systemInfo.runtimeData.node.versionManager = versionManager
      systemInfo.runtimeData.node.version = version
    }
  }

  displayDivider()

  // Ask for machine nickname - check if we have an existing nickname in config
  let defaultNickname = generateDefaultNickname(systemInfo.os)
  try {
    const existingConfig = readUserSystemConfig()
    if (existingConfig?.system?.nickname) {
      defaultNickname = existingConfig.system.nickname
    }
  } catch {
    // No existing config, use generated default
  }

  const { nickname } = await inquirer.prompt<{ nickname: string }>([
    {
      type: 'input',
      name: 'nickname',
      message:
        chalk.white('Enter a nickname for this machine:') +
        chalk.gray(' (lowercase alphanumeric, dashes ok)'),
      default: defaultNickname,
      prefix: chalk.gray(
        `\nExamples: 'macbook-air', 'thinkpad', 'aws-linux', 'raspberry-pi'\n` +
          `This will create a directory: ${systemInfo.os}-${systemInfo.distro}-<nickname>\n`,
      ),
      validate: (input) => {
        const normalized = normalizeNickname(input)
        if (!validateNickname(normalized)) {
          return 'Nickname must contain at least one character (lowercase alphanumeric, dots, or dashes)'
        }
        return true
      },
      filter: (input: string) => normalizeNickname(input),
    },
  ])

  return {
    systemInfo,
    nickname: nickname.trim(),
  }
}

// ============================================================================
// STEP 2: GitHub Authentication (Optional)
// ============================================================================

export type Step2Result = {
  useGitHub: boolean
  skipGitHub: boolean
  alreadyAuthenticated: boolean
}

/**
 * Step 2: GitHub Authentication (Optional)
 * Checks for existing token and offers authentication options
 */
export async function promptStep2GitHubAuth(): Promise<Step2Result> {
  displayStepProgress(2, 6, 'GitHub Authentication')

  // Check if token already exists
  const { loadAuthConfig } = await import('./github-auth')
  const existingAuth = loadAuthConfig()

  if (existingAuth) {
    console.log(
      chalk.green(
        `\n✅ Found existing GitHub authentication for ${chalk.bold(existingAuth.username || 'user')}\n`,
      ),
    )

    const { useExisting } = await inquirer.prompt<{ useExisting: string }>([
      {
        type: 'list',
        name: 'useExisting',
        message: 'How would you like to proceed?',
        choices: [
          { name: 'Use existing GitHub authentication', value: 'yes' },
          { name: 'Re-authenticate with different account', value: 'reauth' },
          { name: 'Continue without GitHub (local only)', value: 'local' },
        ],
      },
    ])

    return {
      useGitHub: useExisting === 'yes' || useExisting === 'reauth',
      skipGitHub: useExisting === 'local',
      alreadyAuthenticated: useExisting === 'yes',
    }
  }

  // No existing token found
  console.log(chalk.gray('\nDotport supports three backup modes:\n'))
  console.log(
    chalk.white('  1. Local folder') +
      chalk.gray(' - Backup to a local directory'),
  )
  console.log(
    chalk.white('  2. Local git repo') +
      chalk.gray(' - Version control without remote sync'),
  )
  console.log(
    chalk.white('  3. GitHub repo') +
      chalk.gray(' - Remote backup with multi-machine sync\n'),
  )
  console.log(
    chalk.gray(
      'GitHub authentication is optional and only needed for remote backup.\n',
    ),
  )

  const { authChoice } = await inquirer.prompt<{ authChoice: string }>([
    {
      type: 'list',
      name: 'authChoice',
      message: 'How would you like to proceed?',
      choices: [
        { name: 'Authenticate with GitHub for remote backup', value: 'auth' },
        { name: 'Continue without GitHub (local backup only)', value: 'local' },
      ],
    },
  ])

  return {
    useGitHub: authChoice === 'auth',
    skipGitHub: authChoice === 'local',
    alreadyAuthenticated: false,
  }
}

// ============================================================================
// STEP 3: Repository Setup
// ============================================================================

export type RepoScenario = 'first-time' | 'existing-remote' | 'existing-local'

export type Step3Result = {
  scenario: RepoScenario
  repoName: string
  repoPath: string
  createGitHubRepo: boolean
  isGitRepo: boolean
  branch: string
}

/**
 * Prompt for branch selection in an existing git repository
 * Pulls latest changes and allows user to select or create a branch
 */
async function promptBranchSelection(repoPath: string): Promise<string> {
  try {
    // Get current branch
    const currentBranch = await getCurrentBranch(repoPath)
    console.log(chalk.gray(`\n  Current branch: ${currentBranch}\n`))

    // Fetch with prune to remove stale remote-tracking branches
    console.log(chalk.cyan('🔄 Syncing with remote...\n'))
    await fetchFromRemote(repoPath, { prune: true })

    // Try to pull latest changes
    const pullResult = await pullFromRemote(repoPath, { branch: currentBranch })

    if (!pullResult.success) {
      console.log(
        chalk.yellow(
          `⚠️  Could not pull latest changes: ${pullResult.error}\n`,
        ),
      )
      console.log(chalk.gray('Continuing with local version.\n'))
    } else {
      console.log(chalk.green('✓ Repository is up to date\n'))
    }

    // Get all branches (now reflects pruned remote branches)
    const branches = await getAllBranches(repoPath)
    const allBranches = Array.from(
      new Set([...branches.local, ...branches.remote]),
    ).filter((branch) => !branch.startsWith('backup-'))

    // Add option to create new branch
    const branchChoices = [
      ...allBranches,
      new inquirer.Separator(),
      { name: '+ Create new branch', value: '<new-branch>' },
    ]

    // Prompt for branch selection
    const { selectedBranch } = await inquirer.prompt<{
      selectedBranch: string
    }>([
      {
        type: 'list',
        name: 'selectedBranch',
        message: 'Which branch would you like to use?',
        choices: branchChoices,
        default: currentBranch || 'main',
      },
    ])

    // Handle new branch creation
    if (selectedBranch === '<new-branch>') {
      const { newBranchName } = await inquirer.prompt<{
        newBranchName: string
      }>([
        {
          type: 'input',
          name: 'newBranchName',
          message: 'Enter name for new branch:',
          validate: (input) => {
            if (!input.trim()) {
              return 'Branch name cannot be empty'
            }
            if (!/^[a-zA-Z0-9/_-]+$/.test(input)) {
              return 'Branch name can only contain letters, numbers, slashes, hyphens, and underscores'
            }
            return true
          },
        },
      ])

      console.log(
        chalk.cyan(
          `\n🔄 Creating and checking out branch: ${newBranchName}...\n`,
        ),
      )

      const checkoutResult = await checkoutBranch(repoPath, newBranchName, {
        createIfMissing: true,
      })

      if (!checkoutResult.success) {
        console.log(
          chalk.red(`❌ Failed to create branch: ${checkoutResult.error}\n`),
        )
        return currentBranch
      }

      console.log(
        chalk.green(`✓ Created and checked out branch: ${newBranchName}\n`),
      )
      return newBranchName
    }

    // Checkout branch if different from current
    if (selectedBranch !== currentBranch) {
      console.log(
        chalk.cyan(`\n🔄 Checking out branch: ${selectedBranch}...\n`),
      )

      const checkoutResult = await checkoutBranch(repoPath, selectedBranch)

      if (!checkoutResult.success) {
        console.log(
          chalk.red(`❌ Failed to checkout branch: ${checkoutResult.error}\n`),
        )
        console.log(chalk.yellow('Using current branch instead.\n'))
        return currentBranch
      }

      console.log(chalk.green(`✓ Checked out branch: ${selectedBranch}\n`))
    }

    return selectedBranch
  } catch (error: any) {
    console.log(chalk.yellow(`⚠️  Branch selection failed: ${error.message}\n`))
    return 'main'
  }
}

/**
 * Step 3: Repository Setup
 * Determines repository scenario and handles setup
 */
export async function promptStep3RepoSetup(
  useGitHub: boolean,
): Promise<Step3Result> {
  displayStepProgress(3, 6, 'Repository Setup')

  // Check if we have an existing repo path in config
  const userConfig = readUserSystemConfig()
  const existingRepoPath = userConfig?.system?.localRepoPath
  let hasExistingRepo = false

  if (existingRepoPath) {
    const expandedPath = expandTilde(existingRepoPath)
    const schemaPath = path.join(expandedPath, 'schema.json')
    hasExistingRepo = fs.existsSync(expandedPath) && fs.existsSync(schemaPath)
  }

  // Build choices based on whether we found an existing repo
  const choices: any[] = []

  if (hasExistingRepo && existingRepoPath) {
    choices.push({
      name: `Use existing repository at ${existingRepoPath}`,
      value: 'existing-saved',
    })
  }

  choices.push({
    name: 'Create new backup directory or use a different one',
    value: 'new-or-different',
  })

  const { repoChoice } = await inquirer.prompt<{ repoChoice: string }>([
    {
      type: 'list',
      name: 'repoChoice',
      message: 'Which directory would you like to use for backups?',
      choices,
    },
  ])

  if (repoChoice === 'existing-saved' && existingRepoPath) {
    // Use the saved repo path - check if it's a git repo and handle branches
    const expandedPath = expandTilde(existingRepoPath)
    const isGit = isGitRepository(expandedPath)
    let selectedBranch = 'main'

    if (isGit) {
      selectedBranch = await promptBranchSelection(expandedPath)
    }

    return {
      scenario: 'existing-local',
      repoName: 'dotfiles',
      repoPath: existingRepoPath,
      createGitHubRepo: false,
      isGitRepo: isGit,
      branch: selectedBranch,
    }
  } else {
    // new-or-different: Handle both first-time and existing repo scenarios
    return await promptNewOrDifferentDirectory(useGitHub)
  }
}

/**
 * Handle new or different directory setup
 * Consolidates first-time and existing repo flows
 */
async function promptNewOrDifferentDirectory(
  useGitHub: boolean,
): Promise<Step3Result> {
  // First, check if they have an existing repo somewhere
  const { hasExisting } = await inquirer.prompt<{ hasExisting: string }>([
    {
      type: 'list',
      name: 'hasExisting',
      message: 'Do you have an existing Dotport backup folder?',
      choices: [
        { name: 'No, this is my first backup', value: 'no' },
        { name: 'Yes, I have an existing folder or repository', value: 'yes' },
      ],
    },
  ])

  if (hasExisting === 'yes') {
    return await promptExistingRepoSetup(useGitHub)
  } else {
    return await promptFirstTimeSetup(useGitHub)
  }
}

/**
 * Handle first-time repository setup
 */
async function promptFirstTimeSetup(useGitHub: boolean): Promise<Step3Result> {
  const { repoPath } = await inquirer.prompt<{ repoPath: string }>([
    {
      type: 'input',
      name: 'repoPath',
      message: 'Where should we create your backup directory?',
      default: '~/dev/dotfiles',
    },
  ])

  // Ask if user wants git version control
  const { useGit } = await inquirer.prompt<{ useGit: string }>([
    {
      type: 'list',
      name: 'useGit',
      message: 'Would you like to use git for version control?',
      choices: [
        { name: 'Yes, initialize as git repository', value: 'yes' },
        { name: 'No, just use a regular folder', value: 'no' },
      ],
    },
  ])

  const isGitRepo = useGit === 'yes'
  let createGitHubRepo = false

  // Only ask about GitHub if user wants git AND is authenticated
  if (isGitRepo && useGitHub) {
    const { createRemote } = await inquirer.prompt<{ createRemote: string }>([
      {
        type: 'list',
        name: 'createRemote',
        message: 'Would you like to create a GitHub repository?',
        choices: [
          { name: 'Yes, create and push to GitHub', value: 'yes' },
          { name: 'No, keep it local only', value: 'no' },
        ],
      },
    ])
    createGitHubRepo = createRemote === 'yes'
  }

  return {
    scenario: 'first-time',
    repoName: 'dotfiles',
    repoPath: repoPath.trim(),
    createGitHubRepo,
    isGitRepo,
    branch: 'main',
  }
}

async function promptExistingRepoSetup(
  _useGitHub: boolean,
): Promise<Step3Result> {
  const { repoLocation } = await inquirer.prompt<{ repoLocation: string }>([
    {
      type: 'list',
      name: 'repoLocation',
      message: 'Where is your dotfiles repository?',
      choices: [
        { name: "On GitHub (I'll provide the repo name)", value: 'github' },
        { name: "Local directory (I'll provide the path)", value: 'local' },
      ],
    },
  ])

  if (repoLocation === 'github') {
    const { repoName } = await inquirer.prompt<{ repoName: string }>([
      {
        type: 'input',
        name: 'repoName',
        message: 'What is your repository name?',
        default: 'dotfiles',
      },
    ])

    const { clonePath } = await inquirer.prompt<{ clonePath: string }>([
      {
        type: 'input',
        name: 'clonePath',
        message: 'Where should we clone it?',
        default: '~/dev/dotfiles',
      },
    ])

    return {
      scenario: 'existing-remote',
      repoName: repoName.trim(),
      repoPath: clonePath.trim(),
      createGitHubRepo: false,
      isGitRepo: true,
      branch: 'main', // Will be detected after clone
    }
  } else {
    const { localPath } = await inquirer.prompt<{ localPath: string }>([
      {
        type: 'input',
        name: 'localPath',
        message: 'Enter the path to your dotfiles repository:',
        default: '~/dev/dotfiles',
      },
    ])

    // TODO: Validate path exists and check if git repo

    return {
      scenario: 'existing-local',
      repoName: 'dotfiles',
      repoPath: localPath.trim(),
      createGitHubRepo: false,
      isGitRepo: true, // Will be validated
      branch: 'main', // Will be detected
    }
  }
}

// ============================================================================
// STEP 4: Secret File Configuration
// ============================================================================

export type Step4Result = {
  enabled: boolean
  secretFilePath?: string
  secretFileFormat?: 'shell-export' | 'dotenv' | 'json'
  createNew?: boolean
}

/**
 * Step 4: Secret File Configuration
 * Simplified to 3 options: have file, create file, or skip
 */
export async function promptStep4SecretConfig(): Promise<Step4Result> {
  displayStepProgress(4, 6, 'Secret File Configuration')

  console.log(
    chalk.gray(
      '\nEnvironment variables and secrets will NOT be committed to your dotfiles repository. Dotport will use this information to help automate the restore process, or help encrypt secrets if you choose to back them up.\n',
    ),
  )

  const { secretChoice } = await inquirer.prompt<{ secretChoice: string }>([
    {
      type: 'list',
      name: 'secretChoice',
      message:
        'Do you have a file containing environment variables or secrets?',
      choices: [
        { name: 'Yes, I have a secret file', value: 'existing' },
        { name: 'No, but I want to create one', value: 'create' },
        { name: 'Skip secret management', value: 'skip' },
      ],
    },
  ])

  if (secretChoice === 'skip') {
    console.log(
      chalk.yellow(
        '\n⚠️  No secret management configured. You can add this later by editing your user-system.json config file.\n',
      ),
    )
    return { enabled: false }
  }

  if (secretChoice === 'existing') {
    // Scan for potential secret files
    const potentialFiles = findPotentialSecretFiles()

    // Debug logging
    if (potentialFiles.length > 0) {
      console.log(
        chalk.gray(
          `\nFound ${potentialFiles.length} potential secret file(s):\n`,
        ),
      )
      potentialFiles.forEach((f) => console.log(chalk.gray(`  • ${f}`)))
      console.log()
    }

    // Build choices for file selection
    const fileChoices: any[] = []

    if (potentialFiles.length > 0) {
      // Add detected files
      potentialFiles.forEach((file) => {
        fileChoices.push({ name: file, value: file })
      })
      fileChoices.push(new inquirer.Separator())
    }

    // Add create/manual options
    fileChoices.push({
      name: 'Create new ~/.env.sh file now',
      value: 'create-new',
    })
    fileChoices.push({ name: 'Manually enter file path', value: 'manual' })

    const { fileChoice } = await inquirer.prompt<{ fileChoice: string }>([
      {
        type: 'list',
        name: 'fileChoice',
        message:
          potentialFiles.length > 0
            ? 'Select your secret file or choose an option:'
            : 'No secret files detected. Choose an option:',
        choices: fileChoices,
        pageSize: 12,
      },
    ])

    let filePath: string
    let shouldCreateFile = false

    if (fileChoice === 'create-new') {
      // Will create new file - skip to format selection
      filePath = '~/.env.sh'
      shouldCreateFile = true
    } else if (fileChoice === 'manual') {
      // Prompt for manual path entry
      const { manualPath } = await inquirer.prompt<{ manualPath: string }>([
        {
          type: 'input',
          name: 'manualPath',
          message: 'Enter the path to your secret file:',
          default: '~/.env.sh',
        },
      ])
      filePath = manualPath.trim()
    } else {
      // User selected a detected file
      filePath = fileChoice
    }

    // Try to detect format from file content (skip if we're creating new)
    const detectedFormat = shouldCreateFile
      ? null
      : detectSecretFileFormat(filePath)

    // Build format choices with aligned pipes
    const formatLabels = ['Shell exports', '.env format', 'JSON format']
    const maxLabelLength = Math.max(...formatLabels.map((l) => l.length))

    const formatChoices = [
      {
        name: `${'Shell exports'.padEnd(maxLabelLength)} | export MY_VAR="value"`,
        value: 'shell-export',
      },
      {
        name: `${'.env format'.padEnd(maxLabelLength)} | MY_VAR=value`,
        value: 'dotenv',
      },
      {
        name: `${'JSON format'.padEnd(maxLabelLength)} | { "MY_VAR": "value" }`,
        value: 'json',
      },
    ]

    // Sort choices to put detected format first
    if (detectedFormat) {
      const detectedIndex = formatChoices.findIndex(
        (c) => c.value === detectedFormat,
      )
      if (detectedIndex > 0) {
        const [detected] = formatChoices.splice(detectedIndex, 1)
        formatChoices.unshift(detected)
      }
    }

    // Display detected format message separately (non-bold)
    if (detectedFormat) {
      console.log(chalk.magenta(`\nDetected format: ${detectedFormat}`))
    }

    const { format } = await inquirer.prompt<{ format: string }>([
      {
        type: 'list',
        name: 'format',
        message: detectedFormat
          ? 'Confirm or choose different format:'
          : 'What format does this file use?',
        choices: formatChoices,
        default: detectedFormat || 'shell-export',
      },
    ])

    return {
      enabled: true,
      secretFilePath: filePath.trim(),
      secretFileFormat: format as 'shell-export' | 'dotenv' | 'json',
      createNew: shouldCreateFile,
    }
  }

  // Create new file
  const { newFilePath } = await inquirer.prompt<{ newFilePath: string }>([
    {
      type: 'input',
      name: 'newFilePath',
      message: 'Where should we create your secret file?',
      default: '~/.env.sh',
    },
  ])

  console.log(chalk.gray("\nWe'll create a file like this:\n"))
  console.log(chalk.cyan('  # ~/.env.sh'))
  console.log(chalk.cyan('  export MY_SECRET="your-secret-here"\n'))

  return {
    enabled: true,
    secretFilePath: newFilePath.trim(),
    secretFileFormat: 'shell-export',
    createNew: true,
  }
}
