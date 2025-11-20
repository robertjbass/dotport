#!/usr/bin/env node

import inquirer from 'inquirer'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import ScriptSession from '../clients/script-session'

// Authentication and configuration
import { authenticateWithGitHub } from '../utils/github-auth'
import { getConfig, ensureDirectories } from '../utils/config'

// Repository operations
import {
  checkRepositoryExists,
  createRepository,
  addGitignoreToRepo,
} from '../utils/github-repo'

// Constants
import {
  DEFAULT_REPO_NAME,
  DEFAULT_CLONE_LOCATION,
  COMMON_DISTRIBUTIONS,
  ALL_LINUX_DISTRIBUTIONS,
} from '../utils/constants'

// File discovery and backup
import {
  getExistingFiles,
  groupFilesByCategory,
  formatFileForDisplay,
  getCategoryDisplayName,
  DiscoveredFile,
} from '../utils/file-discovery'
import {
  backupFilesToRepo,
  generateRepoPath,
  previewBackup,
} from '../utils/file-backup'

// Package, extension, and runtime detection
import {
  detectPackageManagers,
  createPackageManager,
  getPackageManagerCommands,
} from '../utils/package-detection'
import {
  detectInstalledEditors,
  createEditorExtensions,
  exportExtensionsToFile,
} from '../utils/editor-detection'
import {
  detectAllRuntimes,
  detectAvailableNodeManagers,
  detectNodeVersions,
  detectNodeManagerFromShell,
} from '../utils/runtime-detection'

// Schema export
import { exportSchemaToRepo, createSchemaReadme } from '../utils/schema-export'

// Dconf export (GNOME settings/keybindings - Linux only)
import { exportGnomeSettings } from '../utils/dconf-export'

// Type definitions
import {
  TrackedFile,
  BackupConfig,
  DEFAULT_BACKUP_CONFIG,
  PackageManager,
  EditorExtensions,
  RuntimeVersion,
  OperatingSystem as BackupOS,
} from '../types/backup-config'

// New utility modules
import {
  expandTilde,
  validatePath,
  pathExists,
  isGitRepository,
} from '../utils/path-helpers'
import {
  displayWelcome,
  displayStepProgress,
  displaySummarySection,
  displayDivider,
  displayError,
  displaySuccess,
  displayWarning,
  displayInfo,
  BACK_OPTION,
} from '../utils/prompt-helpers'
import {
  getGitStatus,
  stageAllChanges,
  createGitCommit,
  pushToRemote,
  getCurrentBranch,
  getAllBranches,
  checkoutBranch,
  pullFromRemote,
} from '../utils/git-operations'
import { buildBackupConfig, convertOSType } from '../utils/schema-builder'
import {
  checkRCFileSourcesSecret,
  addSecretSourceToRC,
  parseEnvFile,
  convertEnvToEnvSh,
} from '../utils/shell-config'

/**
 * Setup Script - Interactive configuration for dev machine backup/restore
 *
 * This script guides users through configuring their backup preferences:
 * - Operating system detection
 * - Config file storage options (GitHub, other Git services)
 * - Secret storage preferences (various local and cloud options)
 */

type OperatingSystem = 'macOS' | 'linux' | 'windows' | 'other'
type ConfigStorage = 'github' | 'other-git' | 'none'
type SecretStorageCategory =
  | 'none'
  | 'local-file'
  | 'git-remote'
  | 'git-local'
  | 'platform'
  | 'cloud'
  | 'vault'
  | 'os-storage'
  | 'password-manager'

type SetupConfig = {
  os: OperatingSystem
  shell?: string
  configFiles: {
    versionControl: boolean
    service: ConfigStorage
    gitRepoUrl?: string
    repoExists?: boolean
    repoName?: string
    repoVisibility?: 'public' | 'private'
    cloneLocation?: string
    multiOS?: boolean
    supportedDistros?: string[]
    machineDistro?: string
    machineNickname?: string
  }
  secrets: {
    enabled: boolean
    storageType?: SecretStorageCategory
    details?: {
      localType?: string
      cloudService?: string
      gitEncryption?: string
      platformService?: string
      secretFileName?: string
      secretFileLocation?: string
      secretFileExists?: string
      createSecretFile?: string
    }
  }
  detectedPackages?: PackageManager[]
  detectedExtensions?: EditorExtensions[]
  detectedRuntimes?: RuntimeVersion[]
}

/**
 * Detect operating system automatically
 *
 * Uses the ScriptSession client to determine the current operating system.
 * Maps platform identifiers to user-friendly OS names.
 *
 * @returns Operating system type
 */
function detectOS(): OperatingSystem {
  const platform = ScriptSession.operatingSystem

  if (platform === 'darwin') return 'macOS'
  if (platform === 'linux') return 'linux'
  if (platform === 'win32') return 'windows'
  return 'other'
}

/**
 * Detect the default shell
 *
 * Attempts to detect the user's default shell from environment variables.
 *
 * @returns Shell name (zsh, bash, fish, etc.) or null if unable to detect
 */
function detectShell(): string | null {
  const shell = process.env.SHELL
  if (!shell) return null

  // Extract shell name from path (e.g., /bin/zsh -> zsh)
  const shellName = shell.split('/').pop()
  return shellName || null
}

/**
 * Prompt for operating system confirmation
 */
async function promptOperatingSystem(
  showBack = false,
  stepNumber = 1,
): Promise<OperatingSystem | typeof BACK_OPTION> {
  const detectedOS = detectOS()

  displayStepProgress(stepNumber, 9, 'Operating System Detection')

  // First, confirm the detected OS
  const choices: any[] = [
    { name: 'Yes', value: 'yes' },
    { name: 'No', value: 'no' },
  ]

  if (showBack) {
    choices.push(new inquirer.Separator())
    choices.push({ name: '← Go back', value: 'back' })
  }

  const { osConfirmed } = await inquirer.prompt<{ osConfirmed: string }>([
    {
      type: 'list',
      name: 'osConfirmed',
      message: `Operating System Detected (${detectedOS}). Is this correct?`,
      choices,
    },
  ])

  if (osConfirmed === 'back') {
    return BACK_OPTION
  }

  let os: OperatingSystem = detectedOS

  // If not confirmed, allow manual selection
  if (osConfirmed === 'no') {
    const manualChoices: any[] = [
      { name: '🍎  macOS', value: 'macOS' },
      { name: '🐧  Linux', value: 'linux' },
    ]

    if (showBack) {
      manualChoices.push(new inquirer.Separator())
      manualChoices.push({ name: '← Go back', value: 'back' })
    }

    const { manualOS } = await inquirer.prompt<{ manualOS: string }>([
      {
        type: 'list',
        name: 'manualOS',
        message: 'Select your operating system:',
        choices: manualChoices,
      },
    ])

    if (manualOS === 'back') {
      return BACK_OPTION
    }

    os = manualOS as OperatingSystem
  }

  // Exit if unsupported OS
  if (os === 'windows' || os === 'other') {
    console.log(
      chalk.red(
        '\n❌ We do not currently support backup/restore for this operating system.',
      ),
    )
    console.log(chalk.gray('   Supported systems: macOS and Linux\n'))
    process.exit(1)
  }

  return os
}

/**
 * Prompt for default shell/terminal
 */
async function promptShell(
  showBack = false,
  stepNumber = 2,
): Promise<string | typeof BACK_OPTION> {
  const detectedShell = detectShell()

  displayStepProgress(stepNumber, 9, 'Default Shell Detection')

  console.log(
    chalk.gray(
      '\n  We need to know your default shell to configure the correct RC files.\n',
    ),
  )

  const commonShells = ['zsh', 'bash', 'fish']
  const choices: any[] = []

  // If we detected a shell, show it first
  if (detectedShell) {
    console.log(chalk.gray(`  Detected shell: ${detectedShell}\n`))
    choices.push({
      name: `${detectedShell} (detected)`,
      value: detectedShell,
    })
  }

  // Add common shells that weren't detected
  commonShells
    .filter((shell) => shell !== detectedShell)
    .forEach((shell) => {
      choices.push({ name: shell, value: shell })
    })

  // Add "Other" option
  choices.push({ name: 'Other (manual entry)', value: 'other' })

  if (showBack) {
    choices.push(new inquirer.Separator())
    choices.push({ name: '← Go back', value: 'back' })
  }

  const { shell } = await inquirer.prompt<{ shell: string }>([
    {
      type: 'list',
      name: 'shell',
      message: 'What is your default shell?',
      choices,
    },
  ])

  if (shell === 'back') {
    return BACK_OPTION
  }

  // If "Other", prompt for manual entry
  if (shell === 'other') {
    const { customShell } = await inquirer.prompt<{ customShell: string }>([
      {
        type: 'input',
        name: 'customShell',
        message: 'Enter your shell name:',
        validate: (input) => {
          if (!input.trim()) return 'Shell name is required'
          return true
        },
      },
    ])
    return customShell.trim()
  }

  return shell
}

/**
 * Prompt for config file storage preferences
 */
