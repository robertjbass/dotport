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

import { ensureDotPortDirectories } from '../utils/directory-manager'
import { checkAndMigrateIfNeeded } from '../utils/config-migration'
import {
  getOrCreateUserSystemConfig,
  writeUserSystemConfig,
  updateRepoInfo,
} from '../utils/user-system-config'
import {
  generateMachineId,
  getShellConfigFile,
} from '../utils/system-detection'
import {
  promptStep1SystemDetection,
  promptStep2GitHubAuth,
  promptStep3RepoSetup,
  promptStep4SecretConfig,
} from '../utils/backup-prompts'
import { authenticateWithGitHub } from '../utils/github-auth'
import { createRepository } from '../utils/github-repo'
import {
  getExistingFiles,
  groupFilesByCategory,
  formatFileForDisplay,
  getCategoryDisplayName,
  type DiscoveredFile,
} from '../utils/file-discovery'
import { backupFilesToRepo } from '../utils/file-backup'
import {
  detectPackageManagers,
  createPackageManager,
} from '../utils/package-detection'
import {
  detectInstalledEditors,
  createEditorExtensions,
  exportExtensionsToFile,
} from '../utils/editor-detection'
import { detectAllRuntimes } from '../utils/runtime-detection'
import { exportSchemaToRepo, createSchemaReadme } from '../utils/schema-export'
import { exportGnomeSettings } from '../utils/dconf-export'
import { scanFile, isKnownSecretFile } from '../utils/secret-scanner'
import {
  parseEnvToShellExports,
  parseJsonToShellExports,
  createOrUpdateEnvShFile,
  addToGitignore,
  isSourcedInRcFile,
  addSourceToRcFile,
  getRcFilePath,
} from '../utils/secret-file-helpers'
import type {
  TrackedFile,
  PackageManager,
  EditorExtensions,
} from '../types/backup-config'
import { expandTilde, isGitRepository } from '../utils/path-helpers'
import { displayWelcome, displayStepProgress } from '../utils/prompt-helpers'
import {
  stageAllChanges,
  createGitCommit,
  pushToRemote,
  getCurrentBranch,
  getAllBranches,
  checkoutBranch,
  pullFromRemote,
} from '../utils/git-operations'
import { buildBackupConfig } from '../utils/schema-builder'

/**
 * Main backup function
 */
