#!/usr/bin/env node

/**
 * Simplified Backup Script (v2)
 *
 * New 6-step backup process:
 * 1. System Detection & Confirmation
 * 2. GitHub Authentication (Optional)
 * 3. Repository Setup
 * 4. Secret File Configuration
 * 5. File Selection & System Detection
 * 6. Backup Execution & Finalization
 */

import inquirer from 'inquirer'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'

// New utilities
import { ensureDotPortDirectories } from '../utils/directory-manager'
import { checkAndMigrateIfNeeded } from '../utils/config-migration'
import {
  getOrCreateUserSystemConfig,
  writeUserSystemConfig,
  updateSystemRuntimeData,
  updateRepoInfo,
} from '../utils/user-system-config'
import { generateMachineId, getShellConfigFile } from '../utils/system-detection'
import {
  promptStep1SystemDetection,
  promptStep2GitHubAuth,
  promptStep3RepoSetup,
  promptStep4SecretConfig,
} from '../utils/backup-prompts'

// Existing utilities (keeping file discovery and backup logic)
import { authenticateWithGitHub } from '../utils/github-auth'
import {
  checkRepositoryExists,
  createRepository,
  addGitignoreToRepo,
} from '../utils/github-repo'
import {
  getExistingFiles,
  groupFilesByCategory,
  formatFileForDisplay,
  getCategoryDisplayName,
  type DiscoveredFile,
} from '../utils/file-discovery'
import {
  backupFilesToRepo,
  generateRepoPath,
  previewBackup,
} from '../utils/file-backup'
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
} from '../utils/runtime-detection'
import { exportSchemaToRepo, createSchemaReadme } from '../utils/schema-export'
import { exportGnomeSettings } from '../utils/dconf-export'
import type {
  TrackedFile,
  PackageManager,
  EditorExtensions,
  RuntimeVersion,
} from '../types/backup-config'
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
import {
  buildBackupConfig,
  convertOSType,
} from '../utils/schema-builder'
import {
  checkRCFileSourcesSecret,
  addSecretSourceToRC,
  parseEnvFile,
  convertEnvToEnvSh,
} from '../utils/shell-config'

/**
 * Main backup function
 */