async function promptConfigFileStorage(
  currentOS: OperatingSystem,
  showBack = false,
  stepNumber = 3,
): Promise<SetupConfig['configFiles'] | typeof BACK_OPTION> {
  displayStepProgress(stepNumber, 9, 'Config File Storage')
  console.log(
    chalk.dim(
      '\n  Config files: dotfiles like .bashrc, .zshrc, editor settings, etc.\n  This does NOT include secrets like SSH keys or API tokens.\n',
    ),
  )

  const vcChoices: any[] = [
    { name: 'Yes', value: 'yes' },
    { name: 'No', value: 'no' },
  ]

  if (showBack) {
    vcChoices.push(new inquirer.Separator())
    vcChoices.push({ name: '← Go back', value: 'back' })
  }

  const { hasVersionControl } = await inquirer.prompt<{
    hasVersionControl: string
  }>([
    {
      type: 'list',
      name: 'hasVersionControl',
      message: 'Do you currently store config files in version control?',
      choices: vcChoices,
    },
  ])

  console.log('') // Add spacing after answer

  if (hasVersionControl === 'back') {
    return BACK_OPTION
  }

  if (hasVersionControl === 'no') {
    return {
      versionControl: false,
      service: 'none',
    }
  }

  const serviceChoices: any[] = [
    { name: 'GitHub', value: 'github' },
    { name: 'Other Git Service', value: 'other-git' },
  ]

  if (showBack) {
    serviceChoices.push(new inquirer.Separator())
    serviceChoices.push({ name: '← Go back', value: 'back' })
  }

  const { service } = await inquirer.prompt<{ service: string }>([
    {
      type: 'list',
      name: 'service',
      message: 'Which service do you use to store your config files?',
      choices: serviceChoices,
    },
  ])

  console.log('') // Add spacing after answer

  if (service === 'back') {
    return BACK_OPTION
  }

  let gitRepoUrl: string | undefined
  let repoExists: boolean | undefined
  let repoName: string | undefined
  let repoVisibility: 'public' | 'private' | undefined
  let cloneLocation: string | undefined
  let multiOS: boolean | undefined
  let supportedDistros: string[] | undefined
  let machineDistro: string | undefined
  let machineNickname: string | undefined

  if (service === 'github' || service === 'other-git') {
    if (service === 'github') {
      // Authenticate with GitHub for repository operations
      console.log(chalk.gray('\n📡 Authenticating with GitHub...\n'))
      let octokit
      try {
        octokit = await authenticateWithGitHub()
      } catch (error) {
        console.log(
          chalk.yellow(
            '\n⚠️  GitHub authentication failed. You can set this up later.\n',
          ),
        )
        // Fall back to manual URL entry with back option
        const { action } = await inquirer.prompt<{ action: string }>([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: 'Enter repository URL manually', value: 'manual' },
              { name: 'Retry GitHub authentication', value: 'retry' },
              new inquirer.Separator(),
              { name: '← Go back', value: 'back' },
            ],
          },
        ])

        if (action === 'back') {
          return BACK_OPTION
        }

        if (action === 'retry') {
          try {
            octokit = await authenticateWithGitHub()
          } catch (retryError) {
            console.log(chalk.red('\n❌ GitHub authentication failed again.\n'))
            return BACK_OPTION
          }
        } else {
          // Manual URL entry
          const { repoUrl } = await inquirer.prompt<{ repoUrl: string }>([
            {
              type: 'input',
              name: 'repoUrl',
              message: 'Enter your Git repository URL:',
              validate: (input) => {
                if (!input.trim()) return 'Repository URL is required'
                return true
              },
            },
          ])
          gitRepoUrl = repoUrl
          return {
            versionControl: true,
            service: service as ConfigStorage,
            gitRepoUrl,
          }
        }
      }

      // Check if repository exists or create new one
      const repoSetup = await handleRepositorySetup(octokit, DEFAULT_REPO_NAME)
      if (repoSetup === BACK_OPTION) {
        return BACK_OPTION
      }

      repoExists = repoSetup.exists
      repoName = repoSetup.repoName
      repoVisibility = repoSetup.visibility
      gitRepoUrl = repoSetup.repoUrl

      // Ask about machine configuration (distro and nickname)
      const machineConfig = await promptMachineConfiguration(currentOS)
      if (machineConfig === BACK_OPTION) {
        return BACK_OPTION
      }

      // Store machine configuration
      machineDistro = machineConfig.distro
      machineNickname = machineConfig.nickname

      // For backwards compatibility, store in multiOS/supportedDistros
      // but these are now less relevant with flat structure
      multiOS = !machineConfig.isFirstTime // Existing repos support multiple machines
      supportedDistros = [machineDistro]

      // Ask where to clone
      const location = await promptCloneLocation(repoExists, repoName)
      if (location === BACK_OPTION) {
        return BACK_OPTION
      }
      cloneLocation = location
    } else {
      // other-git service - just get the URL
      const { repoUrl } = await inquirer.prompt<{ repoUrl: string }>([
        {
          type: 'input',
          name: 'repoUrl',
          message: 'Enter your Git repository URL:',
          validate: (input) => {
            if (!input.trim()) return 'Repository URL is required'
            return true
          },
        },
      ])
      gitRepoUrl = repoUrl
    }
  }

  return {
    versionControl: true,
    service: service as ConfigStorage,
    gitRepoUrl,
    repoExists,
    repoName,
    repoVisibility,
    cloneLocation,
    multiOS,
    supportedDistros,
    machineDistro,
    machineNickname,
  }
}

/**
 * Check if repository exists and handle creation flow
 */
async function handleRepositorySetup(
  octokit: any,
  repoName: string = DEFAULT_REPO_NAME,
): Promise<
  | {
      exists: boolean
      repoName: string
      repoUrl?: string
      visibility?: 'public' | 'private'
    }
  | typeof BACK_OPTION
> {
  try {
    console.log(
      chalk.gray(`\n🔍 Checking if repository "${repoName}" exists...\n`),
    )

    const checkResult = await checkRepositoryExists(octokit, repoName)

    if (checkResult.exists) {
      console.log(chalk.green(`✅ Repository "${repoName}" already exists!`))
      console.log(chalk.gray(`   URL: ${checkResult.url}`))
      console.log(
        chalk.gray(
          `   Visibility: ${checkResult.isPrivate ? 'Private' : 'Public'}\n`,
        ),
      )

      const { useExisting } = await inquirer.prompt<{ useExisting: string }>([
        {
          type: 'list',
          name: 'useExisting',
          message: 'Would you like to use this existing repository?',
          choices: [
            { name: 'Yes, use this repository', value: 'yes' },
            {
              name: 'No, let me specify a different repository name',
              value: 'no',
            },
            new inquirer.Separator(),
            { name: '← Go back', value: 'back' },
          ],
        },
      ])

      if (useExisting === 'back') return BACK_OPTION

      if (useExisting === 'yes') {
        console.log('') // Add spacing after answer
        return {
          exists: true,
          repoName,
          repoUrl: checkResult.httpsUrl,
          visibility: checkResult.isPrivate ? 'private' : 'public',
        }
      }

      console.log('') // Add spacing before next question

      // User wants a different name
      const { newRepoName } = await inquirer.prompt<{ newRepoName: string }>([
        {
          type: 'input',
          name: 'newRepoName',
          message: 'Enter a different repository name:',
          default: 'dotfiles-backup',
          validate: (input) => {
            if (!input.trim()) return 'Repository name is required'
            if (!/^[a-zA-Z0-9._-]+$/.test(input)) {
              return 'Repository name can only contain letters, numbers, dots, hyphens, and underscores'
            }
            return true
          },
        },
      ])

      // Recursively check the new name
      return await handleRepositorySetup(octokit, newRepoName.trim())
    }

    // Repository doesn't exist - ask if they want to create it
    console.log(chalk.yellow(`⚠️  Repository "${repoName}" does not exist.\n`))

    const { createRepo } = await inquirer.prompt<{ createRepo: string }>([
      {
        type: 'list',
        name: 'createRepo',
        message: 'Would you like to create this repository?',
        choices: [
          { name: 'Yes, create it now', value: 'yes' },
          { name: "No, I'll create it manually later", value: 'no' },
          new inquirer.Separator(),
          { name: '← Go back', value: 'back' },
        ],
      },
    ])

    if (createRepo === 'back') return BACK_OPTION

    if (createRepo === 'no') {
      return {
        exists: false,
        repoName,
      }
    }

    // Ask for visibility
    const { visibility } = await inquirer.prompt<{
      visibility: 'public' | 'private'
    }>([
      {
        type: 'list',
        name: 'visibility',
        message: 'Should the repository be public or private?',
        choices: [
          {
            name: 'Private (recommended for dotfiles with sensitive data)',
            value: 'private',
          },
          { name: 'Public (visible to everyone)', value: 'public' },
        ],
      },
    ])

    // Create the repository
    const result = await createRepository(octokit, {
      name: repoName,
      isPrivate: visibility === 'private',
      description: 'Dotfiles and development machine configuration',
      autoInit: true,
    })

    if (!result.success) {
      console.log(
        chalk.red(`\n❌ Failed to create repository: ${result.error}\n`),
      )
      return BACK_OPTION
    }

    // Get owner from authenticated user
    const { data: user } = await octokit.users.getAuthenticated()
    const owner = user.login

    // Add .gitignore file to the newly created repository
    const gitignoreResult = await addGitignoreToRepo(
      octokit,
      owner,
      repoName,
      'main',
    )
    if (!gitignoreResult.success) {
      console.log(
        chalk.yellow(
          `⚠️  Warning: Failed to add .gitignore file: ${gitignoreResult.error}`,
        ),
      )
      console.log(chalk.gray('You can add it manually later.\n'))
    }

    return {
      exists: true,
      repoName,
      repoUrl: result.httpsUrl,
      visibility,
    }
  } catch (error: any) {
    console.error(chalk.red('\n❌ Error during repository setup'))
    console.error(chalk.gray('Error: ' + error.message + '\n'))
    return BACK_OPTION
  }
}

/**
 * Prompt for multi-OS support
 */
/**
 * Prompt for machine-specific configuration
 * Uses naming convention: <os>-<distro>-<nickname>
 */
async function promptMachineConfiguration(currentOS: OperatingSystem): Promise<
  | {
      isFirstTime: boolean
      distro: string
      nickname: string
    }
  | typeof BACK_OPTION
> {
  console.log('') // Add spacing before question

  // Ask if this is a first-time backup or existing
  const { backupType } = await inquirer.prompt<{ backupType: string }>([
    {
      type: 'list',
      name: 'backupType',
      message: 'Is this a first-time backup or have you backed up before?',
      prefix: chalk.gray(
        'Your dotfiles repo can contain multiple machine configurations.\nEach machine gets its own directory at the root level.\n',
      ),
      choices: [
        { name: 'First-time backup (new dotfiles repo)', value: 'first' },
        { name: 'I have an existing dotfiles repo', value: 'existing' },
        new inquirer.Separator(),
        { name: '← Go back', value: 'back' },
      ],
    },
  ])

  if (backupType === 'back') return BACK_OPTION

  const isFirstTime = backupType === 'first'

  // Determine the distro
  let distro: string

  if (currentOS === 'macOS') {
    // For macOS, always use 'darwin'
    distro = 'darwin'
  } else if (currentOS === 'linux') {
    // For Linux, ask for the distribution
    const { selectedDistro } = await inquirer.prompt<{
      selectedDistro: string
    }>([
      {
        type: 'list',
        name: 'selectedDistro',
        message: 'Which Linux distribution is this?',
        choices: [
          new inquirer.Separator('=== Common Distributions ==='),
          ...COMMON_DISTRIBUTIONS,
          new inquirer.Separator('\n=== All Distributions ==='),
          ...ALL_LINUX_DISTRIBUTIONS.filter(
            (d) => !COMMON_DISTRIBUTIONS.find((c) => c.value === d.value),
          ),
        ],
      },
    ])
    distro = selectedDistro
  } else {
    // Shouldn't reach here since we check for supported OS earlier
    distro = 'unknown'
  }

  // Ask for machine nickname
  const { machineNickname } = await inquirer.prompt<{
    machineNickname: string
  }>([
    {
      type: 'input',
      name: 'machineNickname',
      message: 'Enter a nickname for this machine:',
      prefix: chalk.gray(
        `\nExamples: 'macbook-air', 'thinkpad', 'aws-linux', 'raspberry-pi'\n` +
          `This will create a directory: ${currentOS.toLowerCase()}-${distro}-<nickname>\n`,
      ),
      validate: (input) => {
        if (!input.trim()) return 'Nickname is required'
        if (!/^[a-zA-Z0-9._-]+$/.test(input)) {
          return 'Nickname can only contain letters, numbers, dots, hyphens, and underscores'
        }
        return true
      },
    },
  ])

  return {
    isFirstTime,
    distro,
    nickname: machineNickname.trim(),
  }
}