export default async function backupV2() {
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
      nickname,
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
      } catch (error: any) {
        console.log(
          chalk.yellow(
            '\n⚠️  GitHub authentication failed. Continuing with local backup only.\n',
          ),
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

    // Determine repo URL based on scenario
    let repoUrl = ''
    if (step3.createGitHubRepo && octokit) {
      // Creating new GitHub repo
      repoUrl = `https://github.com/${githubUsername}/${step3.repoName}.git`
    } else if (step3.scenario === 'existing-remote') {
      // Existing GitHub repo
      repoUrl = `https://github.com/${githubUsername}/${step3.repoName}.git`
    } else if (
      step3.scenario === 'existing-local' &&
      isGitRepository(repoPath)
    ) {
      // Try to detect remote URL from existing git repo
      try {
        const remoteUrl = require('child_process')
          .execSync('git config --get remote.origin.url', {
            cwd: repoPath,
            encoding: 'utf-8',
          })
          .trim()
        repoUrl = remoteUrl
      } catch {
        // No remote configured
        repoUrl = ''
      }
    }

    // Fallback: If we still don't have a URL but we have GitHub auth and repo info, construct it
    if (!repoUrl && useGitHub && githubUsername && step3.repoName) {
      repoUrl = `https://github.com/${githubUsername}/${step3.repoName}.git`
    }

    // Update user config with repo info
    updateRepoInfo({
      repoType: useGitHub ? 'github' : 'none',
      repoName: step3.repoName,
      repoUrl,
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
        console.log(
          chalk.green(`\n✅ Created repository directory: ${repoPath}\n`),
        )
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
            console.log(
              chalk.green(`✅ Created GitHub repository: ${result.httpsUrl}\n`),
            )
            // Set remote
            require('child_process').execSync(
              `git remote add origin ${result.httpsUrl}`,
              { cwd: repoPath },
            )
          }
        } catch (error: any) {
          console.log(
            chalk.yellow(
              `⚠️  Could not create GitHub repo: ${error.message}\n`,
            ),
          )
        }
      }
    }

    // ========================================================================
    // STEP 4: Secret File Configuration
    // ========================================================================
    console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))

    const step4 = await promptStep4SecretConfig()

    // Track all secret files we need to add to .gitignore
    const secretFilesToIgnore: string[] = []

    if (step4.enabled && step4.secretFilePath) {
      const secretPath = expandTilde(step4.secretFilePath)
      const targetEnvShPath = expandTilde('~/.env.sh')

      if (step4.createNew) {
        // Create new secret file with default content
        const defaultContent = `# Secret environment variables
# This file contains sensitive data and should NOT be committed to version control
# Add your secrets here in the format: export MY_SECRET="value"

export EXAMPLE_SECRET="your-secret-here"
`
        fs.writeFileSync(secretPath, defaultContent, 'utf-8')
        console.log(
          chalk.green(`\n✅ Created secret file at ${step4.secretFilePath}\n`),
        )
        secretFilesToIgnore.push(step4.secretFilePath)
      } else if (step4.secretFileFormat && step4.secretFileFormat !== 'shell-export') {
        // Convert existing file to .env.sh format
        console.log(chalk.cyan(`\n🔄 Converting ${step4.secretFilePath} to ~/.env.sh format...\n`))

        try {
          const sourceContent = fs.readFileSync(secretPath, 'utf-8')
          let exports: string[] = []

          if (step4.secretFileFormat === 'dotenv') {
            exports = parseEnvToShellExports(sourceContent)
          } else if (step4.secretFileFormat === 'json') {
            exports = parseJsonToShellExports(sourceContent)
          }

          if (exports.length > 0) {
            createOrUpdateEnvShFile(targetEnvShPath, exports)
            console.log(chalk.green(`✅ Converted ${exports.length} environment variable(s) to ~/.env.sh\n`))
            secretFilesToIgnore.push(step4.secretFilePath)
            secretFilesToIgnore.push('~/.env.sh')
          } else {
            console.log(chalk.yellow('⚠️  No environment variables found to convert\n'))
          }
        } catch (error: any) {
          console.log(chalk.red(`❌ Failed to convert secret file: ${error.message}\n`))
        }
      } else {
        // Using existing .env.sh file as-is
        secretFilesToIgnore.push(step4.secretFilePath)
      }

      // Add secret file to home directory .gitignore
      const homeGitignorePath = '~/.gitignore'
      const secretFileName = path.basename(step4.secretFilePath)

      console.log(chalk.cyan('📝 Updating home directory .gitignore...\n'))
      addToGitignore(homeGitignorePath, secretFileName)
      console.log(chalk.green(`✅ Added ${secretFileName} to ~/.gitignore\n`))

      // Check if secret file is sourced in shell RC file
      const rcFilePath = getRcFilePath(systemInfo.shell)
      const rcFileExpanded = expandTilde(rcFilePath)

      if (fs.existsSync(rcFileExpanded)) {
        const secretFileToSource = step4.secretFileFormat === 'shell-export'
          ? step4.secretFilePath
          : '~/.env.sh'

        if (!isSourcedInRcFile(rcFilePath, secretFileToSource)) {
          console.log(chalk.cyan(`📝 Adding source statement to ${rcFilePath}...\n`))
          addSourceToRcFile(rcFilePath, secretFileToSource)
          console.log(chalk.green(`✅ Added source statement for ${secretFileToSource}\n`))
        } else {
          console.log(chalk.gray(`  ${secretFileToSource} is already sourced in ${rcFilePath}\n`))
        }
      }

      // Update user config with secret info
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

    console.log(chalk.gray('\n🔍 Scanning your system - please wait...\n'))

    // Detect existing files
    const existingFiles = getExistingFiles(systemInfo.os)
    console.log(chalk.green(`✓ Detected ${existingFiles.length} config files`))

    // Detect package managers
    const detectedPackageTypes = await detectPackageManagers(systemInfo.os)
    const detectedPackages: PackageManager[] = []
    for (const pmType of detectedPackageTypes) {
      const pm = await createPackageManager(pmType)
      detectedPackages.push(pm)
    }
    console.log(
      chalk.green(`✓ Detected ${detectedPackages.length} package managers`),
    )

    // Detect editors
    const detectedEditorTypes = await detectInstalledEditors(systemInfo.os)
    const detectedEditors: EditorExtensions[] = []
    for (const editorType of detectedEditorTypes) {
      const editor = await createEditorExtensions(
        editorType,
        systemInfo.os,
        machineId,
      )
      detectedEditors.push(editor)
    }
    console.log(chalk.green(`✓ Detected ${detectedEditors.length} editors`))

    // Detect runtimes
    const detectedRuntimes = await detectAllRuntimes()
    console.log(chalk.green(`✓ Detected ${detectedRuntimes.length} runtimes\n`))

    // File selection and confirmation loop
    let trackedFiles: TrackedFile[] = []
    let filesWithSecrets: string[] = []
    let proceed = 'no'

    while (proceed === 'no') {
      // Group files by category for display
      const grouped = groupFilesByCategory(existingFiles)
      const choices: any[] = []

      Array.from(grouped.entries()).forEach(([category, files]) => {
        choices.push(
          new inquirer.Separator(
            `\n=== ${getCategoryDisplayName(category)} ===`,
          ),
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
          message: `Select files to back up (${existingFiles.length} files detected)\n${chalk.gray('all files selected by default')}`,
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

      // Scan files for secrets
      console.log(chalk.cyan('🔐 Scanning files for secrets...\n'))
      filesWithSecrets = []

      for (const file of selectedFiles) {
        const absolutePath = expandTilde(file.relativePath)

        // Check if it's a known secret file
        if (isKnownSecretFile(file.relativePath)) {
          filesWithSecrets.push(file.relativePath)
          console.log(chalk.yellow(`  ⚠️  Excluding known secret file: ${file.relativePath}`))
          continue
        }

        // Scan file content for secrets
        if (!file.isDirectory) {
          const scanResult = scanFile(absolutePath)
          if (scanResult.containsSecrets) {
            filesWithSecrets.push(file.relativePath)
            console.log(chalk.yellow(`  ⚠️  Excluding file with secrets: ${file.relativePath}`))
          }
        }
      }

      if (filesWithSecrets.length > 0) {
        console.log(chalk.yellow(`\n⚠️  Excluded ${filesWithSecrets.length} file(s) containing secrets\n`))
      } else {
        console.log(chalk.green('✓ No secret files detected\n'))
      }

      // Convert to TrackedFile format, excluding files with secrets
      trackedFiles = selectedFiles
        .filter((file) => !filesWithSecrets.includes(file.relativePath))
        .map((file) => {
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
      console.log(
        chalk.white('Target directory: ') + chalk.cyan(machineId + '/'),
      )
      console.log()
      console.log(chalk.white('Files to backup:'))
      trackedFiles.slice(0, 5).forEach((file) => {
        console.log(chalk.gray(`  • ${file.name} → ${file.repoPath}`))
      })
      if (trackedFiles.length > 5) {
        console.log(
          chalk.gray(`  ... and ${trackedFiles.length - 5} more files`),
        )
      }
      console.log()

      // Show package managers
      if (detectedPackages.length > 0) {
        console.log(chalk.white('Package managers:'))
        detectedPackages.forEach((pm) => {
          const pkgCount = pm.packages?.length || 0
          console.log(chalk.gray(`  • ${pm.type}: ${pkgCount} packages`))
        })
        console.log()
      }

      // Show editors
      if (detectedEditors.length > 0) {
        console.log(chalk.white('Editor extensions:'))
        detectedEditors.forEach((editor) => {
          const extCount = editor.extensions?.length || 0
          console.log(
            chalk.gray(`  • ${editor.editor}: ${extCount} extensions`),
          )
        })
        console.log()
      }

      // Show runtimes
      if (detectedRuntimes.length > 0) {
        console.log(chalk.white('Runtime versions:'))
        detectedRuntimes.forEach((runtime) => {
          console.log(
            chalk.gray(
              `  • ${runtime.type}: ${runtime.defaultVersion} (${runtime.manager})`,
            ),
          )
        })
        console.log()
      }

      const result = await inquirer.prompt<{ proceed: string }>([
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

      proceed = result.proceed

      if (proceed === 'no') {
        console.clear()
        console.log(chalk.yellow('\n↩️  Going back to file selection...\n'))
      }
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

    // Export package manager data
    if (detectedPackages && detectedPackages.length > 0) {
      console.log(chalk.cyan('\n📦 Exporting package lists...\n'))
      const baseDir = path.join(repoPath, machineId)

      for (const pm of detectedPackages) {
        if (pm.exportPath) {
          const exportFilePath = path.join(baseDir, pm.exportPath)
          const exportDir = path.dirname(exportFilePath)

          // Ensure directory exists
          if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true, mode: 0o755 })
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
          } catch (error: any) {
            console.log(
              chalk.yellow(
                `  ⚠️  Could not export ${pm.type}: ${error.message}`,
              ),
            )
          }
        }
      }
    }

    // Export editor extensions
    if (detectedEditors && detectedEditors.length > 0) {
      console.log(chalk.cyan('\n🔌 Exporting editor extensions...\n'))
      const baseDir = path.join(repoPath, machineId)

      for (const editorExt of detectedEditors) {
        if (editorExt.exportPath) {
          const exportFilePath = path.join(baseDir, editorExt.exportPath)

          try {
            await exportExtensionsToFile(editorExt, exportFilePath)
            console.log(
              chalk.green(
                `  ✓ Exported ${editorExt.editor} extensions to ${editorExt.exportPath}`,
              ),
            )
          } catch (error: any) {
            console.log(
              chalk.yellow(
                `  ⚠️  Could not export ${editorExt.editor} extensions: ${error.message}`,
              ),
            )
          }
        }
      }
    }

    // Export runtime versions
    if (detectedRuntimes && detectedRuntimes.length > 0) {
      console.log(chalk.cyan('\n⚙️  Exporting runtime versions...\n'))
      const baseDir = path.join(repoPath, machineId)
      const runtimesFilePath = path.join(baseDir, '.config/runtimes.json')
      const runtimesDir = path.dirname(runtimesFilePath)

      // Ensure directory exists
      if (!fs.existsSync(runtimesDir)) {
        fs.mkdirSync(runtimesDir, { recursive: true, mode: 0o755 })
      }

      try {
        const runtimesData = {
          exportedAt: new Date().toISOString(),
          runtimes: detectedRuntimes,
        }
        fs.writeFileSync(
          runtimesFilePath,
          JSON.stringify(runtimesData, null, 2),
          'utf-8',
        )
        console.log(
          chalk.green(
            `  ✓ Exported runtime versions to .config/runtimes.json\n`,
          ),
        )
      } catch (error: any) {
        console.log(
          chalk.yellow(
            `  ⚠️  Could not export runtime versions: ${error.message}\n`,
          ),
        )
      }
    }

    // Export GNOME settings (Linux only)
    if (
      systemInfo.os === 'linux' &&
      systemInfo.desktopEnvironment === 'gnome'
    ) {
      const gnomeSettingsDir = path.join(
        repoPath,
        machineId,
        '.config',
        'dconf',
      )

      try {
        const dconfResult = await exportGnomeSettings(gnomeSettingsDir, {
          verbose: false, // We'll display our own messages
        })

        if (dconfResult.success && dconfResult.exportedPaths.length > 0) {
          console.log(chalk.cyan('\n⚙️  Exporting GNOME settings...\n'))
          console.log(
            chalk.green(
              `  ✓ Exported ${dconfResult.exportedPaths.length} GNOME settings (including keybindings)\n`,
            ),
          )
        } else if (dconfResult.errors.length > 0) {
          console.log(
            chalk.yellow('\n⚠️  Some GNOME settings could not be exported:'),
          )
          dconfResult.errors.forEach((err) => {
            console.log(chalk.gray(`     - ${err}`))
          })
        }
      } catch (error: any) {
        console.log(
          chalk.gray(`\n  ℹ️  GNOME settings export skipped: ${error.message}`),
        )
      }
    }

    // Export schema
    try {
      // Convert OS type for schema builder (macOS instead of macos)
      const setupOS =
        systemInfo.os === 'macos'
          ? 'macOS'
          : systemInfo.os === 'linux'
            ? 'linux'
            : 'windows'

      // Build backup config using schema builder
      const backupConfig = buildBackupConfig({
        os: setupOS as any,
        distro: systemInfo.distro,
        nickname,
        shell: systemInfo.shell,
        cloneLocation: step3.repoPath,
        repoType: useGitHub ? 'github' : 'none',
        repoName: step3.repoName,
        repoUrl, // Use the detected repoUrl from earlier
        repoOwner: githubUsername,
        branch: step3.branch,
        repoVisibility: 'private',
        trackedFiles,
        // Add system paths and runtime info from user config
        homeDirectory: systemInfo.homeDirectory,
        localRepoPath: step3.repoPath,
        runtimeData: systemInfo.runtimeData,
      })

      // Add package managers, editors, and runtimes to the backup config
      if (backupConfig.dotfiles[machineId]) {
        backupConfig.dotfiles[machineId].packages = {
          enabled: detectedPackages.length > 0,
          packageManagers: detectedPackages,
        }

        backupConfig.dotfiles[machineId].extensions = {
          enabled: detectedEditors.length > 0,
          editors: detectedEditors,
        }

        backupConfig.dotfiles[machineId].runtimes = {
          enabled: detectedRuntimes.length > 0,
          runtimes: detectedRuntimes,
        }

        // Add Linux-specific metadata if on Linux
        if (systemInfo.os === 'linux') {
          const systemMeta = backupConfig.systems.find(
            (s) => s.repoPath === machineId,
          )
          if (systemMeta && systemInfo.displayServer) {
            systemMeta.displayServer = systemInfo.displayServer
          }
          if (systemMeta && systemInfo.desktopEnvironment) {
            systemMeta.desktopEnvironment = systemInfo.desktopEnvironment
          }
        }
      }

      await exportSchemaToRepo(backupConfig, repoPath)
      await createSchemaReadme(repoPath)
      console.log(chalk.green('  • Schema updated\n'))
    } catch (error: any) {
      console.error(
        chalk.yellow(`⚠️  Schema export failed: ${error.message}\n`),
      )
    }

    // Add secret files to repo .gitignore
    if (filesWithSecrets.length > 0 || secretFilesToIgnore.length > 0) {
      console.log(chalk.cyan('📝 Updating repository .gitignore with secret files...\n'))

      const repoGitignorePath = path.join(repoPath, '.gitignore')
      const allSecretFiles = new Set([
        ...filesWithSecrets.map((f: string) => path.basename(f)),
        ...secretFilesToIgnore.map((f: string) => path.basename(expandTilde(f))),
      ])

      addToGitignore(repoGitignorePath, Array.from(allSecretFiles))
      console.log(chalk.green(`✅ Added ${allSecretFiles.size} secret file(s) to repository .gitignore\n`))
    }

    // Git operations (if applicable)
    let didCommit = false
    if (step3.isGitRepo && isGitRepository(repoPath)) {
      console.log(chalk.gray('It is recommended that you manually review the diff before pushing\n'))

      const { commitNow } = await inquirer.prompt<{ commitNow: string }>([
        {
          type: 'list',
          name: 'commitNow',
          message: useGitHub
            ? 'Commit and push changes to GitHub?'
            : 'Stage changes for commit?',
          choices: useGitHub
            ? [
                { name: "No, I'll commit manually later", value: 'no' },
                { name: 'Yes, commit and push now', value: 'yes' },
              ]
            : [
                { name: "No, I'll handle git manually", value: 'no' },
                { name: 'Yes, stage changes now', value: 'yes' },
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
          console.error(
            chalk.yellow(`\n⚠️  Git operations failed: ${error.message}\n`),
          )
        }
      }
    }

    // Final summary
    console.log(
      chalk.bold.green('\n┌──────────────────────────────────────────┐'),
    )
    console.log(
      chalk.bold.green('│          Backup Complete! 🎉             │'),
    )
    console.log(
      chalk.bold.green('└──────────────────────────────────────────┘\n'),
    )

    console.log(
      chalk.white('Your dotfiles have been backed up successfully.\n'),
    )
    console.log(chalk.white('Summary:'))
    console.log(chalk.gray(`  • Repository:        ${repoPath}`))
    console.log(chalk.gray(`  • Machine ID:        ${machineId}`))
    console.log(chalk.gray(`  • Files backed up:   ${trackedFiles.length}`))
    console.log(
      chalk.gray(
        `  • Packages exported: ${detectedPackages.length} package managers`,
      ),
    )
    console.log(
      chalk.gray(`  • Editors exported:  ${detectedEditors.length} editors`),
    )
    console.log(
      chalk.gray(`  • Committed to Git:  ${didCommit ? 'Yes' : 'No'}`),
    )
    console.log()
    console.log(
      chalk.white('Configuration saved to:'),
      chalk.cyan('~/.dotport/config/user-system.json'),
    )
    console.log()
    console.log(chalk.white('Next steps:'))
    console.log(chalk.hex('#FFA500')('  BETA - not yet available'))
    console.log(
      chalk.gray(
        "  • To restore on another machine: Run 'npx dotport restore'",
      ),
    )
    console.log(
      chalk.gray("  • To update this backup: Run 'npx dotport backup' again"),
    )
    console.log(
      chalk.gray(
        '  • To manage settings: Edit ~/.dotport/config/user-system.json',
      ),
    )
    console.log()
  } catch (error: any) {
    if (
      error?.name === 'ExitPromptError' ||
      error?.message?.includes('force closed')
    ) {
      console.log(chalk.yellow('\n\n⚠️  Backup cancelled.\n'))
      process.exit(0)
    }

    console.error(chalk.red('\n❌ An error occurred during backup:'))
    console.error(chalk.gray(error.message))
    console.error(error.stack)
    process.exit(1)
  }
}