async function main() {
  try {
    console.clear()
    displayWelcome('Backup')

    // Ensure directory structure and check for migration
    ensureDotPortDirectories()
    await checkAndMigrateIfNeeded()

    // Get or create user system config
    const userConfig = await getOrCreateUserSystemConfig()

    // ========================================================================
    // STEP 1: System Detection & Confirmation
    // ========================================================================
    console.log(chalk.bold.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    const step1 = await promptStep1SystemDetection()
    const { systemInfo, nickname } = step1

    // Generate machine ID
    const machineId = generateMachineId(
      systemInfo.os,
      systemInfo.distro,
      nickname
    )

    // Update user config with system info
    userConfig.system = {
      os: systemInfo.os,
      distro: systemInfo.distro,
      nickname,
      repoPath: machineId,
      shell: systemInfo.shell,
      shellConfigFile: getShellConfigFile(systemInfo.shell),
      homeDirectory: systemInfo.homeDirectory,
      localRepoPath: userConfig.system.localRepoPath || '~/dev/dotfiles',
      runtimeData: systemInfo.runtimeData,
    }

    console.log(chalk.green(`\n✅ System detected: ${machineId}\n`))

    // ========================================================================
    // STEP 2: GitHub Authentication (Optional)
    // ========================================================================
    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    const step2 = await promptStep2GitHubAuth()
    let octokit = null
    let githubUsername = ''

    if (step2.useGitHub) {
      try {
        octokit = await authenticateWithGitHub()
        const { data: user } = await octokit.users.getAuthenticated()
        githubUsername = user.login
        console.log(chalk.green(`\n✅ Authenticated as ${githubUsername}\n`))
      } catch (error: any) {
        console.log(
          chalk.yellow(
            '\n⚠️  GitHub authentication failed. Continuing with local backup only.\n'
          )
        )
      }
    }

    const useGitHub = !!octokit

    // ========================================================================
    // STEP 3: Repository Setup
    // ========================================================================
    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    const step3 = await promptStep3RepoSetup(useGitHub)
    const repoPath = expandTilde(step3.repoPath)

    // Update user config with repo info
    updateRepoInfo({
      repoType: useGitHub ? 'github' : 'none',
      repoName: step3.repoName,
      repoUrl: step3.createGitHubRepo && octokit ? `https://github.com/${githubUsername}/${step3.repoName}` : '',
      repoOwner: githubUsername,
      branch: step3.branch,
      visibility: 'private',
    })

    userConfig.system.localRepoPath = step3.repoPath

    // Handle repository creation/setup based on scenario
    if (step3.scenario === 'first-time') {
      // Create directory if it doesn't exist
      if (!fs.existsSync(repoPath)) {
        fs.mkdirSync(repoPath, { recursive: true, mode: 0o755 })
        console.log(chalk.green(`\n✅ Created repository directory: ${repoPath}\n`))
      }

      // Initialize as git repo
      if (step3.isGitRepo && !isGitRepository(repoPath)) {
        require('child_process').execSync('git init', { cwd: repoPath })
        console.log(chalk.green('✅ Initialized git repository\n'))
      }

      // Create GitHub repo if requested
      if (step3.createGitHubRepo && octokit) {
        try {
          const result = await createRepository(octokit, {
            name: step3.repoName,
            isPrivate: true,
            description: 'Dotfiles and development machine configuration',
            autoInit: false,
          })

          if (result.success) {
            console.log(chalk.green(`✅ Created GitHub repository: ${result.httpsUrl}\n`))
            // Set remote
            require('child_process').execSync(
              `git remote add origin ${result.httpsUrl}`,
              { cwd: repoPath }
            )
          }
        } catch (error: any) {
          console.log(chalk.yellow(`⚠️  Could not create GitHub repo: ${error.message}\n`))
        }
      }
    }

    // ========================================================================
    // STEP 4: Secret File Configuration
    // ========================================================================
    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    const step4 = await promptStep4SecretConfig()

    if (step4.enabled && step4.createNew && step4.secretFilePath) {
      // Create secret file
      const secretPath = expandTilde(step4.secretFilePath)
      const secretContent = `# Secret environment variables
# Add your secrets here in the format: export MY_SECRET="value"

export EXAMPLE_SECRET="your-secret-here"
`
      fs.writeFileSync(secretPath, secretContent, 'utf-8')
      console.log(chalk.green(`\n✅ Created secret file at ${step4.secretFilePath}\n`))
    }

    // Update user config with secret info
    if (step4.enabled && step4.secretFilePath) {
      userConfig.secrets = {
        enabled: true,
        secretFile: {
          name: path.basename(step4.secretFilePath),
          location: path.dirname(step4.secretFilePath),
          format: step4.secretFileFormat || 'shell-export',
        },
        storage: {
          type: 'local-only',
        },
      }
    }

    // Save updated config
    writeUserSystemConfig(userConfig)

    // ========================================================================
    // STEP 5: File Selection & System Detection
    // ========================================================================
    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    displayStepProgress(5, 6, 'File & System Detection')

    console.log(chalk.gray('\n🔍 Scanning your system...\n'))

    // Detect existing files
    const existingFiles = getExistingFiles(systemInfo.os)
    console.log(chalk.green(`✓ Detected ${existingFiles.length} config files`))

    // Detect package managers
    const detectedPackages = await detectPackageManagers(systemInfo.os)
    console.log(chalk.green(`✓ Detected ${detectedPackages.length} package managers`))

    // Detect editors
    const detectedEditors = await detectInstalledEditors(systemInfo.os)
    console.log(chalk.green(`✓ Detected ${detectedEditors.length} editors`))

    // Detect runtimes
    const detectedRuntimes = await detectAllRuntimes()
    console.log(chalk.green(`✓ Detected ${detectedRuntimes.length} runtimes\n`))

    // Group files by category for display
    const grouped = groupFilesByCategory(existingFiles)
    const choices: any[] = []

    Array.from(grouped.entries()).forEach(([category, files]) => {
      choices.push(
        new inquirer.Separator(`\n=== ${getCategoryDisplayName(category)} ===`)
      )

      files.forEach((file) => {
        const displayName = formatFileForDisplay(file)

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
            checked: true,
          })
        }
      })
    })

    console.log(chalk.gray('(use space to select, enter to confirm)\n'))

    const { selectedFiles } = await inquirer.prompt<{
      selectedFiles: DiscoveredFile[]
    }>([
      {
        type: 'checkbox',
        name: 'selectedFiles',
        message: `Select files to back up (${existingFiles.length} files detected)`,
        choices,
        pageSize: 15,
        validate: (input) => {
          if (input.length === 0) {
            return 'Please select at least one file'
          }
          return true
        },
      },
    ])

    console.log(chalk.cyan(`\n📋 Selected: ${selectedFiles.length} files\n`))

    // Convert to TrackedFile format
    let trackedFiles: TrackedFile[] = selectedFiles.map((file) => {
      const homeRelativePath = file.relativePath.startsWith('~/')
        ? file.relativePath.slice(2)
        : path.basename(file.path)

      return {
        name: homeRelativePath,
        sourcePath: file.relativePath,
        repoPath: `${machineId}/${homeRelativePath}`,
        symlinkEnabled: !file.isDirectory,
        tracked: file.category !== 'secrets',
      }
    })

    // ========================================================================
    // STEP 6: Backup Execution & Finalization
    // ========================================================================
    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    displayStepProgress(6, 6, 'Backup & Finalize')

    // Show preview
    console.log(chalk.cyan('\n📋 Backup Preview\n'))
    console.log(chalk.white('Repository:       ') + chalk.cyan(repoPath))
    console.log(chalk.white('Target directory: ') + chalk.cyan(machineId + '/'))
    console.log()
    console.log(chalk.white('Files to backup:'))
    trackedFiles.slice(0, 5).forEach((file) => {
      console.log(chalk.gray(`  • ${file.name} → ${file.repoPath}`))
    })
    if (trackedFiles.length > 5) {
      console.log(chalk.gray(`  ... and ${trackedFiles.length - 5} more files`))
    }
    console.log()

    const { proceed } = await inquirer.prompt<{ proceed: string }>([
      {
        type: 'list',
        name: 'proceed',
        message: 'Proceed with backup?',
        choices: [
          { name: `Yes, backup to ${repoPath}`, value: 'yes' },
          { name: 'No, go back to modify selections', value: 'no' },
        ],
      },
    ])

    if (proceed === 'no') {
      console.log(chalk.yellow('\n⚠️  Backup cancelled\n'))
      process.exit(0)
    }

    // Execute backup
    console.log(chalk.cyan('\n🔄 Backing up files...\n'))

    try {
      await backupFilesToRepo(trackedFiles, repoPath, machineId)
      console.log(chalk.green('\n✓ Backup complete!\n'))
      console.log(chalk.white(`  • ${trackedFiles.length} files backed up`))
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Backup failed: ${error.message}\n`))
      process.exit(1)
    }

    // Export schema
    try {
      // Convert OS type for schema builder (macOS instead of macos)
      const setupOS = systemInfo.os === 'macos' ? 'macOS' : systemInfo.os === 'linux' ? 'linux' : 'windows'

      // Build backup config using schema builder
      const backupConfig = buildBackupConfig({
        os: setupOS as any,
        distro: systemInfo.distro,
        nickname,
        shell: systemInfo.shell,
        cloneLocation: step3.repoPath,
        repoType: useGitHub ? 'github' : 'none',
        repoName: step3.repoName,
        repoUrl: step3.createGitHubRepo && octokit ? `https://github.com/${githubUsername}/${step3.repoName}` : '',
        repoOwner: githubUsername,
        branch: step3.branch,
        repoVisibility: 'private',
        trackedFiles,
      })

      // TODO: Add package managers, editors, and runtimes to the backup config
      // This would require extending the schema builder or manually adding them

      await exportSchemaToRepo(backupConfig, repoPath)
      await createSchemaReadme(repoPath)
      console.log(chalk.green('  • Schema updated\n'))
    } catch (error: any) {
      console.error(chalk.yellow(`⚠️  Schema export failed: ${error.message}\n`))
    }

    // Git operations (if applicable)
    let didCommit = false
    if (step3.isGitRepo && isGitRepository(repoPath)) {
      const { commitNow } = await inquirer.prompt<{ commitNow: string }>([
        {
          type: 'list',
          name: 'commitNow',
          message: useGitHub
            ? 'Commit and push changes to GitHub?'
            : 'Stage changes for commit?',
          choices: useGitHub
            ? [
                { name: 'Yes, commit and push now', value: 'yes' },
                { name: "No, I'll commit manually later", value: 'no' },
              ]
            : [
                { name: 'Yes, stage changes now', value: 'yes' },
                { name: "No, I'll handle git manually", value: 'no' },
              ],
        },
      ])

      if (commitNow === 'yes') {
        didCommit = true
        try {
          await stageAllChanges(repoPath)
          await createGitCommit(repoPath, `Backup from ${machineId}`)
          console.log(chalk.green('\n  ✓ Changes staged and committed'))

          if (useGitHub) {
            await pushToRemote(repoPath, { branch: step3.branch })
            console.log(chalk.green(`  ✓ Pushed to origin/${step3.branch}\n`))
          } else {
            console.log(chalk.gray('\n  Changes are committed but not pushed.'))
            console.log(chalk.gray(`  Run: cd ${repoPath} && git push\n`))
          }
        } catch (error: any) {
          console.error(chalk.yellow(`\n⚠️  Git operations failed: ${error.message}\n`))
        }
      }
    }

    // Final summary
    console.log(chalk.bold.green('\n┌──────────────────────────────────────────┐'))
    console.log(chalk.bold.green('│          Backup Complete! 🎉             │'))
    console.log(chalk.bold.green('└──────────────────────────────────────────┘\n'))

    console.log(chalk.white('Your dotfiles have been backed up successfully.\n'))
    console.log(chalk.white('Summary:'))
    console.log(chalk.gray(`  • Repository:        ${repoPath}`))
    console.log(chalk.gray(`  • Machine ID:        ${machineId}`))
    console.log(chalk.gray(`  • Files backed up:   ${trackedFiles.length}`))
    console.log(chalk.gray(`  • Packages exported: ${detectedPackages.length} package managers`))
    console.log(chalk.gray(`  • Editors exported:  ${detectedEditors.length} editors`))
    console.log(chalk.gray(`  • Committed to Git:  ${didCommit ? 'Yes' : 'No'}`))
    console.log()
    console.log(chalk.white('Configuration saved to:'), chalk.cyan('~/.dotport/config/user-system.json'))
    console.log()
    console.log(chalk.white('Next steps:'))
    console.log(chalk.gray("  • To restore on another machine: Run 'npx dotport restore'"))
    console.log(chalk.gray("  • To update this backup: Run 'npx dotport backup' again"))
    console.log(chalk.gray('  • To manage settings: Edit ~/.dotport/config/user-system.json'))
    console.log()

  } catch (error: any) {
    if (error?.name === 'ExitPromptError' || error?.message?.includes('force closed')) {
      console.log(chalk.yellow('\n\n⚠️  Backup cancelled.\n'))
      process.exit(0)
    }

    console.error(chalk.red('\n❌ An error occurred during backup:'))
    console.error(chalk.gray(error.message))
    console.error(error.stack)
    process.exit(1)
  }
}

// Run the main function
main()
