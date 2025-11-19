#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import inquirer from 'inquirer'
import chalk from 'chalk'
import ScriptSession from '../clients/script-session'

type ScriptInfo = {
  name: string
  description: string
  emoji: string
}

// Script metadata
const SCRIPT_METADATA: Record<string, ScriptInfo> = {
  backup: {
    name: 'Backup',
    description: 'Interactive backup wizard to save your system configuration',
    emoji: '💾',
  },
  'populate-backup-schema': {
    name: 'Populate Backup Schema',
    description: 'Scan and collect your system packages and configuration',
    emoji: '📦',
  },
  restore: {
    name: 'Restore',
    description: 'Interactive restore wizard to restore backed-up configuration',
    emoji: '♻️',
  },
  placeholder: {
    name: 'Placeholder',
    description: 'Example script template for creating new scripts',
    emoji: '📝',
  },
}

// Intelligent emoji assignment based on script name
function getEmojiForScript(scriptName: string): string {
  // Check for exact matches first
  if (SCRIPT_METADATA[scriptName]?.emoji) {
    return SCRIPT_METADATA[scriptName].emoji
  }

  // Substring matching for common patterns
  const name = scriptName.toLowerCase()

  if (name.includes('setup') || name.includes('init')) return '⚙️'
  if (name.includes('restore')) return '♻️'
  if (name.includes('backup') || name.includes('populate')) return '📦'
  if (name.includes('test')) return '🧪'
  if (name.includes('build')) return '🔨'
  if (name.includes('deploy')) return '🚀'
  if (name.includes('clean')) return '🧹'
  if (name.includes('install')) return '📥'
  if (name.includes('update') || name.includes('upgrade')) return '⬆️'
  if (name.includes('start') || name.includes('run')) return '▶️'
  if (name.includes('stop')) return '⏹️'
  if (name.includes('lint')) return '🔍'
  if (name.includes('format')) return '✨'
  if (name.includes('watch')) return '👀'
  if (name.includes('dev')) return '💻'
  if (name.includes('prod')) return '🏭'
  if (name.includes('debug')) return '🐛'
  if (name.includes('log')) return '📝'
  if (name.includes('check')) return '✅'
  if (name.includes('validate')) return '✔️'

  // Default
  return '📄'
}

// Get scripts from package.json
function getPackageJsonScripts(): string[] {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

    // Get all scripts that start with "script:"
    return Object.keys(packageJson.scripts || {})
      .filter(key => key.startsWith('script:'))
      .map(key => key.replace('script:', ''))
      .sort()
  } catch (error) {
    console.warn(chalk.yellow('⚠️  Could not read package.json scripts'))
    return []
  }
}

function displayWelcome() {
  console.clear()
  console.log(chalk.cyan.bold('\n' + '='.repeat(60)))
  console.log(chalk.cyan.bold('  Dev Machine Backup & Restore - Scripts'))
  console.log(chalk.cyan.bold('='.repeat(60)))
  console.log(chalk.gray('\nSelect a script to run:\n'))
}

async function selectScript(scriptFiles: string[]): Promise<string> {
  displayWelcome()

  const choices: any[] = scriptFiles.map((script) => {
    const metadata = SCRIPT_METADATA[script]
    const emoji = getEmojiForScript(script)

    // Use metadata if available, otherwise create a nice formatted name
    const name = metadata?.name || script.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')

    const description = metadata?.description || 'No description available'

    return {
      name: `${emoji}  ${chalk.white(name)} - ${chalk.gray(description)}`,
      value: script,
      short: name,
    }
  })

  choices.push(new inquirer.Separator())
  choices.push({
    name: chalk.gray('← Exit'),
    value: 'exit',
    short: 'Exit',
  })

  const { selectedScript } = await inquirer.prompt<{ selectedScript: string }>([
    {
      type: 'list',
      name: 'selectedScript',
      message: 'Which script would you like to run?',
      choices,
      pageSize: 10,
    },
  ])

  return selectedScript
}

async function main() {
  // Check operating system
  switch (ScriptSession.operatingSystem) {
    case 'darwin':
      // macOS - silently continue
      break
    case 'linux':
      // Linux - silently continue
      break
    case 'win32':
      console.log(chalk.red('❌ Windows is not yet supported'))
      process.exit(1)
      // eslint-disable-next-line no-fallthrough
    default:
      console.log(chalk.red('❌ Unsupported operating system'))
      process.exit(1)
  }

  // Get available scripts from files
  const scriptFiles = fs
    .readdirSync(path.join(process.cwd(), 'scripts'))
    .filter((file) => file.endsWith('.ts'))
    .map((file) => file.replace('.ts', ''))
    .filter((file) => file !== 'index')

  // Get scripts from package.json
  const packageScripts = getPackageJsonScripts()

  // Merge and deduplicate (file-based scripts take precedence)
  const allScripts = Array.from(new Set([...scriptFiles, ...packageScripts])).sort()

  // If script provided as argument, run it directly
  if (ScriptSession.script) {
    if (!allScripts.includes(ScriptSession.script)) {
      console.log(
        chalk.red(`\n❌ Script "${ScriptSession.script}" not found\n`),
      )
      console.log(chalk.white('Available scripts:'))
      allScripts.forEach((script) => {
        const metadata = SCRIPT_METADATA[script]
        const emoji = getEmojiForScript(script)
        if (metadata) {
          console.log(chalk.gray(`  ${emoji}  ${script}: ${metadata.description}`))
        } else {
          console.log(chalk.gray(`  ${emoji}  ${script}`))
        }
      })
      console.log()
      process.exit(1)
    }

    // Check if this is a file-based script or package.json script
    if (scriptFiles.includes(ScriptSession.script)) {
      const scriptFunction = (await import(`./${ScriptSession.script}.ts`))
        .default
      await scriptFunction()
    } else {
      // This is a package.json-only script, run it via pnpm
      console.log(chalk.cyan(`\n▶️  Running script:${ScriptSession.script}...\n`))
      const { execSync } = await import('child_process')
      execSync(`pnpm script:${ScriptSession.script}`, { stdio: 'inherit' })
    }
    return
  }

  // No script provided - show interactive menu
  try {
    const selectedScript = await selectScript(allScripts)

    if (selectedScript === 'exit') {
      console.log(chalk.yellow('\n👋 Goodbye!\n'))
      process.exit(0)
    }

    console.clear()

    // Check if this is a file-based script or package.json script
    if (scriptFiles.includes(selectedScript)) {
      const scriptFunction = (await import(`./${selectedScript}.ts`)).default
      await scriptFunction()
    } else {
      // This is a package.json-only script, run it via pnpm
      console.log(chalk.cyan(`\n▶️  Running script:${selectedScript}...\n`))
      const { execSync } = await import('child_process')
      execSync(`pnpm script:${selectedScript}`, { stdio: 'inherit' })
    }
  } catch (error: any) {
    if (
      error?.name === 'ExitPromptError' ||
      error?.message?.includes('force closed')
    ) {
      console.log(chalk.yellow('\n\n⚠️  Script selection cancelled.\n'))
      process.exit(0)
    }
    throw error
  }
}

try {
  await main()
} catch (error) {
  console.error(chalk.red('\n❌ An error occurred:'), error)
  process.exit(1)
}