/**
 * Prompt for clone/repo location
 *
 * Asks user where their dotfiles repository is located (if existing)
 * or where it should be created (if new). Validates the path and
 * ensures it's a git repository if it should already exist.
 * If it's an existing repo, prompts for branch selection and ensures
 * the branch is checked out and up to date.
 *
 * @param repoExists - Whether the repository already exists
 * @param repoName - Name of the repository
 * @param showBack - Whether to show back navigation option
 * @returns Absolute path to repository location or BACK_OPTION
 */
async function promptCloneLocation(
  repoExists: boolean,
  repoName: string,
  showBack = true,
): Promise<string | typeof BACK_OPTION> {
  const message = repoExists
    ? `Where is your ${repoName} repository located?`
    : `Where should we create the ${repoName} repository?`

  const helpText = repoExists
    ? chalk.gray('  (e.g., ~/dev/dotfiles, ~/dotfiles, etc.)\n')
    : chalk.gray(
        '  This is where the repository will be cloned/created\n  (e.g., ~/, ~/dev, etc.)\n',
      )

  console.log(helpText)

  while (true) {
    const { location } = await inquirer.prompt<{ location: string }>([
      {
        type: 'input',
        name: 'location',
        message,
        default: repoExists ? `~/dev/${repoName}` : DEFAULT_CLONE_LOCATION,
        validate: (input) => {
          if (!input.trim()) return 'Location is required'

          // Use validatePath utility for consistent validation
          if (repoExists) {
            const result = validatePath(input.trim(), {
              mustExist: true,
              mustBeDirectory: true,
              mustBeGitRepo: true,
            })

            // Return error message if validation failed
            if (result !== true) {
              return result
            }
          }

          return true
        },
        transformer: (input) => {
          // Show the expanded path
          return expandTilde(input)
        },
      },
    ])

    // Expand path using utility
    const expandedLocation = expandTilde(location.trim())

    // Offer confirmation with back option
    if (showBack) {
      const { confirm } = await inquirer.prompt<{ confirm: string }>([
        {
          type: 'list',
          name: 'confirm',
          message: `Use this location: ${expandedLocation}?`,
          choices: [
            { name: 'Yes, use this location', value: 'yes' },
            { name: 'No, enter a different path', value: 'retry' },
            new inquirer.Separator(),
            { name: '← Go back', value: 'back' },
          ],
        },
      ])

      if (confirm === 'back') return BACK_OPTION
      if (confirm === 'retry') continue
    }

    // If repo exists, handle branch selection and checkout
    if (repoExists && isGitRepository(expandedLocation)) {
      try {
        // Get current branch
        const currentBranch = await getCurrentBranch(expandedLocation)
        console.log(chalk.gray(`\n  Current branch: ${currentBranch}\n`))

        // Get all branches
        const branches = await getAllBranches(expandedLocation)
        const allBranches = Array.from(
          new Set([...branches.local, ...branches.remote]),
        )

        if (allBranches.length === 0) {
          console.log(
            chalk.yellow('⚠️  No branches found. Using current branch.\n'),
          )
          return expandedLocation
        }

        // Prompt for branch selection
        const { selectedBranch } = await inquirer.prompt<{
          selectedBranch: string
        }>([
          {
            type: 'list',
            name: 'selectedBranch',
            message: 'Which branch would you like to use?',
            choices: allBranches,
            default: currentBranch || 'main',
          },
        ])

        // Checkout branch if different from current
        if (selectedBranch !== currentBranch) {
          console.log(
            chalk.cyan(`\n🔄 Checking out branch: ${selectedBranch}...\n`),
          )

          const checkoutResult = await checkoutBranch(
            expandedLocation,
            selectedBranch,
          )

          if (!checkoutResult.success) {
            console.log(
              chalk.red(
                `❌ Failed to checkout branch: ${checkoutResult.error}\n`,
              ),
            )
            console.log(
              chalk.yellow(
                'Please manually checkout the branch and try again.\n',
              ),
            )
            continue
          }

          console.log(chalk.green(`✅ Checked out branch: ${selectedBranch}\n`))
        }

        // Pull latest changes
        console.log(chalk.cyan('🔄 Pulling latest changes...\n'))
        const pullResult = await pullFromRemote(expandedLocation, {
          branch: selectedBranch,
        })

        if (!pullResult.success) {
          console.log(
            chalk.yellow(
              `⚠️  Warning: Could not pull latest changes: ${pullResult.error}\n`,
            ),
          )
          console.log(
            chalk.gray('Continuing with local version of the repository.\n'),
          )
        } else {
          console.log(chalk.green('✅ Repository is up to date\n'))
        }
      } catch (error: any) {
        console.log(
          chalk.yellow(
            `⚠️  Warning: Could not check git status: ${error.message}\n`,
          ),
        )
        console.log(chalk.gray('Continuing with repository as-is.\n'))
      }
    }

    return expandedLocation
  }
}

/**
 * Prompt for file selection - which config files to back up
 */
async function promptFileSelection(
  osType: OperatingSystem,
  stepNumber = 6,
): Promise<TrackedFile[] | typeof BACK_OPTION> {
  displayStepProgress(stepNumber, 9, 'Select Files to Backup')
  console.log(
    chalk.gray('\n  Choose which configuration files you want to back up\n'),
  )

  // Discover existing files
  // Map setup OS type to backup-config OS type
  const backupOsType: import('../types/backup-config').OperatingSystem =
    osType === 'macOS' ? 'macos' : osType === 'linux' ? 'linux' : 'windows'
  const existingFiles = getExistingFiles(backupOsType)

  if (existingFiles.length === 0) {
    console.log(
      chalk.yellow(
        '⚠️  No common config files found in your home directory.\n',
      ),
    )
    const { proceed } = await inquirer.prompt<{ proceed: string }>([
      {
        type: 'list',
        name: 'proceed',
        message: 'Would you like to manually add files?',
        choices: [
          { name: 'Yes, add files manually', value: 'yes' },
          { name: 'No, skip file selection', value: 'no' },
          new inquirer.Separator(),
          { name: '← Go back', value: 'back' },
        ],
      },
    ])

    if (proceed === 'back') return BACK_OPTION
    if (proceed === 'no') return []

    return await promptManualFileAddition([])
  }

  // Filter out secret files - they should be handled through secret management
  const filteredFiles = existingFiles.filter(
    (file) => file.category !== 'secrets',
  )

  // Group files by category
  const grouped = groupFilesByCategory(filteredFiles)

  // Show info about secret files if any were found
  const secretFiles = existingFiles.filter(
    (file) => file.category === 'secrets',
  )
  if (secretFiles.length > 0) {
    console.log(
      chalk.yellow(
        `ℹ️  Found ${secretFiles.length} secret file(s) that will be handled separately:`,
      ),
    )
    secretFiles.forEach((file) => {
      console.log(chalk.gray(`   - ${file.relativePath}`))
    })
    console.log(
      chalk.gray(
        '   (Configure these through the Secret Management section)\n',
      ),
    )
  }

  // Create choices for multi-select
  const choices: any[] = []

  // Add files grouped by category
  Array.from(grouped.entries()).forEach(([category, files]) => {
    choices.push(
      new inquirer.Separator(`\n=== ${getCategoryDisplayName(category)} ===`),
    )

    files.forEach((file) => {
      const displayName = formatFileForDisplay(file)

      // Warn about SSH directory - only config file, not keys
      if (file.path.includes('.ssh') && file.isDirectory) {
        choices.push({
          name: `${displayName} [⚠️  WARNING: Will only backup config file, NOT private keys]`,
          value: file,
          checked: false,
        })
      } else {
        choices.push({
          name: displayName,
          value: file,
          checked: true, // Auto-select safe files
        })
      }
    })
  })

  try {
    console.log(chalk.gray('  (use space to select, enter to confirm)\n'))

    const { selectedFiles } = await inquirer.prompt<{
      selectedFiles: DiscoveredFile[]
    }>([
      {
        type: 'checkbox',
        name: 'selectedFiles',
        message: 'Select files to back up',
        choices,
        pageSize: 15,
        validate: (input) => {
          if (input.length === 0) {
            return 'Please select at least one file to continue (you can add more files manually in the next step)'
          }
          return true
        },
      },
    ])

    // Display selected files in a clean format
    console.log(chalk.cyan(`\n📋 Selected ${selectedFiles.length} file(s):`))
    selectedFiles.forEach((file) => {
      console.log(chalk.gray(`  • ${file.name}`))
    })
    console.log()

    // Ask if they want to add more files manually
    const { addMore } = await inquirer.prompt<{ addMore: string }>([
      {
        type: 'list',
        name: 'addMore',
        message: 'Add more files manually?',
        choices: [
          {
            name: 'No, continue with the currently selected files only',
            value: 'no',
          },
          { name: 'Yes, add more files manually', value: 'yes' },
        ],
      },
    ])

    // Convert discovered files to TrackedFile format
    let trackedFiles: TrackedFile[] = selectedFiles.map((file) => {
      // Preserve directory structure from home directory
      // For ~/.ssh/config -> .ssh/config
      // For ~/.zshrc -> .zshrc
      const homeRelativePath = file.relativePath.startsWith('~/')
        ? file.relativePath.slice(2) // Remove '~/'
        : path.basename(file.path)

      return {
        name: homeRelativePath,
        sourcePath: file.relativePath,
        repoPath: '', // Will be set later based on OS/distro
        symlinkEnabled: !file.isDirectory,
        tracked: file.category !== 'secrets', // Don't track secret files in git
      }
    })

    if (addMore === 'yes') {
      const result = await promptManualFileAddition(trackedFiles)
      if (result === BACK_OPTION) return BACK_OPTION
      trackedFiles = result
    }

    return trackedFiles
  } catch (error: any) {
    if (
      error?.name === 'ExitPromptError' ||
      error?.message?.includes('force closed')
    ) {
      console.log(chalk.yellow('\n\n⚠️  File selection cancelled.\n'))
      process.exit(0)
    }
    throw error
  }
}

