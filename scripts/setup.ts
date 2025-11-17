#!/usr/bin/env node

import inquirer from 'inquirer'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import ScriptSession from '../clients/script-session.js'

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
 * Display welcome message
 */
function displayWelcome() {
  console.clear()
  console.log(chalk.cyan.bold('\n='.repeat(70)))
  console.log(chalk.cyan.bold('  Dev Machine Backup & Restore - Interactive Setup'))
  console.log(chalk.cyan.bold('='.repeat(70)))
  console.log(chalk.gray('\nThis wizard will help you configure your backup preferences.'))
  console.log(chalk.gray('Your responses will determine how your dotfiles and secrets are managed.\n'))
}

/**
 * Prompt for operating system confirmation
 */
async function promptOperatingSystem(): Promise<OperatingSystem> {
  const detectedOS = detectOS()

  console.log(chalk.yellow('\n' + '='.repeat(70)))
  console.log(chalk.yellow.bold('  OPERATING SYSTEM'))
  console.log(chalk.yellow('='.repeat(70) + '\n'))

  const { os } = await inquirer.prompt<{ os: OperatingSystem }>([
    {
      type: 'list',
      name: 'os',
      message: 'Select your operating system:',
      default: detectedOS,
      choices: [
        { name: '🍎  macOS', value: 'macOS' },
        { name: '🐧  Linux', value: 'linux' },
        { name: '🪟  Windows', value: 'windows' },
        { name: '❓  Other', value: 'other' },
      ],
    },
  ])

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
async function promptConfigFileStorage(): Promise<SetupConfig['configFiles']> {
  console.log(chalk.yellow('\n' + '='.repeat(70)))
  console.log(chalk.yellow.bold('  CONFIG FILE STORAGE'))
  console.log(chalk.yellow('='.repeat(70)))
  console.log(chalk.gray('  Config files: dotfiles like .bashrc, .zshrc, editor settings, etc.'))
  console.log(chalk.gray('  (This does NOT include secrets like SSH keys or API tokens)\n'))

  const { hasVersionControl } = await inquirer.prompt<{ hasVersionControl: boolean }>([
    {
      type: 'confirm',
      name: 'hasVersionControl',
      message: 'Do you currently store config files in version control?',
      default: false,
    },
  ])

  if (!hasVersionControl) {
    return {
      versionControl: false,
      service: 'none',
    }
  }

  const { service } = await inquirer.prompt<{ service: ConfigStorage }>([
    {
      type: 'list',
      name: 'service',
      message: 'Which service do you use to store your config files?',
      choices: [
        { name: 'GitHub', value: 'github' },
        { name: 'Other Git Service', value: 'other-git' },
      ],
    },
  ])

  let gitRepoUrl: string | undefined

  if (service === 'github' || service === 'other-git') {
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

  return {
    versionControl: true,
    service,
    gitRepoUrl,
  }
}

/**
 * Prompt for secret storage preferences
 */
async function promptSecretStorage(): Promise<SetupConfig['secrets']> {
  console.log(chalk.yellow('\n' + '='.repeat(70)))
  console.log(chalk.yellow.bold('  SECRET STORAGE'))
  console.log(chalk.yellow('='.repeat(70)))
  console.log(chalk.gray('  Secrets: environment variables, API keys, SSH keys, etc.\n'))

  const { manageSecrets } = await inquirer.prompt<{ manageSecrets: boolean }>([
    {
      type: 'confirm',
      name: 'manageSecrets',
      message: 'Do you want to manage secrets with this tool?',
      default: false,
    },
  ])

  if (!manageSecrets) {
    return {
      enabled: false,
    }
  }

  const { currentlyBackingUp } = await inquirer.prompt<{ currentlyBackingUp: boolean }>([
    {
      type: 'confirm',
      name: 'currentlyBackingUp',
      message: 'Do you currently backup your secrets?',
      default: false,
    },
  ])

  // Show available options
  const { storageCategory } = await inquirer.prompt<{ storageCategory: SecretStorageCategory }>([
    {
      type: 'list',
      name: 'storageCategory',
      message: currentlyBackingUp
        ? 'Which approach do you currently use to manage secrets?'
        : 'Which approach would you like to use to manage secrets?',
      choices: [
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
      ],
    },
  ])

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
function displaySummary(config: SetupConfig) {
  console.log(chalk.green('\n' + '='.repeat(70)))
  console.log(chalk.green.bold('  CONFIGURATION SUMMARY'))
  console.log(chalk.green('='.repeat(70) + '\n'))

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
 * Save configuration to file
 */
async function saveConfiguration(config: SetupConfig) {
  const configPath = path.join(process.cwd(), '.backup-config.json')

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    console.log(chalk.green(`✅ Configuration saved to ${configPath}\n`))
  } catch (error) {
    console.error(chalk.red('❌ Failed to save configuration:'), error)
    process.exit(1)
  }
}

/**
 * Display next steps
 */
function displayNextSteps(config: SetupConfig) {
  console.log(chalk.cyan.bold('NEXT STEPS:\n'))

  console.log(chalk.white('1. Review your configuration in .backup-config.json'))
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

  console.log(chalk.cyan('='.repeat(70) + '\n'))
}

/**
 * Main setup function
 */
export default async function setup() {
  displayWelcome()

  const config: SetupConfig = {
    os: await promptOperatingSystem(),
    configFiles: await promptConfigFileStorage(),
    secrets: await promptSecretStorage(),
  }

  displaySummary(config)

  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.bold('Save this configuration?'),
      default: true,
    },
  ])

  if (!confirm) {
    console.log(chalk.yellow('\n⚠️  Setup cancelled. Run this script again to configure.\n'))
    process.exit(0)
  }

  await saveConfiguration(config)
  displayNextSteps(config)
}
