/**
 * Backup Prompts for Simplified Flow
 *
 * Contains all prompt functions for the new 6-step backup process
 */

import inquirer from 'inquirer'
import chalk from 'chalk'
import {
  displayStepProgress,
  displayDivider,
  BACK_OPTION,
} from './prompt-helpers'
import type { DetectedSystemInfo } from './system-detection'
import {
  detectAllSystemInfo,
  generateDefaultNickname,
  validateNickname,
  getOSDisplayName,
  getDistroDisplayName,
} from './system-detection'

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

  console.log(chalk.gray("\nWe've detected the following system information:\n"))

  // Display detected info
  console.log(chalk.white('  Operating System:   ') + chalk.cyan(getOSDisplayName(systemInfo.os)))
  console.log(chalk.white('  Distribution:       ') + chalk.cyan(getDistroDisplayName(systemInfo.distro)))
  console.log(chalk.white('  Shell:              ') + chalk.cyan(systemInfo.shell))
  console.log(chalk.white('  Home Directory:     ') + chalk.cyan(systemInfo.homeDirectory))
  console.log()
  console.log(chalk.white('  Runtime:            ') + chalk.cyan('node'))
  console.log(chalk.white('  Package Manager:    ') + chalk.cyan(systemInfo.runtimeData.node.packageManager))
  console.log(chalk.white('  Version Manager:    ') + chalk.cyan(systemInfo.runtimeData.node.versionManager))
  console.log(chalk.white('  Runtime Version:    ') + chalk.cyan(systemInfo.runtimeData.node.version))
  console.log()

  // Confirm information is correct
  const { confirmed } = await inquirer.prompt<{ confirmed: string }>([
    {
      type: 'list',
      name: 'confirmed',
      message: 'Is this information correct?',
      choices: [
        { name: 'Yes, continue', value: 'yes' },
        { name: 'Update Operating System', value: 'os' },
        { name: 'Update Distribution', value: 'distro' },
        { name: 'Update Shell', value: 'shell' },
        { name: 'Update Runtime Information', value: 'runtime' },
      ],
    },
  ])

  // For now, we'll accept what was detected
  // TODO: Add manual override options for each field
  if (confirmed !== 'yes') {
    console.log(
      chalk.yellow('\n⚠️  Manual updates not yet implemented. Using detected values.\n')
    )
  }

  displayDivider()

  // Ask for machine nickname
  const defaultNickname = generateDefaultNickname(systemInfo.os)
  const { nickname } = await inquirer.prompt<{ nickname: string }>([
    {
      type: 'input',
      name: 'nickname',
      message: 'Enter a nickname for this machine:',
      default: defaultNickname,
      prefix: chalk.gray(
        `\nExamples: 'macbook-air', 'thinkpad', 'aws-linux', 'raspberry-pi'\n` +
        `This will create a directory: ${systemInfo.os}-${systemInfo.distro}-<nickname>\n`
      ),
      validate: (input) => {
        if (!validateNickname(input)) {
          return 'Nickname can only contain letters, numbers, dots, hyphens, and underscores'
        }
        return true
      },
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

  console.log(
    chalk.gray(
      '\nThis application uses GitHub to store your config files in a\n' +
      'private repository and enables advanced features like multi-machine\n' +
      'sync.\n'
    )
  )
  console.log(chalk.gray('GitHub authentication is optional but recommended.\n'))

  const { authChoice } = await inquirer.prompt<{ authChoice: string }>([
    {
      type: 'list',
      name: 'authChoice',
      message: 'How would you like to proceed?',
      choices: [
        { name: 'Authenticate with GitHub', value: 'auth' },
        { name: 'Continue with local backup only (limited functionality)', value: 'local' },
        { name: 'I already have a token configured', value: 'existing' },
      ],
    },
  ])

  return {
    useGitHub: authChoice === 'auth',
    skipGitHub: authChoice === 'local',
    alreadyAuthenticated: authChoice === 'existing',
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
 * Step 3: Repository Setup
 * Determines repository scenario and handles setup
 */
export async function promptStep3RepoSetup(
  useGitHub: boolean
): Promise<Step3Result> {
  displayStepProgress(3, 6, 'Repository Setup')

  // Ask if first time or existing
  const { isFirstTime } = await inquirer.prompt<{ isFirstTime: string }>([
    {
      type: 'list',
      name: 'isFirstTime',
      message: 'Is this your first time backing up with DotPort?',
      choices: [
        { name: 'Yes, this is my first backup', value: 'yes' },
        { name: 'No, I have an existing DotPort repository', value: 'no' },
      ],
    },
  ])

  if (isFirstTime === 'yes') {
    return await promptFirstTimeSetup(useGitHub)
  } else {
    return await promptExistingRepoSetup(useGitHub)
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
      message: 'Where should we create your dotfiles repository?',
      default: '~/dev/dotfiles',
    },
  ])

  let createGitHubRepo = false
  if (useGitHub) {
    const { createRemote } = await inquirer.prompt<{ createRemote: string }>([
      {
        type: 'list',
        name: 'createRemote',
        message: 'Would you like to connect this to GitHub?',
        choices: [
          { name: 'Yes, create a private GitHub repository', value: 'yes' },
          { name: 'No, keep it local only (you can add GitHub later)', value: 'no' },
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
    isGitRepo: true, // We'll initialize it
    branch: 'main',
  }
}

/**
 * Handle existing repository setup
 */
async function promptExistingRepoSetup(useGitHub: boolean): Promise<Step3Result> {
  const { repoLocation } = await inquirer.prompt<{ repoLocation: string }>([
    {
      type: 'list',
      name: 'repoLocation',
      message: 'Where is your dotfiles repository?',
      choices: [
        { name: 'On GitHub (I\'ll provide the repo name)', value: 'github' },
        { name: 'Local directory (I\'ll provide the path)', value: 'local' },
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
  secretFileFormat?: 'shell-export' | 'dotenv'
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
      '\nEnvironment variables and secrets will NOT be committed to your\n' +
      'dotfiles repository. We can help you manage them separately.\n'
    )
  )

  const { secretChoice } = await inquirer.prompt<{ secretChoice: string }>([
    {
      type: 'list',
      name: 'secretChoice',
      message: 'Do you have a file containing environment variables or secrets?',
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
        '\n⚠️  No secret management configured. You can add this later by\n' +
        '   editing your user-system.json config file.\n'
      )
    )
    return { enabled: false }
  }

  if (secretChoice === 'existing') {
    const { filePath } = await inquirer.prompt<{ filePath: string }>([
      {
        type: 'input',
        name: 'filePath',
        message: 'Enter the path to your secret file:',
        default: '~/.env.sh',
      },
    ])

    const { format } = await inquirer.prompt<{ format: string }>([
      {
        type: 'list',
        name: 'format',
        message: 'What format does this file use?',
        choices: [
          { name: 'Shell exports (export MY_VAR="value")', value: 'shell-export' },
          { name: '.env format (MY_VAR="value")', value: 'dotenv' },
        ],
      },
    ])

    return {
      enabled: true,
      secretFilePath: filePath.trim(),
      secretFileFormat: format as 'shell-export' | 'dotenv',
      createNew: false,
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