/**
 * Prompt for manually adding files
 *
 * Allows users to manually specify files/directories to back up that
 * weren't discovered automatically. Validates paths and asks whether
 * they should be tracked in git or kept as secrets.
 *
 * @param existingFiles - Files already selected for backup
 * @returns Updated list of files or BACK_OPTION
 */
async function promptManualFileAddition(
  existingFiles: TrackedFile[],
): Promise<TrackedFile[] | typeof BACK_OPTION> {
  const files = [...existingFiles]

  while (true) {
    console.log(
      chalk.cyan(
        `\n📝 Manual File Addition (${files.length} file(s) selected)\n`,
      ),
    )

    const { filePath } = await inquirer.prompt<{ filePath: string }>([
      {
        type: 'input',
        name: 'filePath',
        message: 'Enter file path (or leave empty to finish):',
        validate: (input) => {
          if (!input.trim()) return true // Allow empty to finish

          // Use validatePath utility
          const result = validatePath(input.trim(), {
            mustExist: true,
          })

          return result === true ? true : result
        },
      },
    ])

    if (!filePath.trim()) {
      // Done adding files
      break
    }

    // Expand path using utility
    const expandedPath = expandTilde(filePath.trim())

    // Get relative path using utility
    const relativePath = `~${expandedPath.slice(expandTilde('~').length)}`

    // Check if it's a directory
    const stats = fs.statSync(expandedPath)
    const isDirectory = stats.isDirectory()

    // Ask if it should be tracked in git
    const { tracked } = await inquirer.prompt<{ tracked: string }>([
      {
        type: 'list',
        name: 'tracked',
        message: `Should this ${isDirectory ? 'directory' : 'file'} be tracked in git?`,
        choices: [
          { name: 'Yes, track in git', value: 'yes' },
          { name: 'No, keep as untracked secret', value: 'no' },
        ],
      },
    ])

    // Preserve directory structure from home directory
    // Remove '~/' to get .ssh/config instead of just config
    const homeRelativePath = relativePath.startsWith('~/')
      ? relativePath.slice(2)
      : path.basename(expandedPath)

    files.push({
      name: homeRelativePath,
      sourcePath: relativePath,
      repoPath: '', // Will be set later based on OS/distro
      symlinkEnabled: !isDirectory,
      tracked: tracked === 'yes',
    })

    console.log(chalk.green(`✅ Added: ${relativePath}\n`))
  }

  return files
}

/**
 * Prompt for secret storage preferences
 */
async function promptSecretStorage(
  showBack = false,
  stepNumber = 4,
  shell?: string,
): Promise<SetupConfig['secrets'] | typeof BACK_OPTION> {
  displayStepProgress(stepNumber, 9, 'Secret Management')
  console.log(
    chalk.dim('\n  Secrets: environment variables, API keys, SSH keys, etc.\n'),
  )

  // State machine for navigation within secrets section
  type SecretStep = 'manage' | 'backup' | 'category'
  let currentStep: SecretStep = 'manage'
  let manageSecrets = ''
  let currentlyBackingUp = ''
  let storageCategory = ''

  while (true) {
    if (currentStep === 'manage') {
      const secretChoices: any[] = [
        {
          name: 'Yes, I want to set up or configure secret management',
          value: 'yes',
        },
        { name: 'No, skip secret management', value: 'no' },
      ]

      if (showBack) {
        secretChoices.push(new inquirer.Separator())
        secretChoices.push({ name: '← Go back', value: 'back' })
      }

      console.log(
        chalk.gray(
          '  This includes local file(s) used for system environment variables\n',
        ),
      )

      const result = await inquirer.prompt<{ manageSecrets: string }>([
        {
          type: 'list',
          name: 'manageSecrets',
          message:
            'Do you currently have secret management or wish to set up secret management?',
          choices: secretChoices,
        },
      ])

      console.log('') // Add spacing after answer
      manageSecrets = result.manageSecrets

      if (manageSecrets === 'back') {
        return BACK_OPTION
      }

      if (manageSecrets === 'no') {
        return {
          enabled: false,
        }
      }

      currentStep = 'backup'
    } else if (currentStep === 'backup') {
      const backupChoices: any[] = [
        { name: 'Yes', value: 'yes' },
        { name: 'No', value: 'no' },
      ]

      if (showBack) {
        backupChoices.push(new inquirer.Separator())
        backupChoices.push({ name: '← Go back', value: 'back' })
      }

      const result = await inquirer.prompt<{
        currentlyBackingUp: string
      }>([
        {
          type: 'list',
          name: 'currentlyBackingUp',
          message:
            'Do you already use a local file and/or a cloud service for managing your secrets?',
          choices: backupChoices,
        },
      ])

      console.log('') // Add spacing after answer
      currentlyBackingUp = result.currentlyBackingUp

      if (currentlyBackingUp === 'back') {
        currentStep = 'manage'
        continue
      }

      currentStep = 'category'
    } else if (currentStep === 'category') {
      // Show available options
      const storageCategoryChoices: any[] = [
        new inquirer.Separator(chalk.cyan('── Local Storage ──')),
        { name: 'Local file (.env, .env.sh, etc.)', value: 'local-file' },

        new inquirer.Separator(chalk.cyan('\n── Version Control (Remote) ──')),
        { name: 'Git Repository (encrypted)', value: 'git-remote' },

        new inquirer.Separator(chalk.cyan('\n── Version Control (Local) ──')),
        { name: 'Local Git Repository (encrypted)', value: 'git-local' },

        new inquirer.Separator(chalk.cyan('\n── Platform/Edge Providers ──')),
        { name: 'Vercel / Cloudflare / Netlify', value: 'platform' },

        new inquirer.Separator(chalk.cyan('\n── Cloud Secret Managers ──')),
        { name: 'AWS / GCP / Azure Secret Manager', value: 'cloud' },

        new inquirer.Separator(chalk.cyan('\n── Third-Party Vaults ──')),
        { name: 'HashiCorp Vault / Doppler / Others', value: 'vault' },

        new inquirer.Separator(chalk.cyan('\n── OS-Level Storage ──')),
        { name: 'macOS Keychain / Linux Secret Service', value: 'os-storage' },

        new inquirer.Separator(chalk.cyan('\n── Password Manager ──')),
        {
          name: '1Password / LastPass / Dashlane (manual)',
          value: 'password-manager',
        },

        new inquirer.Separator(chalk.cyan('\n── No Secret Management ──')),
        { name: 'Skip secret management', value: 'none' },
      ]

      if (showBack) {
        storageCategoryChoices.push(new inquirer.Separator())
        storageCategoryChoices.push({ name: '← Go back', value: 'back' })
      }

      const result = await inquirer.prompt<{
        storageCategory: string
      }>([
        {
          type: 'list',
          name: 'storageCategory',
          message:
            currentlyBackingUp === 'yes'
              ? 'Which approach do you currently use to manage secrets?'
              : 'Which approach would you like to use to manage secrets?',
          choices: storageCategoryChoices,
        },
      ])

      console.log('') // Add spacing after answer
      storageCategory = result.storageCategory

      if (storageCategory === 'back') {
        // Go back to the backup question within the secrets flow
        currentStep = 'backup'
        continue
      }

      if (storageCategory === 'none') {
        return {
          enabled: false,
        }
      }

      // Break out of navigation loop to handle category-specific logic
      break
    }
  }

  // Get specific details based on category
  const details: SetupConfig['secrets']['details'] = {}

  if (storageCategory === 'local-file') {
    const { localType } = await inquirer.prompt<{ localType: string }>([
      {
        type: 'list',
        name: 'localType',
        message: 'Select local file type:',
        choices: [
          'Shell script with exports (e.g., .env.sh - export KEY="VALUE" per line) [recommended]',
          'Plaintext (e.g., .env - KEY=VALUE format per line)',
          'PGP-encrypted file',
        ],
      },
    ])
    details.localType = localType

    // Ask for the filename
    const { secretFileName } = await inquirer.prompt<{
      secretFileName: string
    }>([
      {
        type: 'input',
        name: 'secretFileName',
        message: 'What is the name of your secret file?',
        default: localType.includes('.env.sh') ? '.env.sh' : '.env',
        validate: (input) => {
          if (!input.trim()) return 'Filename is required'
          if (!input.startsWith('.'))
            return 'Secret files should start with a dot (e.g., .env.sh)'
          return true
        },
      },
    ])
    details.secretFileName = secretFileName

    // Ask for the location
    const { secretFileLocation } = await inquirer.prompt<{
      secretFileLocation: string
    }>([
      {
        type: 'input',
        name: 'secretFileLocation',
        message: 'Where is this file located?',
        default: '~',
        transformer: (input) => {
          // Show the expanded path using utility
          return expandTilde(input)
        },
      },
    ])
    details.secretFileLocation = secretFileLocation

    // Check if the file exists using path utilities
    const fullPath = path.join(expandTilde(secretFileLocation), secretFileName)
    const fileExists = pathExists(fullPath)

    if (fileExists) {
      console.log(chalk.green(`\n✅ Found existing file at ${fullPath}\n`))
      details.secretFileExists = 'yes'
    } else {
      console.log(chalk.yellow(`\n⚠️  File not found at ${fullPath}\n`))

      const { fileAction } = await inquirer.prompt<{ fileAction: string }>([
        {
          type: 'list',
          name: 'fileAction',
          message: 'What would you like to do?',
          choices: [
            { name: 'Create this file now', value: 'create' },
            { name: 'Select a different file', value: 'select-different' },
            { name: "I'll create it manually later", value: 'manual' },
          ],
        },
      ])

      if (fileAction === 'select-different') {
        // Recursively prompt for a different file by returning to the local file type prompt
        return await promptSecretStorage(showBack, stepNumber, shell)
      }

      details.secretFileExists = 'no'
      details.createSecretFile = fileAction === 'create' ? 'yes' : 'no'

      if (fileAction === 'create') {
        try {
          // Create the directory if it doesn't exist
          const dir = path.dirname(fullPath)
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
          }

          // Create the file with secure permissions
          fs.writeFileSync(
            fullPath,
            '# Secret environment variables\n# Add your secrets below\n\n',
            { mode: 0o600 },
          )
          console.log(
            chalk.green(
              `✅ Created ${fullPath} with secure permissions (0600)\n`,
            ),
          )
          details.secretFileExists = 'yes'
        } catch (error: any) {
          console.log(chalk.red(`❌ Failed to create file: ${error.message}\n`))
          console.log(chalk.gray('You can create it manually later.\n'))
        }
      }
    }

    // Configure shell RC file to source the secret file
    if (shell && details.secretFileExists === 'yes' && secretFileName) {
      const secretFilePath = path.join(secretFileLocation, secretFileName)

      // Check if the secret file uses export syntax
      console.log(chalk.cyan('\n🔍 Checking secret file format...\n'))
      const parsed = parseEnvFile(secretFilePath)

      // If the file doesn't use exports and isn't already a .sh file, offer to convert
      if (!parsed.hasExports && !secretFileName.endsWith('.sh')) {
        console.log(
          chalk.yellow(
            `⚠️  Your secret file (${secretFileName}) doesn't use 'export' syntax.\n`,
          ),
        )
        console.log(
          chalk.gray(
            '   For shell sourcing to work, variables need to be exported.\n',
          ),
        )

        const { convertFile } = await inquirer.prompt<{ convertFile: string }>([
          {
            type: 'list',
            name: 'convertFile',
            message:
              'Would you like to create a .env.sh file with proper exports?',
            choices: [
              { name: 'Yes, create .env.sh with exports', value: 'yes' },
              { name: 'No, I will handle this manually', value: 'no' },
            ],
          },
        ])

        if (convertFile === 'yes') {
          const envShPath = path.join(secretFileLocation, '.env.sh')
          const convertResult = convertEnvToEnvSh(secretFilePath, envShPath)

          if (convertResult.success) {
            console.log(
              chalk.green(
                `\n✅ Created ${envShPath} with proper export syntax\n`,
              ),
            )
            // Update the secret file name to the new .env.sh file
            details.secretFileName = '.env.sh'
          } else {
            console.log(
              chalk.red(
                `\n❌ Failed to create .env.sh: ${convertResult.error}\n`,
              ),
            )
          }
        }
      }

      // Now configure the shell RC file
      const finalSecretFile = details.secretFileName || secretFileName
      const finalSecretPath = path.join(secretFileLocation, finalSecretFile)

      console.log(
        chalk.cyan(
          `\n🔧 Configuring ${shell} to source ${finalSecretPath}...\n`,
        ),
      )

      // Check if already configured
      if (checkRCFileSourcesSecret(shell, finalSecretPath)) {
        console.log(
          chalk.green(
            `✅ Your .${shell}rc already sources ${finalSecretPath}\n`,
          ),
        )
      } else {
        const { addSource } = await inquirer.prompt<{ addSource: string }>([
          {
            type: 'list',
            name: 'addSource',
            message: `Add source command to .${shell}rc?`,
            choices: [
              { name: 'Yes, configure automatically', value: 'yes' },
              { name: 'No, I will configure manually', value: 'no' },
            ],
          },
        ])

        if (addSource === 'yes') {
          const addResult = addSecretSourceToRC(shell, finalSecretPath)

          if (addResult.success) {
            console.log(
              chalk.green(`\n✅ Added source command to .${shell}rc\n`),
            )
            console.log(
              chalk.gray(
                `   Restart your shell or run: source ~/.${shell}rc\n`,
              ),
            )
          } else {
            console.log(
              chalk.red(
                `\n❌ Failed to update .${shell}rc: ${addResult.error}\n`,
              ),
            )
            console.log(
              chalk.gray(`   You can manually add this to your .${shell}rc:\n`),
            )
            console.log(
              chalk.gray(
                `   if [ -f ${finalSecretPath} ]; then source ${finalSecretPath}; fi\n`,
              ),
            )
          }
        }
      }
    }
  }

  if (storageCategory === 'git-remote' || storageCategory === 'git-local') {
    const { encryption } = await inquirer.prompt<{ encryption: string }>([
      {
        type: 'list',
        name: 'encryption',
        message: 'Select encryption method:',
        choices: [
          'PGP-encrypted',
          'Age-encrypted',
          'Plaintext (private repo - not recommended)',
        ],
      },
    ])
    details.gitEncryption = encryption
  }

  if (storageCategory === 'platform') {
    const { platformService } = await inquirer.prompt<{
      platformService: string
    }>([
      {
        type: 'list',
        name: 'platformService',
        message: 'Select platform service:',
        choices: [
          'Vercel Environment Variables',
          'Cloudflare Workers Secrets',
          'Netlify Environment Variables',
        ],
      },
    ])
    details.platformService = platformService
  }

  if (storageCategory === 'cloud') {
    const { cloudService } = await inquirer.prompt<{ cloudService: string }>([
      {
        type: 'list',
        name: 'cloudService',
        message: 'Select cloud service:',
        choices: [
          'AWS Secrets Manager',
          'AWS Systems Manager Parameter Store',
          'Google Cloud Secret Manager',
          'Azure Key Vault',
        ],
      },
    ])
    details.cloudService = cloudService
  }

  if (storageCategory === 'vault') {
    const { vaultService } = await inquirer.prompt<{ vaultService: string }>([
      {
        type: 'list',
        name: 'vaultService',
        message: 'Select vault service:',
        choices: ['HashiCorp Vault', 'Doppler', 'Akeyless', 'Infisical'],
      },
    ])
    details.cloudService = vaultService
  }

  return {
    enabled: true,
    storageType: storageCategory as SecretStorageCategory,
    details,
  }
}

