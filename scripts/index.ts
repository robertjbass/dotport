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
  setup: {
    name: 'Setup',
    description: 'Interactive setup wizard for backup configuration',
    emoji: '⚙️',
  },
  init: {
    name: 'Init',
    description: 'Initialize the backup system (development)',
    emoji: '🚀',
  },
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
    const metadata = SCRIPT_METADATA[script] || {
      name: script,
      description: 'No description available',
      emoji: '📄',
    }

    return {
      name: `${metadata.emoji}  ${chalk.white(metadata.name)} - ${chalk.gray(metadata.description)}`,
      value: script,
      short: metadata.name,
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

  // Get available scripts
  const scriptFiles = fs
    .readdirSync(path.join(process.cwd(), 'scripts'))
    .filter((file) => file.endsWith('.ts'))
    .map((file) => file.replace('.ts', ''))
    .filter((file) => file !== 'index')
    .sort()

  // If script provided as argument, run it directly
  if (ScriptSession.script) {
    if (!scriptFiles.includes(ScriptSession.script)) {
      console.log(
        chalk.red(`\n❌ Script "${ScriptSession.script}" not found\n`),
      )
      console.log(chalk.white('Available scripts:'))
      scriptFiles.forEach((script) => {
        const metadata = SCRIPT_METADATA[script]
        if (metadata) {
          console.log(chalk.gray(`  - ${script}: ${metadata.description}`))
        } else {
          console.log(chalk.gray(`  - ${script}`))
        }
      })
      console.log()
      process.exit(1)
    }

    const scriptFunction = (await import(`./${ScriptSession.script}.ts`))
      .default
    await scriptFunction()
    return
  }

  // No script provided - show interactive menu
  try {
    const selectedScript = await selectScript(scriptFiles)

    if (selectedScript === 'exit') {
      console.log(chalk.yellow('\n👋 Goodbye!\n'))
      process.exit(0)
    }

    console.clear()
    const scriptFunction = (await import(`./${selectedScript}.ts`)).default
    await scriptFunction()
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
