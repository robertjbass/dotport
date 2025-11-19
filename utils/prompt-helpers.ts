/**
 * Prompt & UI Utilities
 *
 * Reusable UI components and prompt helpers for interactive CLI workflows.
 * Provides consistent styling and navigation patterns across all prompts.
 */

import chalk from 'chalk'
import inquirer from 'inquirer'

/**
 * Special symbol to indicate user wants to go back
 */
export const BACK_OPTION = Symbol('back')

/**
 * Display a welcome banner for the CLI
 *
 * @param title - Main title text
 * @param subtitle - Subtitle text (optional)
 * @param clearScreen - Whether to clear the screen first (default: true)
 */
export function displayWelcome(
  title: string,
  subtitle?: string,
  clearScreen = true,
): void {
  if (clearScreen) {
    console.clear()
  }

  const borderLength = Math.max(20, title.length + 4)
  console.log(chalk.cyan.bold('\n' + '='.repeat(borderLength)))
  console.log(chalk.cyan.bold('  ' + title))
  console.log(chalk.cyan.bold('='.repeat(borderLength)))

  if (subtitle) {
    console.log(chalk.gray('\n' + subtitle + '\n'))
  }
}

/**
 * Display step progress indicator
 *
 * @param currentStep - Current step number (1-indexed)
 * @param totalSteps - Total number of steps
 * @param stepName - Name of current step
 */
export function displayStepProgress(
  currentStep: number,
  totalSteps: number,
  stepName: string,
): void {
  const percentage = Math.round((currentStep / totalSteps) * 100)
  const progressBarLength = 20
  const filledLength = Math.round(
    (progressBarLength * currentStep) / totalSteps,
  )
  const emptyLength = Math.max(0, progressBarLength - filledLength)
  const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength)

  const boxWidth = 38
  console.log(chalk.cyan(`\n┌${'─'.repeat(boxWidth)}┐`))

  // Calculate spacing for step line, ensuring it's never negative
  const stepLineSpacing = Math.max(
    0,
    boxWidth - 12 - stepName.length - String(currentStep).length - String(totalSteps).length,
  )
  console.log(
    chalk.cyan(
      `│ Step ${currentStep} of ${totalSteps}: ${stepName}${' '.repeat(stepLineSpacing)}│`,
    ),
  )

  // Calculate spacing for progress line, ensuring it's never negative
  const progressLineSpacing = Math.max(
    0,
    boxWidth - 12 - progressBarLength - String(percentage).length - 1,
  )
  console.log(
    chalk.cyan(
      `│ Progress: ${progressBar} ${percentage}%${' '.repeat(progressLineSpacing)}│`,
    ),
  )
  console.log(chalk.cyan(`└${'─'.repeat(boxWidth)}┘`))
}

/**
 * Display a section divider
 *
 * @param length - Length of divider (default: 50)
 * @param char - Character to use for divider (default: '─')
 */
export function displayDivider(length = 50, char = '─'): void {
  console.log(chalk.cyan(char.repeat(length)))
}

/**
 * Display a summary section
 *
 * @param title - Section title
 * @param items - Key-value pairs to display
 */
export function displaySummarySection(
  title: string,
  items: Record<string, string | boolean | undefined>,
): void {
  console.log(chalk.bold(title + ':'))

  Object.entries(items).forEach(([key, value]) => {
    if (value !== undefined) {
      const displayValue = typeof value === 'boolean'
        ? (value ? 'Yes' : 'No')
        : value
      console.log(`  ${key}: ${displayValue}`)
    }
  })

  console.log()
}

/**
 * Create a confirmation prompt with optional back navigation
 *
 * @param message - Question to ask user
 * @param defaultValue - Default answer (default: true)
 * @param showBack - Whether to show back option (default: false)
 * @returns User's response or BACK_OPTION symbol
 */
export async function confirmAction(
  message: string,
  defaultValue = true,
  showBack = false,
): Promise<boolean | typeof BACK_OPTION> {
  const choices: any[] = [
    { name: 'Yes', value: 'yes' },
    { name: 'No', value: 'no' },
  ]

  if (showBack) {
    choices.push(new inquirer.Separator())
    choices.push({ name: '← Go back', value: 'back' })
  }

  const { answer } = await inquirer.prompt<{ answer: string }>([
    {
      type: 'list',
      name: 'answer',
      message,
      choices,
      default: defaultValue ? 'yes' : 'no',
    },
  ])

  if (answer === 'back') return BACK_OPTION
  return answer === 'yes'
}