/**
 * Display configuration summary
 *
 * Shows a formatted summary of the user's configuration choices
 * before they confirm and save.
 *
 * @param config - Setup configuration to summarize
 * @param stepNumber - Current step number for progress display
 */
function displaySummary(config: SetupConfig, stepNumber = 5) {
  displayStepProgress(stepNumber, 9, 'Configuration Summary')
  console.log()

  // Operating System
  displaySummarySection('Operating System', {
    OS: config.os,
    Shell: config.shell || 'Not specified',
  })

  // Config File Storage
  if (config.configFiles.versionControl) {
    displaySummarySection('Config File Storage', {
      Service: config.configFiles.service,
      Repository: config.configFiles.gitRepoUrl,
      'Clone Location': config.configFiles.cloneLocation,
      'Multi-OS Support': config.configFiles.multiOS ? 'Yes' : 'No',
    })
  } else {
    displaySummarySection('Config File Storage', {
      'Version Control': 'Not using version control',
    })
  }

  // Secret Management
  if (config.secrets.enabled && config.secrets.storageType) {
    const secretDetails: Record<string, string | undefined> = {
      Type: config.secrets.storageType,
    }

    if (config.secrets.details) {
      Object.entries(config.secrets.details).forEach(([key, value]) => {
        if (value) {
          secretDetails[key] = String(value)
        }
      })
    }

    displaySummarySection('Secret Management', secretDetails)
  } else {
    displaySummarySection('Secret Management', {
      Enabled: 'Not managing secrets',
    })
  }
}

/**
 * Prompt user for package, extension, and runtime detection
 */
async function promptSystemDetection(
  os: OperatingSystem,
  machineId: string,
  stepNumber = 6,
): Promise<
  | {
      packages: PackageManager[]
      extensions: EditorExtensions[]
      runtimes: RuntimeVersion[]
    }
  | typeof BACK_OPTION
