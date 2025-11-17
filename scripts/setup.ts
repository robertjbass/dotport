#!/usr/bin/env node

import inquirer from 'inquirer'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'
import ScriptSession from '../clients/script-session.js'

const execPromise = promisify(exec)
import { parseGitUrl, isValidGitUrl } from '../utils/git-url-parser.js'
import { authenticateWithGitHub } from '../utils/github-auth.js'
import { getConfig, ensureDirectories } from '../utils/config.js'
import { checkRepositoryExists, createRepository, createGitignoreFile, addGitignoreToRepo } from '../utils/github-repo.js'
import { DEFAULT_REPO_NAME, DEFAULT_CLONE_LOCATION, COMMON_DISTRIBUTIONS, ALL_LINUX_DISTRIBUTIONS } from '../utils/constants.js'
import { discoverConfigFiles, getExistingFiles, groupFilesByCategory, formatFileForDisplay, getCategoryDisplayName, DiscoveredFile } from '../utils/file-discovery.js'
import { backupFilesToRepo, generateRepoPath, previewBackup } from '../utils/file-backup.js'
import { exportSchemaToRepo, createSchemaReadme } from '../utils/schema-export.js'
import { TrackedFile, BackupConfig, DEFAULT_BACKUP_CONFIG } from '../types/backup-config.js'

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

interface SetupConfig {
  os: OperatingSystem
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
  }
  secrets: {
    enabled: boolean
    storageType?: SecretStorageCategory
    details?: {
      localType?: string
      cloudService?: string
      gitEncryption?: string
      platformService?: string
    }
  }
}

/**
 * Detect operating system automatically
 */
function detectOS(): OperatingSystem {
  const platform = ScriptSession.operatingSystem

  if (platform === 'darwin') return 'macOS'
  if (platform === 'linux') return 'linux'
  if (platform === 'win32') return 'windows'
  return 'other'
}

/**
 * Special symbol to indicate user wants to go back
 */
const BACK_OPTION = Symbol('back')

/**
 * Display welcome message
 */
function displayWelcome() {
  console.clear()
  console.log(chalk.cyan.bold('\n' + '='.repeat(60)))
  console.log(chalk.cyan.bold('  Dev Machine Backup & Restore - Interactive Setup'))
  console.log(chalk.cyan.bold('='.repeat(60)))
  console.log(chalk.gray('\nThis wizard will help you configure your backup preferences.'))
  console.log(chalk.gray('Your responses will determine how your dotfiles and secrets are managed.\n'))
}

/**
 * Display step progress indicator
 */
function displayStepProgress(currentStep: number, totalSteps: number, stepName: string) {
  const percentage = Math.round((currentStep / totalSteps) * 100)
  const progressBarLength = 40
  const filledLength = Math.round((progressBarLength * currentStep) / totalSteps)
  const emptyLength = progressBarLength - filledLength
  const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength)

  console.log(chalk.cyan(`\n┌${'─'.repeat(58)}┐`))
  console.log(chalk.cyan(`│ Step ${currentStep} of ${totalSteps}: ${stepName}${' '.repeat(58 - 12 - stepName.length - String(currentStep).length - String(totalSteps).length)}│`))
  console.log(chalk.cyan(`│ Progress: ${progressBar} ${percentage}%${' '.repeat(58 - 12 - progressBarLength - String(percentage).length - 1)}│`))
  console.log(chalk.cyan(`└${'─'.repeat(58)}┘`))
}

/**
 * Prompt for operating system confirmation
 */
async function promptOperatingSystem(showBack = false, stepNumber = 1): Promise<OperatingSystem | typeof BACK_OPTION> {
  const detectedOS = detectOS()

  displayStepProgress(stepNumber, 8, 'Operating System Detection')

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
    console.log(chalk.red('\n❌ We do not currently support backup/restore for this operating system.'))
    console.log(chalk.gray('   Supported systems: macOS and Linux\n'))
    process.exit(1)
  }

  return os
}

/**
 * Prompt for config file storage preferences
 */