/**
 * Create a list selection prompt with optional back navigation
 *
 * @param message - Question to ask user
 * @param choices - Array of choices (can be strings or {name, value} objects)
 * @param showBack - Whether to show back option (default: false)
 * @returns Selected value or BACK_OPTION symbol
 */
export async function selectFromList<T = string>(
  message: string,
  choices: Array<string | { name: string; value: T }>,
  showBack = false,
): Promise<T | typeof BACK_OPTION> {
  const promptChoices: any[] = [...choices]

  if (showBack) {
    promptChoices.push(new inquirer.Separator())
    promptChoices.push({ name: '← Go back', value: 'back' })
  }

  const { answer } = await inquirer.prompt<{ answer: T | 'back' }>([
    {
      type: 'list',
      name: 'answer',
      message,
      choices: promptChoices,
    },
  ])

  if (answer === 'back') return BACK_OPTION
  return answer as T
}

/**
 * Create a multi-select checkbox prompt
 *
 * @param message - Question to ask user
 * @param choices - Array of choices with optional checked state
 * @param options - Additional options
 * @returns Array of selected values
 */
export async function selectMultiple<T = string>(
  message: string,
  choices: Array<{
    name: string
    value: T
    checked?: boolean
  }>,
  options: {
    pageSize?: number
    validate?: (input: T[]) => string | true
  } = {},
): Promise<T[]> {
  const { pageSize = 15, validate } = options

  const { answer } = await inquirer.prompt<{ answer: T[] }>([
    {
      type: 'checkbox',
      name: 'answer',
      message,
      choices,
      pageSize,
      validate,
    },
  ])

  return answer
}

/**
 * Prompt for text input with validation and optional back navigation
 *
 * @param message - Question to ask user
 * @param options - Input options
 * @returns User input or undefined if back selected
 */
export async function promptInput(
  message: string,
  options: {
    defaultValue?: string
    validate?: (input: string) => string | true
    transformer?: (input: string) => string
    showBack?: boolean
  } = {},
): Promise<string | undefined> {
  const { defaultValue, validate, transformer, showBack = false } = options

  // If showBack is true, we need to add a separate "back" prompt choice
  // However, input prompts don't support back navigation natively
  // So we'll just return the input directly
  const { answer } = await inquirer.prompt<{ answer: string }>([
    {
      type: 'input',
      name: 'answer',
      message,
      default: defaultValue,
      validate,
      transformer,
    },
  ])

  return answer
}

/**
 * Display an error message
 *
 * @param message - Error message
 * @param details - Optional error details
 */
export function displayError(message: string, details?: string): void {
  console.log(chalk.red(`\n❌ ${message}`))
  if (details) {
    console.log(chalk.gray(`   ${details}`))
  }
  console.log()
}

/**
 * Display a success message
 *
 * @param message - Success message
 * @param details - Optional additional details
 */
export function displaySuccess(message: string, details?: string): void {
  console.log(chalk.green(`\n✅ ${message}`))
  if (details) {
    console.log(chalk.gray(`   ${details}`))
  }
  console.log()
}

/**
 * Display a warning message
 *
 * @param message - Warning message
 * @param details - Optional additional details
 */
export function displayWarning(message: string, details?: string): void {
  console.log(chalk.yellow(`\n⚠️  ${message}`))
  if (details) {
    console.log(chalk.gray(`   ${details}`))
  }
  console.log()
}

/**
 * Display an info message
 *
 * @param message - Info message
 * @param details - Optional additional details
 */
export function displayInfo(message: string, details?: string): void {
  console.log(chalk.cyan(`\nℹ️  ${message}`))
  if (details) {
    console.log(chalk.gray(`   ${details}`))
  }
  console.log()
}

/**
 * Create a grouped choice list with separators
 *
 * @param groups - Array of groups, each with a label and choices
 * @returns Flat array of choices with separators
 */
export function createGroupedChoices<T>(
  groups: Array<{
    label: string
    choices: Array<{ name: string; value: T }>
  }>,
): any[] {
  const result: any[] = []

  groups.forEach((group, index) => {
    if (index > 0) {
      result.push(new inquirer.Separator())
    }
    result.push(new inquirer.Separator(chalk.cyan(`── ${group.label} ──`)))
    result.push(...group.choices)
  })

  return result
}