> {
  displayStepProgress(stepNumber, 9, 'Detect Packages, Extensions & Runtimes')

  console.log('')
  console.log(
    chalk.gray(
      'This step will detect and track:\n' +
        '  • Package managers and installed packages (Homebrew, apt, npm, etc.)\n' +
        '  • Editor extensions (VS Code, Cursor, Windsurf, Vim, etc.)\n' +
        '  • Runtime versions (Node.js, Python, Ruby, etc.)\n',
    ),
  )

  const { enableDetection } = await inquirer.prompt<{
    enableDetection: string
  }>([
    {
      type: 'list',
      name: 'enableDetection',
      message:
        'Do you want to detect and track system packages and configurations?',
      choices: [
        {
          name: 'Yes, detect packages, extensions, and runtimes',
          value: 'yes',
        },
        { name: 'No, skip detection (only backup dotfiles)', value: 'no' },
        new inquirer.Separator(),
        { name: '← Go back', value: 'back' },
      ],
    },
  ])

  if (enableDetection === 'back') return BACK_OPTION

  if (enableDetection === 'no') {
    console.log(
      chalk.yellow(
        '\n⚠️  Skipping system detection. Only dotfiles will be tracked.\n',
      ),
    )
    return { packages: [], extensions: [], runtimes: [] }
  }

  console.log('')
  console.log(
    chalk.cyan('🔍 Detecting system packages and configurations...\n'),
  )

  const backupOsType: BackupOS = os === 'macOS' ? 'macos' : 'linux'

  // Detect package managers
  console.log(chalk.gray('  Detecting package managers...'))
  const packageManagers: PackageManager[] = []
  try {
    const availableManagers = await detectPackageManagers(backupOsType)
    console.log(
      chalk.green(`    ✓ Found ${availableManagers.length} package manager(s)`),
    )

    // Ask which package managers to track
    if (availableManagers.length > 0) {
      const { selectedManagers } = await inquirer.prompt<{
        selectedManagers: string[]
      }>([
        {
          type: 'checkbox',
          name: 'selectedManagers',
          message: 'Select package managers to track:',
          choices: availableManagers.map((pm) => ({
            name: pm,
            value: pm,
            checked: true,
          })),
        },
      ])

      // Get packages for selected managers
      for (const manager of selectedManagers) {
        console.log(chalk.gray(`    Getting packages for ${manager}...`))
        try {
          const pm = await createPackageManager(manager as any)
          packageManagers.push(pm)
          console.log(
            chalk.green(`      ✓ Found ${pm.packages.length} package(s)`),
          )
        } catch (error) {
          console.log(
            chalk.yellow(`      ⚠️  Could not get packages for ${manager}`),
          )
        }
      }
    }
  } catch (error) {
    console.log(chalk.yellow('    ⚠️  Error detecting package managers'))
  }

  console.log('')

  // Detect editors and extensions
  console.log(chalk.gray('  Detecting editors and extensions...'))
  const editorExtensions: EditorExtensions[] = []
  try {
    const installedEditors = await detectInstalledEditors(backupOsType)
    console.log(chalk.green(`    ✓ Found ${installedEditors.length} editor(s)`))

    if (installedEditors.length > 0) {
      const { selectedEditors } = await inquirer.prompt<{
        selectedEditors: string[]
      }>([
        {
          type: 'checkbox',
          name: 'selectedEditors',
          message: 'Select editors to track extensions for:',
          choices: installedEditors.map((editor) => ({
            name: editor,
            value: editor,
            checked: true,
          })),
        },
      ])

      // Get extensions for selected editors
      for (const editor of selectedEditors) {
        console.log(chalk.gray(`    Getting extensions for ${editor}...`))
        try {
          const ext = await createEditorExtensions(
            editor as any,
            backupOsType,
            machineId,
          )
          editorExtensions.push(ext)
          console.log(
            chalk.green(`      ✓ Found ${ext.extensions.length} extension(s)`),
          )
        } catch (error) {
          console.log(
            chalk.yellow(`      ⚠️  Could not get extensions for ${editor}`),
          )
        }
      }
    }
  } catch (error) {
    console.log(chalk.yellow('    ⚠️  Error detecting editors'))
  }

  console.log('')

  // Detect runtimes
  console.log(chalk.gray('  Detecting runtime versions...'))
  const runtimes: RuntimeVersion[] = []
  try {
    // First, try to detect Node manager from shell RC files
    const shellDetectedManager = await detectNodeManagerFromShell()

    // Check for multiple Node.js managers and prompt user to choose
    const availableNodeManagers = await detectAvailableNodeManagers()
    let selectedNodeManager: string | undefined

    if (availableNodeManagers.length > 1) {
      // Determine default based on shell RC detection
      const defaultManager =
        shellDetectedManager &&
        availableNodeManagers.includes(shellDetectedManager)
          ? shellDetectedManager
          : availableNodeManagers[0]

      console.log(
        chalk.yellow(
          `\n    ℹ Multiple Node.js version managers detected: ${availableNodeManagers.join(', ')}`,
        ),
      )

      if (
        shellDetectedManager &&
        availableNodeManagers.includes(shellDetectedManager)
      ) {
        console.log(
          chalk.gray(
            `    Shell config indicates: ${shellDetectedManager} (from .zshrc/.bashrc)`,
          ),
        )
      }

      const { manager } = await inquirer.prompt([
        {
          type: 'list',
          name: 'manager',
          message: 'Which Node.js version manager do you use?',
          default: defaultManager,
          choices: availableNodeManagers.map((m) => ({
            name: m === 'system' ? 'System (no version manager)' : m,
            value: m,
          })),
        },
      ])

      selectedNodeManager = manager
    } else if (
      availableNodeManagers.length === 1 &&
      shellDetectedManager &&
      availableNodeManagers[0] !== shellDetectedManager
    ) {
      // Only one manager installed, but shell config mentions a different one
      console.log(
        chalk.yellow(
          `\n    ⚠️  Shell config references ${shellDetectedManager}, but only ${availableNodeManagers[0]} is installed`,
        ),
      )
      selectedNodeManager = availableNodeManagers[0]
    }

    // Detect all runtimes (Node.js with preferred manager if selected)
    const detectedRuntimes = await detectAllRuntimes()

    // Replace Node runtime with user-selected manager if applicable
    const nodeRuntimeIndex = detectedRuntimes.findIndex(
      (r) => r.type === 'node',
    )
    if (nodeRuntimeIndex !== -1 && selectedNodeManager) {
      const nodeRuntime = await detectNodeVersions(selectedNodeManager)
      if (nodeRuntime) {
        detectedRuntimes[nodeRuntimeIndex] = nodeRuntime
      }
    }

    console.log(
      chalk.green(`    ✓ Found ${detectedRuntimes.length} runtime(s)`),
    )

    for (const runtime of detectedRuntimes) {
      console.log(
        chalk.gray(
          `      ${runtime.type}: ${runtime.defaultVersion || 'N/A'}${runtime.manager ? ` (${runtime.manager})` : ''}`,
        ),
      )
      runtimes.push(runtime)
    }
  } catch (error) {
    console.log(chalk.yellow('    ⚠️  Error detecting runtimes'))
  }

  console.log('')
  console.log(
    chalk.green(
      `✓ Detection complete!\n` +
        `  • ${packageManagers.length} package manager(s)\n` +
        `  • ${editorExtensions.length} editor(s)\n` +
        `  • ${runtimes.length} runtime(s)\n`,
    ),
  )

  return { packages: packageManagers, extensions: editorExtensions, runtimes }
}

/**
 * Prompt user to confirm and execute file backup
 */
async function promptAndExecuteBackup(
  files: TrackedFile[],
  repoPath: string,
  machineId: string,
  backupConfig: BackupConfig,
  stepNumber = 7,
): Promise<boolean | typeof BACK_OPTION> {
  displayStepProgress(stepNumber, 9, 'Backup Files to Repository')

  if (files.length === 0) {
    console.log(
      chalk.yellow(
        '\n⚠️  No files selected for backup. Skipping backup step.\n',
      ),
    )
    return true
  }

  // Show preview of what will be backed up
  previewBackup(files, repoPath)

  const { confirmBackup } = await inquirer.prompt<{ confirmBackup: string }>([
    {
      type: 'list',
      name: 'confirmBackup',
      message: chalk.bold('Proceed with backing up these files?'),
      choices: [
        { name: 'Yes, backup these files now', value: 'yes' },
        { name: 'No, skip backup for now', value: 'no' },
        new inquirer.Separator(),
        { name: '← Go back', value: 'back' },
      ],
    },
  ])

  if (confirmBackup === 'back') return BACK_OPTION
  if (confirmBackup === 'no') {
    console.log(
      chalk.yellow(
        '\n⚠️  Backup skipped. You can run the backup manually later.\n',
      ),
    )
    return false
  }

  // Execute backup
  const backupResult = await backupFilesToRepo(files, repoPath, machineId, {
    verbose: true,
  })

  if (!backupResult.success) {
    console.log(
      chalk.red(
        '\n❌ Backup completed with errors. Please review and fix the issues.\n',
      ),
    )
    return false
  }

  if (backupResult.errors.length > 0) {
    console.log(chalk.yellow('\n⚠️  Some files failed to backup:'))
    backupResult.errors.forEach((err) => {
      console.log(chalk.yellow(`  - ${err.file}: ${err.error}`))
    })
    console.log()
  }

  // Export GNOME settings (Linux only)
  const currentSystem = backupConfig.systems.find(
    (s) => s.repoPath === machineId,
  )
  if (currentSystem?.os === 'linux') {
    const gnomeSettingsDir = path.join(repoPath, machineId, '.config', 'dconf')
    const dconfResult = await exportGnomeSettings(gnomeSettingsDir, {
      verbose: true,
    })

    if (dconfResult.success && dconfResult.exportedPaths.length > 0) {
      console.log(
        chalk.green(
          `✅ Exported ${dconfResult.exportedPaths.length} GNOME settings (including keybindings)\n`,
        ),
      )
    } else if (dconfResult.errors.length > 0) {
      console.log(chalk.yellow('⚠️  Some GNOME settings failed to export:'))
      dconfResult.errors.forEach((err) => {
        console.log(chalk.yellow(`  - ${err.path}: ${err.error}`))
      })
      console.log()
    }
  }

  // Export schema to repository
  console.log(chalk.cyan('\n📋 Saving backup configuration to repository...\n'))

  const schemaResult = await exportSchemaToRepo(backupConfig, repoPath, {
    verbose: true,
  })
  if (!schemaResult.success) {
    console.log(
      chalk.yellow(
        `⚠️  Warning: Failed to export schema: ${schemaResult.error}\n`,
      ),
    )
  }

  const readmeResult = await createSchemaReadme(repoPath, { verbose: true })
  if (!readmeResult.success) {
    console.log(
      chalk.yellow(
        `⚠️  Warning: Failed to create schema README: ${readmeResult.error}\n`,
      ),
    )
  }

  console.log(chalk.green('✅ Backup completed successfully!\n'))
  console.log(chalk.cyan('📂 Next steps:'))
  console.log(
    chalk.white('  1. Review the backed up files in: ') + chalk.gray(repoPath),
  )
  console.log(chalk.white('  2. Commit and push your changes to git'))
  console.log(
    chalk.white('  3. Run the symlink creation script (coming soon)\n'),
  )

  return true
}

/**
 * Save configuration to file
 */
async function saveConfiguration(config: SetupConfig) {
  const appConfig = getConfig()
  const configPath = appConfig.paths.backupConfig

  try {
    // Ensure directories exist
    ensureDirectories()

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    console.log(chalk.green(`✅ Configuration saved to ${configPath}\n`))
  } catch (error) {
    console.error(chalk.red('❌ Failed to save configuration:'), error)
    process.exit(1)
  }
}

/**
 * Prompt user to commit and push changes to the dotfiles repository
 *
 * Offers to commit and push changes to the remote repository.
 * Uses the git-operations utility for reliable git commands with retry logic.
 *
 * @param repoPath - Path to the dotfiles repository
 * @param stepNumber - Current step number for progress display
 */