async function promptConfigFileStorage(currentOS: OperatingSystem, showBack = false, stepNumber = 2): Promise<SetupConfig['configFiles'] | typeof BACK_OPTION> {
  displayStepProgress(stepNumber, 8, 'Config File Storage')
  console.log(chalk.gray('\n  Config files: dotfiles like .bashrc, .zshrc, editor settings, etc.'))
  console.log(chalk.gray('  (This does NOT include secrets like SSH keys or API tokens)\n'))

  const vcChoices: any[] = [
    { name: 'Yes', value: 'yes' },
    { name: 'No', value: 'no' },
  ]

  if (showBack) {
    vcChoices.push(new inquirer.Separator())
    vcChoices.push({ name: '← Go back', value: 'back' })
  }

  const { hasVersionControl } = await inquirer.prompt<{ hasVersionControl: string }>([
    {
      type: 'list',
      name: 'hasVersionControl',
      message: 'Do you currently store config files in version control?',
      choices: vcChoices,
    },
  ])

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

  if (service === 'github' || service === 'other-git') {
    if (service === 'github') {
      // Authenticate with GitHub for repository operations
      console.log(chalk.gray('\n📡 Authenticating with GitHub...\n'))
      let octokit
      try {
        octokit = await authenticateWithGitHub()
      } catch (error) {
        console.log(chalk.yellow('\n⚠️  GitHub authentication failed. You can set this up later.\n'))
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

      // Ask about multi-OS support
      const multiOSResult = await promptMultiOSSupport(currentOS)
      if (multiOSResult === BACK_OPTION) {
        return BACK_OPTION
      }

      multiOS = multiOSResult.multiOS
      supportedDistros = multiOSResult.supportedDistros

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
  }
}

/**
 * Check if repository exists and handle creation flow
 */
async function handleRepositorySetup(octokit: any, repoName: string = DEFAULT_REPO_NAME): Promise<{
  exists: boolean
  repoName: string
  repoUrl?: string
  visibility?: 'public' | 'private'
} | typeof BACK_OPTION> {
  try {
    console.log(chalk.gray(`\n🔍 Checking if repository "${repoName}" exists...\n`))

    const checkResult = await checkRepositoryExists(octokit, repoName)

    if (checkResult.exists) {
      console.log(chalk.green(`✅ Repository "${repoName}" already exists!`))
      console.log(chalk.gray(`   URL: ${checkResult.url}`))
      console.log(chalk.gray(`   Visibility: ${checkResult.isPrivate ? 'Private' : 'Public'}\n`))

      const { useExisting } = await inquirer.prompt<{ useExisting: string }>([
        {
          type: 'list',
          name: 'useExisting',
          message: 'Would you like to use this existing repository?',
          choices: [
            { name: 'Yes, use this repository', value: 'yes' },
            { name: 'No, let me specify a different repository name', value: 'no' },
            new inquirer.Separator(),
            { name: '← Go back', value: 'back' },
          ],
        },
      ])

      if (useExisting === 'back') return BACK_OPTION

      if (useExisting === 'yes') {
        return {
          exists: true,
          repoName,
          repoUrl: checkResult.httpsUrl,
          visibility: checkResult.isPrivate ? 'private' : 'public',
        }
      }

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
          { name: 'No, I\'ll create it manually later', value: 'no' },
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
    const { visibility } = await inquirer.prompt<{ visibility: 'public' | 'private' }>([
      {
        type: 'list',
        name: 'visibility',
        message: 'Should the repository be public or private?',
        choices: [
          { name: 'Private (recommended for dotfiles with sensitive data)', value: 'private' },
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
      console.log(chalk.red(`\n❌ Failed to create repository: ${result.error}\n`))
      return BACK_OPTION
    }

    // Get owner from authenticated user
    const { data: user } = await octokit.users.getAuthenticated()
    const owner = user.login

    // Add .gitignore file to the newly created repository
    const gitignoreResult = await addGitignoreToRepo(octokit, owner, repoName, 'main')
    if (!gitignoreResult.success) {
      console.log(chalk.yellow(`⚠️  Warning: Failed to add .gitignore file: ${gitignoreResult.error}`))
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
async function promptMultiOSSupport(currentOS: OperatingSystem): Promise<{
  multiOS: boolean
  supportedDistros?: string[]
} | typeof BACK_OPTION> {
  const { multiOS } = await inquirer.prompt<{ multiOS: string }>([
    {
      type: 'list',
      name: 'multiOS',
      message: 'Do you want to support multiple operating systems?',
      choices: [
        { name: 'Yes, I want to support multiple OSes', value: 'yes' },
        { name: `No, just ${currentOS}`, value: 'no' },
        new inquirer.Separator(),
        { name: '← Go back', value: 'back' },
      ],
    },
  ])

  if (multiOS === 'back') return BACK_OPTION

  if (multiOS === 'no') {
    return { multiOS: false }
  }

  // Only ask about Linux distributions if currently on Linux
  if (currentOS !== 'linux') {
    return { multiOS: true }
  }

  // If they want multi-OS and current OS is Linux
  const { supportLinux } = await inquirer.prompt<{ supportLinux: string }>([
    {
      type: 'list',
      name: 'supportLinux',
      message: 'Do you want to support multiple Linux distributions?',
      choices: [
        { name: 'Yes, multiple Linux distros', value: 'yes' },
        { name: 'No, just one Linux distro', value: 'no' },
      ],
    },
  ])

  if (supportLinux === 'no') {
    // Ask for the single distro
    const { singleDistro } = await inquirer.prompt<{ singleDistro: string }>([
      {
        type: 'list',
        name: 'singleDistro',
        message: 'Which Linux distribution?',
        choices: [
          new inquirer.Separator('=== Common Distributions ==='),
          ...COMMON_DISTRIBUTIONS,
          new inquirer.Separator('\n=== All Distributions ==='),
          ...ALL_LINUX_DISTRIBUTIONS.filter(
            d => !COMMON_DISTRIBUTIONS.find(c => c.value === d.value)
          ),
        ],
      },
    ])

    return {
      multiOS: true,
      supportedDistros: [singleDistro],
    }
  }

  // Show distribution selection for multiple distros
  const { distros } = await inquirer.prompt<{ distros: string[] }>([
    {
      type: 'checkbox',
      name: 'distros',
      message: 'Select the Linux distributions you want to support:',
      choices: [
        new inquirer.Separator('=== Common Distributions ==='),
        ...COMMON_DISTRIBUTIONS,
        new inquirer.Separator('=== All Distributions ==='),
        ...ALL_LINUX_DISTRIBUTIONS.filter(
          d => !COMMON_DISTRIBUTIONS.find(c => c.value === d.value)
        ),
      ],
      validate: (input) => {
        if (input.length === 0) return 'Please select at least one distribution'
        return true
      },
    },
  ])

  return {
    multiOS: true,
    supportedDistros: distros,
  }
}

/**
 * Prompt for clone/repo location
 */
async function promptCloneLocation(repoExists: boolean, repoName: string, showBack = true): Promise<string | typeof BACK_OPTION> {
  const message = repoExists
    ? `Where is your ${repoName} repository located?`
    : `Where should we create the ${repoName} repository?`

  const helpText = repoExists
    ? chalk.gray('  (e.g., ~/dev/dotfiles, ~/dotfiles, etc.)\n')
    : chalk.gray('  This is where the repository will be cloned/created\n  (e.g., ~/, ~/dev, etc.)\n')

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

          // For existing repos, check if it exists
          if (repoExists) {
            let expandedPath = input.trim()
            if (expandedPath.startsWith('~/')) {
              expandedPath = path.join(os.homedir(), expandedPath.slice(2))
            }

            if (!fs.existsSync(expandedPath)) {
              return `Directory does not exist: ${expandedPath}\nPlease provide the correct path to your existing repository`
            }

            // Check if it's a git repository
            const gitDir = path.join(expandedPath, '.git')
            if (!fs.existsSync(gitDir)) {
              return `Not a git repository: ${expandedPath}\nPlease provide a path to a valid git repository`
            }
          }

          return true
        },
        transformer: (input) => {
          // Show the expanded path
          if (input.startsWith('~')) {
            return input.replace('~', os.homedir())
          }
          return input
        },
      },
    ])

    // Expand ~ to home directory
    let expandedLocation = location.trim()
    if (expandedLocation.startsWith('~')) {
      expandedLocation = expandedLocation.replace('~', os.homedir())
    }

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

    return expandedLocation
  }
}

/**
 * Prompt for file selection - which config files to back up
 */
async function promptFileSelection(osType: OperatingSystem, stepNumber = 5): Promise<TrackedFile[] | typeof BACK_OPTION> {
  displayStepProgress(stepNumber, 8, 'Select Files to Backup')
  console.log(chalk.gray('\n  Choose which configuration files you want to back up\n'))

  // Discover existing files
  const existingFiles = getExistingFiles(osType)

  if (existingFiles.length === 0) {
    console.log(chalk.yellow('⚠️  No common config files found in your home directory.\n'))
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
  const filteredFiles = existingFiles.filter(file => file.category !== 'secrets')

  // Group files by category
  const grouped = groupFilesByCategory(filteredFiles)

  // Show info about secret files if any were found
  const secretFiles = existingFiles.filter(file => file.category === 'secrets')
  if (secretFiles.length > 0) {
    console.log(chalk.yellow(`ℹ️  Found ${secretFiles.length} secret file(s) that will be handled separately:`))
    secretFiles.forEach(file => {
      console.log(chalk.gray(`   - ${file.relativePath}`))
    })
    console.log(chalk.gray('   (Configure these through the Secret Management section)\n'))
  }

  // Create choices for multi-select
  const choices: any[] = []

  // Add files grouped by category
  Array.from(grouped.entries()).forEach(([category, files]) => {
    choices.push(new inquirer.Separator(`\n=== ${getCategoryDisplayName(category)} ===`))

    files.forEach(file => {
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
    const { selectedFiles } = await inquirer.prompt<{ selectedFiles: DiscoveredFile[] }>([
      {
        type: 'checkbox',
        name: 'selectedFiles',
        message: 'Select files to back up (use space to select, enter to confirm):',
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

    // Ask if they want to add more files manually
    const { addMore } = await inquirer.prompt<{ addMore: string }>([
      {
        type: 'list',
        name: 'addMore',
        message: `Selected ${selectedFiles.length} file(s). Add more files manually?`,
        choices: [
          { name: 'No, continue with selected files', value: 'no' },
          { name: 'Yes, add more files manually', value: 'yes' },
        ],
      },
    ])

    // Convert discovered files to TrackedFile format
    let trackedFiles: TrackedFile[] = selectedFiles.map(file => {
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
    if (error?.name === 'ExitPromptError' || error?.message?.includes('force closed')) {
      console.log(chalk.yellow('\n\n⚠️  File selection cancelled.\n'))
      process.exit(0)
    }
    throw error
  }
}

/**
 * Prompt for manually adding files
 */
async function promptManualFileAddition(existingFiles: TrackedFile[]): Promise<TrackedFile[] | typeof BACK_OPTION> {
  const files = [...existingFiles]

  while (true) {
    console.log(chalk.cyan(`\n📝 Manual File Addition (${files.length} file(s) selected)\n`))

    const { filePath } = await inquirer.prompt<{ filePath: string }>([
      {
        type: 'input',
        name: 'filePath',
        message: 'Enter file path (or leave empty to finish):',
        validate: (input) => {
          if (!input.trim()) return true // Allow empty to finish

          // Expand tilde
          let expandedPath = input.trim()
          if (expandedPath.startsWith('~/')) {
            expandedPath = path.join(os.homedir(), expandedPath.slice(2))
          }

          // Check if file exists
          if (!fs.existsSync(expandedPath)) {
            return `File or directory does not exist: ${expandedPath}`
          }

          return true
        },
      },
    ])

    if (!filePath.trim()) {
      // Done adding files
      break
    }

    // Expand path
    let expandedPath = filePath.trim()
    if (expandedPath.startsWith('~/')) {
      expandedPath = path.join(os.homedir(), expandedPath.slice(2))
    }

    // Get relative path
    const homeDir = os.homedir()
    const relativePath = expandedPath.startsWith(homeDir)
      ? '~' + expandedPath.slice(homeDir.length)
      : expandedPath

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
    const homeRelativePath = relativePath.startsWith('~/')
      ? relativePath.slice(2) // Remove '~/' to get .ssh/config instead of just config
      : path.basename(expandedPath)

    files.push({
      name: homeRelativePath,
      sourcePath: relativePath,
      repoPath: '', // Will be set later
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
async function promptSecretStorage(showBack = false, stepNumber = 3): Promise<SetupConfig['secrets'] | typeof BACK_OPTION> {
  displayStepProgress(stepNumber, 8, 'Secret Management')
  console.log(chalk.gray('\n  Secrets: environment variables, API keys, SSH keys, etc.\n'))

  const secretChoices: any[] = [
    { name: 'Yes, I want to set up or configure secret management', value: 'yes' },
    { name: 'No, skip secret management', value: 'no' },
  ]

  if (showBack) {
    secretChoices.push(new inquirer.Separator())
    secretChoices.push({ name: '← Go back', value: 'back' })
  }

  const { manageSecrets } = await inquirer.prompt<{ manageSecrets: string }>([
    {
      type: 'list',
      name: 'manageSecrets',
      message: 'Do you currently have secret management or wish to set up secret management?',
      choices: secretChoices,
    },
  ])

  if (manageSecrets === 'back') {
    return BACK_OPTION
  }

  if (manageSecrets === 'no') {
    return {
      enabled: false,
    }
  }

  const backupChoices: any[] = [
    { name: 'Yes', value: 'yes' },
    { name: 'No', value: 'no' },
  ]

  if (showBack) {
    backupChoices.push(new inquirer.Separator())
    backupChoices.push({ name: '← Go back', value: 'back' })
  }

  const { currentlyBackingUp } = await inquirer.prompt<{ currentlyBackingUp: string }>([
    {
      type: 'list',
      name: 'currentlyBackingUp',
      message: 'Do you already use a service for managing your secrets?',
      choices: backupChoices,
    },
  ])

  if (currentlyBackingUp === 'back') {
    return BACK_OPTION
  }

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
    { name: '1Password / LastPass / Dashlane (manual)', value: 'password-manager' },

    new inquirer.Separator(chalk.cyan('\n── No Secret Management ──')),
    { name: 'Skip secret management', value: 'none' },
  ]

  if (showBack) {
    storageCategoryChoices.push(new inquirer.Separator())
    storageCategoryChoices.push({ name: '← Go back', value: 'back' })
  }

  const { storageCategory } = await inquirer.prompt<{ storageCategory: string }>([
    {
      type: 'list',
      name: 'storageCategory',
      message: currentlyBackingUp === 'yes'
        ? 'Which approach do you currently use to manage secrets?'
        : 'Which approach would you like to use to manage secrets?',
      choices: storageCategoryChoices,
    },
  ])

  if (storageCategory === 'back') {
    return BACK_OPTION
  }

  if (storageCategory === 'none') {
    return {
      enabled: false,
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
          '.env file',
          'Shell script exports (.env.sh, .secrets.sh)',
          'PGP-encrypted file',
          'Age-encrypted file',
          'Plaintext file',
        ],
      },
    ])
    details.localType = localType

    // Ask for the filename
    const { secretFileName } = await inquirer.prompt<{ secretFileName: string }>([
      {
        type: 'input',
        name: 'secretFileName',
        message: 'What is the name of your secret file?',
        default: localType.includes('.env.sh') ? '.env.sh' : '.env',
        validate: (input) => {
          if (!input.trim()) return 'Filename is required'
          if (!input.startsWith('.')) return 'Secret files should start with a dot (e.g., .env.sh)'
          return true
        },
      },
    ])
    details.secretFileName = secretFileName

    // Ask for the location
    const { secretFileLocation } = await inquirer.prompt<{ secretFileLocation: string }>([
      {
        type: 'input',
        name: 'secretFileLocation',
        message: 'Where is this file located?',
        default: '~',
        transformer: (input) => {
          // Show the expanded path
          if (input.startsWith('~')) {
            return input.replace('~', os.homedir())
          }
          return input
        },
      },
    ])
    details.secretFileLocation = secretFileLocation

    // Check if the file exists
    const fullPath = path.join(
      secretFileLocation.replace('~', os.homedir()),
      secretFileName
    )
    const fileExists = fs.existsSync(fullPath)

    if (fileExists) {
      console.log(chalk.green(`\n✅ Found existing file at ${fullPath}\n`))
      details.secretFileExists = 'yes'
    } else {
      console.log(chalk.yellow(`\n⚠️  File not found at ${fullPath}\n`))

      const { createFile } = await inquirer.prompt<{ createFile: string }>([
        {
          type: 'list',
          name: 'createFile',
          message: 'Would you like to create this file?',
          choices: [
            { name: 'Yes, create it now', value: 'yes' },
            { name: 'No, I\'ll create it manually later', value: 'no' },
          ],
        },
      ])

      details.secretFileExists = 'no'
      details.createSecretFile = createFile

      if (createFile === 'yes') {
        try {
          // Create the directory if it doesn't exist
          const dir = path.dirname(fullPath)
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
          }

          // Create the file with secure permissions
          fs.writeFileSync(fullPath, '# Secret environment variables\n# Add your secrets below\n\n', { mode: 0o600 })
          console.log(chalk.green(`✅ Created ${fullPath} with secure permissions (0600)\n`))
          details.secretFileExists = 'yes'
        } catch (error: any) {
          console.log(chalk.red(`❌ Failed to create file: ${error.message}\n`))
          console.log(chalk.gray('You can create it manually later.\n'))
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
    const { platformService } = await inquirer.prompt<{ platformService: string }>([
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
        choices: [
          'HashiCorp Vault',
          'Doppler',
          'Akeyless',
          'Infisical',
        ],
      },
    ])
    details.cloudService = vaultService
  }

  return {
    enabled: true,
    storageType: storageCategory,
    details,
  }
}

/**
 * Display configuration summary
 */
function displaySummary(config: SetupConfig, stepNumber = 4) {
  displayStepProgress(stepNumber, 8, 'Configuration Summary')
  console.log()

  console.log(chalk.bold('Operating System:'))
  console.log(`  ${config.os}\n`)

  console.log(chalk.bold('Config File Storage:'))
  if (config.configFiles.versionControl) {
    console.log(`  Service: ${config.configFiles.service}`)
    if (config.configFiles.gitRepoUrl) {
      console.log(`  Repository: ${config.configFiles.gitRepoUrl}`)
    }
  } else {
    console.log('  Not using version control')
  }
  console.log()

  console.log(chalk.bold('Secret Management:'))
  if (config.secrets.enabled) {
    console.log(`  Type: ${config.secrets.storageType}`)
    if (config.secrets.details) {
      Object.entries(config.secrets.details).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`)
      })
    }
  } else {
    console.log('  Not managing secrets')
  }
  console.log()
}

/**
 * Prompt user to confirm and execute file backup
 */
async function promptAndExecuteBackup(
  files: TrackedFile[],
  repoPath: string,
  osOrDistro: string,
  backupConfig: BackupConfig,
  stepNumber = 6
): Promise<boolean | typeof BACK_OPTION> {
  displayStepProgress(stepNumber, 8, 'Backup Files to Repository')

  if (files.length === 0) {
    console.log(chalk.yellow('\n⚠️  No files selected for backup. Skipping backup step.\n'))
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
    console.log(chalk.yellow('\n⚠️  Backup skipped. You can run the backup manually later.\n'))
    return false
  }

  // Execute backup
  const backupResult = await backupFilesToRepo(files, repoPath, osOrDistro, { verbose: true })

  if (!backupResult.success) {
    console.log(chalk.red('\n❌ Backup completed with errors. Please review and fix the issues.\n'))
    return false
  }

  if (backupResult.errors.length > 0) {
    console.log(chalk.yellow('\n⚠️  Some files failed to backup:'))
    backupResult.errors.forEach(err => {
      console.log(chalk.yellow(`  - ${err.file}: ${err.error}`))
    })
    console.log()
  }

  // Export schema to repository
  console.log(chalk.cyan('\n📋 Saving backup configuration to repository...\n'))

  const schemaResult = await exportSchemaToRepo(backupConfig, repoPath, { verbose: true })
  if (!schemaResult.success) {
    console.log(chalk.yellow(`⚠️  Warning: Failed to export schema: ${schemaResult.error}\n`))
  }

  const readmeResult = await createSchemaReadme(repoPath, { verbose: true })
  if (!readmeResult.success) {
    console.log(chalk.yellow(`⚠️  Warning: Failed to create schema README: ${readmeResult.error}\n`))
  }

  console.log(chalk.green('✅ Backup completed successfully!\n'))
  console.log(chalk.cyan('📂 Next steps:'))
  console.log(chalk.white('  1. Review the backed up files in: ') + chalk.gray(repoPath))
  console.log(chalk.white('  2. Commit and push your changes to git'))
  console.log(chalk.white('  3. Run the symlink creation script (coming soon)\n'))

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
 */
async function promptGitCommitAndPush(repoPath: string, stepNumber = 7): Promise<void> {
  displayStepProgress(stepNumber, 8, 'Git Commit & Push')
  console.log()

  const { commitAndPush } = await inquirer.prompt<{ commitAndPush: string }>([
    {
      type: 'list',
      name: 'commitAndPush',
      message: 'Would you like to commit and push the changes to your dotfiles repository?',
      choices: [
        { name: 'Yes, commit and push now', value: 'yes' },
        { name: 'No, I will do it manually later', value: 'no' },
      ],
    },
  ])

  if (commitAndPush === 'yes') {
    try {
      console.log(chalk.cyan('\n🔄 Committing and pushing changes...\n'))

      // Check git status
      const { stdout: status } = await execPromise('git status --porcelain', { cwd: repoPath })

      if (!status.trim()) {
        console.log(chalk.yellow('ℹ️  No changes to commit.\n'))
        return
      }

      // Stage all changes
      await execPromise('git add .', { cwd: repoPath })
      console.log(chalk.green('✅ Staged all changes'))

      // Create commit using heredoc for safety
      const commitMessage = `Update dotfiles configuration

🤖 Generated with dev-machine-backup-restore

Co-Authored-By: dev-machine-backup-restore <noreply@github.com>`

      await execPromise(`git commit -m "$(cat <<'EOF'
${commitMessage}
EOF
)"`, { cwd: repoPath })
      console.log(chalk.green('✅ Created commit'))

      // Push to remote
      await execPromise('git push', { cwd: repoPath })
      console.log(chalk.green('✅ Pushed to remote\n'))

      console.log(chalk.green('🎉 Changes successfully committed and pushed!\n'))
    } catch (error: any) {
      console.log(chalk.red(`\n❌ Failed to commit/push: ${error.message}\n`))
      console.log(chalk.yellow('You can commit and push manually:'))
      console.log(chalk.gray(`  cd ${repoPath}`))
      console.log(chalk.gray('  git add .'))
      console.log(chalk.gray('  git commit -m "Update dotfiles"'))
      console.log(chalk.gray('  git push\n'))
    }
  } else {
    console.log(chalk.cyan('\n📍 Repository location: ') + chalk.white(repoPath))
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
  stepNumber = 8
): Promise<void> {
  displayStepProgress(stepNumber, 8, 'Create Symlinks')
  console.log(chalk.gray('\nSymlinks allow files to be stored in your dotfiles repository'))
  console.log(chalk.gray('while still being accessible from their expected locations.\n'))

  const { createSymlinks } = await inquirer.prompt<{ createSymlinks: string }>([
    {
      type: 'list',
      name: 'createSymlinks',
      message: 'Would you like to create symlinks for your backed up files?',
      choices: [
        { name: 'Yes, let me select which files to symlink', value: 'yes' },
        { name: 'No, I will create them manually later', value: 'no' },
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
  const symlinkableFiles = files.filter(f => f.symlinkEnabled)

  if (symlinkableFiles.length === 0) {
    console.log(chalk.yellow('\nℹ️  No files available for symlinking (only directories were backed up).\n'))
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
    const isSymlink = targetExists && fs.lstatSync(expandTilde(targetLocation)).isSymbolicLink()

    if (isSymlink) {
      const currentTarget = fs.readlinkSync(expandTilde(targetLocation))
      console.log(chalk.yellow(`  ⚠️  Already a symlink → ${currentTarget}`))
    } else if (targetExists) {
      console.log(chalk.yellow(`  ⚠️  File exists (will be backed up to ${targetLocation}.backup)`))
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
  console.log(chalk.cyan(`\n🔗 Creating ${selectedFiles.length} symlink(s)...\n`))

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
          console.log(chalk.yellow(`  Backed up existing file: ${file.name} → ${backupPath}`))
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
      console.log(chalk.red(`  ❌ Failed to create symlink for ${file.name}: ${error.message}`))
      errorCount++
    }
  }

  console.log(chalk.cyan('\n' + '─'.repeat(50)))
  console.log(chalk.green(`✅ Successfully created: ${successCount} symlink(s)`))
  if (errorCount > 0) {
    console.log(chalk.red(`❌ Failed: ${errorCount} symlink(s)`))
  }
  console.log(chalk.cyan('─'.repeat(50) + '\n'))
}

/**
 * Expand tilde in path for symlink creation
 */
function expandTilde(filePath: string): string {
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2))
  }
  return filePath
}

/**
 * Display next steps
 */
function displayNextSteps(config: SetupConfig) {
  const appConfig = getConfig()
  const configPath = appConfig.paths.backupConfig

  console.log(chalk.cyan.bold('NEXT STEPS:\n'))

  console.log(chalk.white(`1. Review your configuration in ${configPath}`))
  console.log(chalk.white('2. Run the backup script to snapshot your current setup:'))
  console.log(chalk.gray('   pnpm run script populate-backup-schema\n'))

  if (config.configFiles.versionControl) {
    console.log(chalk.white('3. Your dotfiles will be backed up to:'))
    console.log(chalk.gray(`   ${config.configFiles.gitRepoUrl}\n`))
  }

  if (config.secrets.enabled) {
    console.log(chalk.yellow('⚠️  Remember to configure your secret storage credentials'))
    console.log(chalk.gray(`   Storage type: ${config.secrets.storageType}\n`))
  }

  console.log(chalk.cyan('='.repeat(20) + '\n'))
}

/**
 * Setup graceful exit handlers
 */
function setupExitHandlers() {
  const handleExit = () => {
    console.log(chalk.yellow('\n\n⚠️  Setup interrupted. Run this script again to configure.\n'))
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
  if (error?.name === 'ExitPromptError' || error?.message?.includes('force closed')) {
    console.log(chalk.yellow('\n\n⚠️  Setup interrupted. Run this script again to configure.\n'))
    process.exit(0)
  }

  // Re-throw other errors
  throw error
}

/**
 * Main setup function with back button support
 */
export default async function setup() {
  setupExitHandlers()
  displayWelcome()

  const config: SetupConfig = {
    os: 'macOS' as OperatingSystem,
    configFiles: { versionControl: false, service: 'none' },
    secrets: { enabled: false },
  }

  // State machine for navigation
  type Step = 'os' | 'config' | 'secrets' | 'confirm' | 'files' | 'backup'
  let currentStep: Step = 'os'
  const stepOrder: Step[] = ['os', 'config', 'secrets', 'confirm', 'files', 'backup']

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
        currentStep = 'config'
      } else if (currentStep === 'config') {
        const configFiles = await promptConfigFileStorage(config.os, true, 2)
        if (configFiles === BACK_OPTION) {
          currentStep = 'os'
          continue
        }
        config.configFiles = configFiles as SetupConfig['configFiles']
        currentStep = 'secrets'
      } else if (currentStep === 'secrets') {
        const secrets = await promptSecretStorage(true, 3)
        if (secrets === BACK_OPTION) {
          currentStep = 'config'
          continue
        }
        config.secrets = secrets as SetupConfig['secrets']
        currentStep = 'confirm'
      } else if (currentStep === 'confirm') {
        displaySummary(config, 4)

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
          console.log(chalk.yellow('\n⚠️  Setup cancelled. Run this script again to configure.\n'))
          process.exit(0)
        }

        // Confirmed, save configuration
        await saveConfiguration(config)

        // Move to file selection if using version control
        if (config.configFiles.versionControl && config.configFiles.cloneLocation) {
          currentStep = 'files'
        } else {
          // No version control, finish setup
          displayNextSteps(config)
          break
        }
      } else if (currentStep === 'files') {
        // Check if they have an existing repo with files
        if (config.configFiles.repoExists) {
          const { backupAction } = await inquirer.prompt<{ backupAction: string }>([
            {
              type: 'list',
              name: 'backupAction',
              message: 'Your repository already exists. What would you like to do?',
              choices: [
                { name: 'Add/update files in the repository', value: 'backup' },
                { name: 'Skip file backup (repository is already set up)', value: 'skip' },
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
            console.log(chalk.cyan('\n✅ Skipping file backup. Your existing repository will be used.\n'))
            console.log(chalk.green('\n✅ Setup complete!\n'))
            displayNextSteps(config)
            break
          }
        }

        // Select files to backup (manual file addition is handled within promptFileSelection)
        const osType = config.os === 'macOS' ? 'macos' : config.os.toLowerCase()
        const files = await promptFileSelection(osType as any, 5)
        if (files === BACK_OPTION) {
          currentStep = 'confirm'
          continue
        }

        const finalFiles = files as TrackedFile[]

        // Generate repoPath for each file
        const multiOS = config.configFiles.multiOS || false

        // Determine the OS/distro folder name
        let osOrDistro: string
        if (config.os === 'macOS') {
          osOrDistro = 'macos'
        } else {
          // For Linux, use the specific distro name (e.g., 'debian', 'popos')
          // If supportedDistros is set, use the first one (current distro)
          osOrDistro = config.configFiles.supportedDistros?.[0] || 'linux'
        }

        // When multi-OS is enabled, always use nested structure
        const structureType: 'flat' | 'nested' = multiOS ? 'nested' : 'flat'

        finalFiles = finalFiles.map(file => ({
          ...file,
          repoPath: generateRepoPath(file.name, osOrDistro, multiOS, structureType),
        }))

        selectedFiles = finalFiles
        currentStep = 'backup'
      } else if (currentStep === 'backup') {
        // Execute backup
        if (!config.configFiles.cloneLocation) {
          console.log(chalk.red('\n❌ Repository location not set. Cannot proceed with backup.\n'))
          currentStep = 'files'
          continue
        }

        // Build BackupConfig for schema export
        const osType = config.os === 'macOS' ? 'macos' : 'linux'
        const backupConfig: BackupConfig = {
          ...DEFAULT_BACKUP_CONFIG,
          version: '1.0.0',
          system: {
            primary: osType as any,
            shell: 'zsh',  // TODO: detect shell
            shellConfigFile: '.zshrc',  // TODO: detect shell config
          },
          multiOS: {
            enabled: config.configFiles.multiOS || false,
            supportedOS: [osType as any],
            linuxDistros: config.configFiles.supportedDistros,
          },
          dotfiles: {
            enabled: true,
            repoType: config.configFiles.service === 'github' ? 'github' : 'other-git',
            repoName: config.configFiles.repoName || 'dotfiles',
            repoUrl: config.configFiles.gitRepoUrl || '',
            repoOwner: '',  // TODO: extract from URL
            branch: 'main',
            visibility: config.configFiles.repoVisibility || 'private',
            cloneLocation: config.configFiles.cloneLocation,
            structure: {
              type: config.configFiles.multiOS ? 'nested' : 'flat',
              directories: config.configFiles.multiOS ? { [osType]: `${osType}/` } : {},
            },
            trackedFiles: {
              [osType]: {
                files: selectedFiles,
              },
            },
          },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }

        const backupResult = await promptAndExecuteBackup(
          selectedFiles,
          config.configFiles.cloneLocation,
          osType,
          backupConfig,
          6
        )

        if (backupResult === BACK_OPTION) {
          currentStep = 'files'
          continue
        }

        // Backup complete, ask about git commit/push
        if (config.configFiles.cloneLocation) {
          await promptGitCommitAndPush(config.configFiles.cloneLocation, 7)
        }

        // Ask about creating symlinks
        if (config.configFiles.cloneLocation && selectedFiles.length > 0) {
          await promptSymlinkCreation(selectedFiles, config.configFiles.cloneLocation, 8)
        }

        // Finish setup
        console.log(chalk.green('\n✅ Setup complete!\n'))
        displayNextSteps(config)
        break
      }
    } catch (error: any) {
      // Handle Ctrl+C gracefully
      if (error?.name === 'ExitPromptError' || error?.message?.includes('force closed')) {
        handleInquirerExit(error)
      }

      // Other errors
      console.error(chalk.red('\n❌ An error occurred:'), error)
      process.exit(1)
    }
  }
}