async function promptGitCommitAndPush(
  repoPath: string,
  stepNumber = 8,
): Promise<void> {
  displayStepProgress(stepNumber, 9, 'Git Commit & Push')
  console.log()

  const { commitAndPush } = await inquirer.prompt<{ commitAndPush: string }>([
    {
      type: 'list',
      name: 'commitAndPush',
      message:
        'Would you like to commit and push the changes to your dotfiles repository?',
      choices: [
        { name: 'No, I will do it manually later', value: 'no' },
        { name: 'Yes, commit and push now', value: 'yes' },
      ],
    },
  ])

  if (commitAndPush === 'yes') {
    try {
      console.log(chalk.cyan('\n🔄 Committing and pushing changes...\n'))

      // Check git status using utility
      const status = await getGitStatus(repoPath)

      if (!status.hasChanges) {
        console.log(chalk.yellow('ℹ️  No changes to commit.\n'))
        return
      }

      // Stage all changes using utility
      await stageAllChanges(repoPath)
      console.log(chalk.green('✅ Staged all changes'))

      // Create commit using utility
      const commitMessage = `Update dotfiles configuration

🤖 Generated with dev-machine-backup-restore`

      const commitResult = await createGitCommit(repoPath, commitMessage, {
        coAuthors: ['dev-machine-backup-restore <noreply@github.com>'],
      })

      if (!commitResult.success) {
        throw new Error(commitResult.error || 'Failed to create commit')
      }

      console.log(chalk.green('✅ Created commit'))

      // Push to remote using utility with retry logic
      const pushResult = await pushToRemote(repoPath, { verbose: true })

      if (!pushResult.success) {
        throw new Error(pushResult.error || 'Failed to push to remote')
      }

      console.log(chalk.green('✅ Pushed to remote\n'))
      console.log(
        chalk.green('🎉 Changes successfully committed and pushed!\n'),
      )
    } catch (error: any) {
      displayError('Failed to commit/push', error.message)
      console.log(chalk.yellow('You can commit and push manually:'))
      console.log(chalk.gray(`  cd ${repoPath}`))
      console.log(chalk.gray('  git add .'))
      console.log(chalk.gray('  git commit -m "Update dotfiles"'))
      console.log(chalk.gray('  git push\n'))
    }
  } else {
    console.log(
      chalk.cyan('\n📍 Repository location: ') + chalk.white(repoPath),
    )
    console.log(chalk.gray('\nYou can commit and push when ready:'))
    console.log(chalk.gray(`  cd ${repoPath}`))
    console.log(chalk.gray('  git add .'))
    console.log(chalk.gray('  git commit -m "Update dotfiles"'))
    console.log(chalk.gray('  git push'))
    console.log(chalk.gray('\n💡 Tip: You may change to another branch with:'))
    console.log(chalk.gray('  git switch -c <branch_name>\n'))
  }
}

/**
 * Prompt user to create symlinks for backed up files
 */
async function promptSymlinkCreation(
  files: TrackedFile[],
  repoPath: string,
  stepNumber = 9,
): Promise<void> {
  displayStepProgress(stepNumber, 9, 'Create Symlinks')
  console.log(
    chalk.gray(
      '\nSymlinks allow files to be stored in your dotfiles repository',
    ),
  )
  console.log(
    chalk.gray('while still being accessible from their expected locations.'),
  )
  console.log(chalk.gray('If you are unsure, select no.\n'))

  const { createSymlinks } = await inquirer.prompt<{ createSymlinks: string }>([
    {
      type: 'list',
      name: 'createSymlinks',
      message: 'Would you like to create symlinks for your backed up files?',
      choices: [
        { name: 'No, I will create them manually later', value: 'no' },
        { name: 'Yes, let me select which files to symlink', value: 'yes' },
      ],
    },
  ])

  if (createSymlinks === 'no') {
    console.log(chalk.cyan('\n📍 Skipping symlink creation.'))
    console.log(chalk.gray('\nYou can create symlinks manually later using:'))
    console.log(chalk.gray('  ln -sf <source> <target>\n'))
    console.log(chalk.gray('Example:'))
    console.log(chalk.gray(`  ln -sf ${repoPath}/macos/.zshrc ~/.zshrc\n`))
    return
  }

  // Filter out files where symlinkEnabled is false (directories)
  const symlinkableFiles = files.filter((f) => f.symlinkEnabled)

  if (symlinkableFiles.length === 0) {
    console.log(
      chalk.yellow(
        '\nℹ️  No files available for symlinking (only directories were backed up).\n',
      ),
    )
    return
  }

  // Prompt for each file individually
  console.log(chalk.cyan('\n📋 Select files to symlink:\n'))

  const selectedFiles: TrackedFile[] = []

  for (const file of symlinkableFiles) {
    const sourceInRepo = path.join(repoPath, file.repoPath)
    const targetLocation = file.sourcePath

    console.log(chalk.white(`\n${file.name}`))
    console.log(chalk.gray(`  Source: ${sourceInRepo}`))
    console.log(chalk.gray(`  Target: ${targetLocation}`))

    // Check if file already exists at target location
    const targetExists = fs.existsSync(expandTilde(targetLocation))
    const isSymlink =
      targetExists && fs.lstatSync(expandTilde(targetLocation)).isSymbolicLink()

    if (isSymlink) {
      const currentTarget = fs.readlinkSync(expandTilde(targetLocation))
      console.log(chalk.yellow(`  ⚠️  Already a symlink → ${currentTarget}`))
    } else if (targetExists) {
      console.log(
        chalk.yellow(
          `  ⚠️  File exists (will be backed up to ${targetLocation}.backup)`,
        ),
      )
    }

    const { createLink } = await inquirer.prompt<{ createLink: boolean }>([
      {
        type: 'confirm',
        name: 'createLink',
        message: 'Create symlink for this file?',
        default: !isSymlink, // Don't default to yes if already a symlink
      },
    ])

    if (createLink) {
      selectedFiles.push(file)
    }
  }

  if (selectedFiles.length === 0) {
    console.log(chalk.yellow('\n⚠️  No files selected for symlinking.\n'))
    return
  }

  // Create symlinks
  console.log(
    chalk.cyan(`\n🔗 Creating ${selectedFiles.length} symlink(s)...\n`),
  )

  let successCount = 0
  let errorCount = 0

  for (const file of selectedFiles) {
    try {
      const sourceInRepo = path.join(repoPath, file.repoPath)
      const targetLocation = expandTilde(file.sourcePath)

      // Backup existing file if it exists and is not a symlink
      if (fs.existsSync(targetLocation)) {
        const stats = fs.lstatSync(targetLocation)
        if (stats.isSymbolicLink()) {
          // Remove existing symlink
          fs.unlinkSync(targetLocation)
          console.log(chalk.gray(`  Removed existing symlink: ${file.name}`))
        } else {
          // Backup regular file
          const backupPath = `${targetLocation}.backup`
          fs.renameSync(targetLocation, backupPath)
          console.log(
            chalk.yellow(
              `  Backed up existing file: ${file.name} → ${backupPath}`,
            ),
          )
        }
      }

      // Create parent directory if it doesn't exist
      const targetDir = path.dirname(targetLocation)
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }

      // Create symlink
      fs.symlinkSync(sourceInRepo, targetLocation)
      console.log(chalk.green(`  ✅ Created symlink: ${file.name}`))
      successCount++
    } catch (error: any) {
      console.log(
        chalk.red(
          `  ❌ Failed to create symlink for ${file.name}: ${error.message}`,
        ),
      )
      errorCount++
    }
  }

  console.log(chalk.cyan('\n' + '─'.repeat(50)))
  console.log(
    chalk.green(`✅ Successfully created: ${successCount} symlink(s)`),
  )
  if (errorCount > 0) {
    console.log(chalk.red(`❌ Failed: ${errorCount} symlink(s)`))
  }
  console.log(chalk.cyan('─'.repeat(50) + '\n'))
}

/**
 * Display next steps
 *
 * Shows the user what to do next after completing setup.
 *
 * @param config - Setup configuration
 */
function displayNextSteps(config: SetupConfig) {
  const appConfig = getConfig()
  const configPath = appConfig.paths.backupConfig

  console.log(chalk.cyan.bold('NEXT STEPS:\n'))

  console.log(chalk.white(`1. Review your configuration in ${configPath}`))
  console.log(
    chalk.white('2. Re-run setup to update your backup when files change:'),
  )
  console.log(chalk.gray('   pnpm run setup\n'))

  if (config.configFiles.versionControl) {
    console.log(chalk.white('3. Your dotfiles are backed up to:'))
    console.log(chalk.gray(`   ${config.configFiles.gitRepoUrl}\n`))
  }

  if (config.secrets.enabled) {
    console.log(
      chalk.yellow('⚠️  Remember to configure your secret storage credentials'),
    )
    console.log(chalk.gray(`   Storage type: ${config.secrets.storageType}\n`))
  }

  console.log(chalk.cyan('='.repeat(20) + '\n'))
}

/**
 * Setup graceful exit handlers
 */
function setupExitHandlers() {
  const handleExit = () => {
    console.log(
      chalk.yellow(
        '\n\n⚠️  Setup interrupted. Run this script again to configure.\n',
      ),
    )
    process.exit(0)
  }

  // Note: inquirer v12 handles SIGINT internally, so we need to catch ExitPromptError
  // in the main function instead of using process-level handlers
  process.on('SIGTERM', handleExit)
}

/**
 * Handle inquirer exit errors gracefully
 */
function handleInquirerExit(error: any): never {
  // ExitPromptError is thrown when user presses Ctrl+C
  if (
    error?.name === 'ExitPromptError' ||
    error?.message?.includes('force closed')
  ) {
    console.log(
      chalk.yellow(
        '\n\n⚠️  Setup interrupted. Run this script again to configure.\n',
      ),
    )
    process.exit(0)
  }

  // Re-throw other errors
  throw error
}

/**
 * Main setup function with back button support
 *
 * Orchestrates the entire interactive setup wizard:
 * 1. OS Detection
 * 2. Config File Storage setup
 * 3. Secret Management configuration
 * 4. Configuration confirmation
 * 5. File selection
 * 6. Backup execution
 * 7. Git commit/push
 * 8. Symlink creation
 *
 * Supports back navigation throughout the flow for easy correction of choices.
 */
export default async function backup() {
  setupExitHandlers()

  // Display welcome banner using utility
  displayWelcome(
    'Dev Machine Backup & Restore - Interactive Backup',
    'This wizard will help you configure your backup preferences.\nYour responses will determine how your dotfiles and secrets are managed.',
  )

  const config: SetupConfig = {
    os: 'macOS' as OperatingSystem,
    configFiles: { versionControl: false, service: 'none' },
    secrets: { enabled: false },
  }

  // State machine for navigation
  type Step =
    | 'os'
    | 'shell'
    | 'config'
    | 'secrets'
    | 'confirm'
    | 'files'
    | 'detect'
    | 'backup'
  let currentStep: Step = 'os'
  const stepOrder: Step[] = [
    'os',
    'shell',
    'config',
    'secrets',
    'confirm',
    'files',
    'backup',
  ]

  // Track selected files for backup
  let selectedFiles: TrackedFile[] = []

  while (true) {
    try {
      if (currentStep === 'os') {
        const os = await promptOperatingSystem(true, 1)
        if (os === BACK_OPTION) {
          // Can't go back from first step
          continue
        }
        config.os = os as OperatingSystem
        currentStep = 'shell'
      } else if (currentStep === 'shell') {
        const shell = await promptShell(true, 2)
        if (shell === BACK_OPTION) {
          currentStep = 'os'
          continue
        }
        config.shell = shell as string
        currentStep = 'config'
      } else if (currentStep === 'config') {
        const configFiles = await promptConfigFileStorage(config.os, true, 3)
        if (configFiles === BACK_OPTION) {
          currentStep = 'shell'
          continue
        }
        config.configFiles = configFiles as SetupConfig['configFiles']
        currentStep = 'secrets'
      } else if (currentStep === 'secrets') {
        const secrets = await promptSecretStorage(true, 4, config.shell)
        if (secrets === BACK_OPTION) {
          currentStep = 'config'
          continue
        }
        config.secrets = secrets as SetupConfig['secrets']
        currentStep = 'confirm'
      } else if (currentStep === 'confirm') {
        displaySummary(config, 5)

        const { confirm } = await inquirer.prompt<{ confirm: string }>([
          {
            type: 'list',
            name: 'confirm',
            message: chalk.bold('Save this configuration?'),
            choices: [
              { name: 'Yes, save configuration', value: 'yes' },
              { name: 'No, cancel setup', value: 'no' },
              new inquirer.Separator(),
              { name: '← Go back', value: 'back' },
            ],
          },
        ])

        if (confirm === 'back') {
          currentStep = 'secrets'
          continue
        }

        if (confirm === 'no') {
          console.log(
            chalk.yellow(
              '\n⚠️  Setup cancelled. Run this script again to configure.\n',
            ),
          )
          process.exit(0)
        }

        // Confirmed, save configuration
        await saveConfiguration(config)

        // Move to file selection if using version control
        if (
          config.configFiles.versionControl &&
          config.configFiles.cloneLocation
        ) {
          currentStep = 'files'
        } else {
          // No version control, finish setup
          displayNextSteps(config)
          break
        }
      } else if (currentStep === 'files') {
        // Check if they have an existing repo with files
        if (config.configFiles.repoExists) {
          const { backupAction } = await inquirer.prompt<{
            backupAction: string
          }>([
            {
              type: 'list',
              name: 'backupAction',
              message:
                'Your repository already exists. What would you like to do?',
              choices: [
                { name: 'Add/update files in the repository', value: 'backup' },
                {
                  name: 'Skip file backup (repository is already set up)',
                  value: 'skip',
                },
                new inquirer.Separator(),
                { name: '← Go back', value: 'back' },
              ],
            },
          ])

          if (backupAction === 'back') {
            currentStep = 'confirm'
            continue
          }

          if (backupAction === 'skip') {
            console.log(
              chalk.cyan(
                '\n✅ Skipping file backup. Your existing repository will be used.\n',
              ),
            )
            console.log(chalk.green('\n✅ Setup complete!\n'))
            displayNextSteps(config)
            break
          }
        }

        // Select files to backup (manual file addition is handled within promptFileSelection)
        const osType = config.os === 'macOS' ? 'macos' : config.os.toLowerCase()
        const files = await promptFileSelection(osType as any, 6)
        if (files === BACK_OPTION) {
          currentStep = 'confirm'
          continue
        }

        const finalFiles = files as TrackedFile[]

        // Generate repoPath for each file using machine ID
        // Build machine ID from config: <os>-<distro>-<nickname>
        const distro = config.configFiles.machineDistro || 'unknown'
        const nickname = config.configFiles.machineNickname || 'default'
        const machineId = `${osType}-${distro}-${nickname}`

        selectedFiles = finalFiles.map((file) => ({
          ...file,
          repoPath: generateRepoPath(file.name, machineId),
        }))

        currentStep = 'detect'
      } else if (currentStep === 'detect') {
        // Detect packages, extensions, and runtimes
        const osType = config.os === 'macOS' ? 'macos' : config.os.toLowerCase()
        const distro = config.configFiles.machineDistro || 'unknown'
        const nickname = config.configFiles.machineNickname || 'default'
        const machineId = `${osType}-${distro}-${nickname}`

        const detectionResult = await promptSystemDetection(
          config.os,
          machineId,
          7,
        )

        if (detectionResult === BACK_OPTION) {
          currentStep = 'files'
          continue
        }

        // Store detected data in config
        config.detectedPackages = detectionResult.packages
        config.detectedExtensions = detectionResult.extensions
        config.detectedRuntimes = detectionResult.runtimes

        currentStep = 'backup'
      } else if (currentStep === 'backup') {
        // Execute backup
        if (!config.configFiles.cloneLocation) {
          console.log(
            chalk.red(
              '\n❌ Repository location not set. Cannot proceed with backup.\n',
            ),
          )
          currentStep = 'files'
          continue
        }

        // Build BackupConfig for schema export
        const osType = config.os === 'macOS' ? 'macos' : 'linux'
        const distro = config.configFiles.machineDistro || 'unknown'
        const nickname = config.configFiles.machineNickname || 'default'
        const machineId = `${osType}-${distro}-${nickname}`

        // Use the schema builder utility instead of manual construction
        const backupConfig: BackupConfig = buildBackupConfig({
          os: config.os,
          nickname,
          distro,
          repoType:
            config.configFiles.service === 'github' ? 'github' : 'other-git',
          repoName: config.configFiles.repoName || 'dotfiles',
          repoUrl: config.configFiles.gitRepoUrl || '',
          repoOwner: '', // TODO: extract from URL
          repoVisibility: config.configFiles.repoVisibility || 'private',
          cloneLocation: config.configFiles.cloneLocation,
          branch: 'main',
          trackedFiles: selectedFiles,
        })

        // Update machine-specific configs with detected packages, extensions, and runtimes
        if (backupConfig.dotfiles[machineId]) {
          backupConfig.dotfiles[machineId].packages = {
            enabled: (config.detectedPackages?.length || 0) > 0,
            packageManagers: config.detectedPackages || [],
          }

          backupConfig.dotfiles[machineId].extensions = {
            enabled: (config.detectedExtensions?.length || 0) > 0,
            editors: config.detectedExtensions || [],
          }

          backupConfig.dotfiles[machineId].runtimes = {
            enabled: (config.detectedRuntimes?.length || 0) > 0,
            runtimes: config.detectedRuntimes || [],
          }
        }

        const backupResult = await promptAndExecuteBackup(
          selectedFiles,
          config.configFiles.cloneLocation,
          machineId,
          backupConfig,
          8,
        )

        if (backupResult === BACK_OPTION) {
          currentStep = 'detect'
          continue
        }

        // Export detected packages, extensions, and runtimes to files
        if (config.configFiles.cloneLocation) {
          const repoPath = expandTilde(config.configFiles.cloneLocation)
          // Always use machine-specific directory with flat structure
          const baseDir = path.join(repoPath, machineId)

          // Export package manager data
          if (config.detectedPackages && config.detectedPackages.length > 0) {
            console.log(chalk.cyan('\n📦 Exporting package lists...\n'))
            for (const pm of config.detectedPackages) {
              if (pm.exportPath) {
                const exportFilePath = path.join(baseDir, pm.exportPath)
                const exportDir = path.dirname(exportFilePath)

                // Ensure directory exists
                if (!fs.existsSync(exportDir)) {
                  fs.mkdirSync(exportDir, { recursive: true })
                }

                // Export package list
                try {
                  const packageData = {
                    type: pm.type,
                    packages: pm.packages,
                    restoreCommand: pm.restoreCommand,
                  }
                  fs.writeFileSync(
                    exportFilePath,
                    JSON.stringify(packageData, null, 2),
                    'utf-8',
                  )
                  console.log(
                    chalk.green(`  ✓ Exported ${pm.type} to ${pm.exportPath}`),
                  )
                } catch (error) {
                  console.log(chalk.yellow(`  ⚠️  Could not export ${pm.type}`))
                }
              }
            }
          }

          // Export editor extensions
          if (
            config.detectedExtensions &&
            config.detectedExtensions.length > 0
          ) {
            console.log(chalk.cyan('\n🔌 Exporting editor extensions...\n'))
            for (const editor of config.detectedExtensions) {
              if (editor.exportPath) {
                const exportFilePath = path.join(baseDir, editor.exportPath)
                const exportDir = path.dirname(exportFilePath)

                // Ensure directory exists
                if (!fs.existsSync(exportDir)) {
                  fs.mkdirSync(exportDir, { recursive: true })
                }

                // Export extensions
                try {
                  await exportExtensionsToFile(editor, exportFilePath)
                  console.log(
                    chalk.green(
                      `  ✓ Exported ${editor.editor} extensions to ${editor.exportPath}`,
                    ),
                  )
                } catch (error) {
                  console.log(
                    chalk.yellow(
                      `  ⚠️  Could not export ${editor.editor} extensions`,
                    ),
                  )
                }
              }
            }
          }

          // Export runtime versions
          if (config.detectedRuntimes && config.detectedRuntimes.length > 0) {
            console.log(chalk.cyan('\n⚙️  Exporting runtime versions...\n'))
            const runtimesFilePath = path.join(baseDir, '.config/runtimes.json')
            const runtimesDir = path.dirname(runtimesFilePath)

            // Ensure directory exists
            if (!fs.existsSync(runtimesDir)) {
              fs.mkdirSync(runtimesDir, { recursive: true })
            }

            try {
              const runtimesData = {
                runtimes: config.detectedRuntimes,
              }
              fs.writeFileSync(
                runtimesFilePath,
                JSON.stringify(runtimesData, null, 2),
                'utf-8',
              )
              console.log(
                chalk.green(
                  `  ✓ Exported runtime versions to .config/runtimes.json`,
                ),
              )
            } catch (error) {
              console.log(
                chalk.yellow('  ⚠️  Could not export runtime versions'),
              )
            }
          }
        }

        // Backup complete, ask about git commit/push
        if (config.configFiles.cloneLocation) {
          await promptGitCommitAndPush(config.configFiles.cloneLocation, 9)
        }

        // Ask about creating symlinks
        if (config.configFiles.cloneLocation && selectedFiles.length > 0) {
          await promptSymlinkCreation(
            selectedFiles,
            config.configFiles.cloneLocation,
            10,
          )
        }

        // Finish setup
        console.log(chalk.green('\n✅ Setup complete!\n'))
        displayNextSteps(config)
        break
      }
    } catch (error: any) {
      // Handle Ctrl+C gracefully
      if (
        error?.name === 'ExitPromptError' ||
        error?.message?.includes('force closed')
      ) {
        handleInquirerExit(error)
      }

      // Other errors
      console.error(chalk.red('\n❌ An error occurred:'), error)
      process.exit(1)
    }
  }
}
