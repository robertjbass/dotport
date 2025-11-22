/**
 * Prompt Helpers - UI components and prompt helpers for interactive CLI
 */

import chalk from 'chalk'
import inquirer from 'inquirer'

export const BACK_OPTION = Symbol('back')

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

  const boxWidth = 45
  console.log(chalk.cyan(`\n┌${'─'.repeat(boxWidth)}┐`))

  // Calculate spacing for step line, ensuring it's never negative
  const stepLineSpacing = Math.max(
    0,
    boxWidth -
      12 -
      stepName.length -
      String(currentStep).length -
      String(totalSteps).length,
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

export function displayDivider(length = 50, char = '─'): void {
  console.log(chalk.cyan(char.repeat(length)))
}

export function displaySummarySection(
  title: string,
  items: Record<string, string | boolean | undefined>,
): void {
  console.log(chalk.bold(title + ':'))

  Object.entries(items).forEach(([key, value]) => {
    if (value !== undefined) {
      const displayValue =
        typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value
      console.log(`  ${key}: ${displayValue}`)
    }
  })

  console.log()
}

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

export async function promptInput(
  message: string,
  options: {
    defaultValue?: string
    validate?: (input: string) => string | true
    transformer?: (input: string) => string
    showBack?: boolean
  } = {},
): Promise<string | undefined> {
  const { defaultValue, validate, transformer } = options

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

export function displayError(message: string, details?: string): void {
  console.log(chalk.red(`\n❌ ${message}`))
  if (details) {
    console.log(chalk.gray(`   ${details}`))
  }
  console.log()
}

export function displaySuccess(message: string, details?: string): void {
  console.log(chalk.green(`\n✅ ${message}`))
  if (details) {
    console.log(chalk.gray(`   ${details}`))
  }
  console.log()
}

export function displayWarning(message: string, details?: string): void {
  console.log(chalk.yellow(`\n⚠️  ${message}`))
  if (details) {
    console.log(chalk.gray(`   ${details}`))
  }
  console.log()
}

export function displayInfo(message: string, details?: string): void {
  console.log(chalk.cyan(`\nℹ️  ${message}`))
  if (details) {
    console.log(chalk.gray(`   ${details}`))
  }
  console.log()
}

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

/**
 * Box row types for renderBox
 */
export type BoxRow =
  | { type: 'title'; text: string }
  | { type: 'divider' }
  | { type: 'text'; text: string; color?: 'cyan' | 'yellow' | 'gray' | 'white' }
  | {
      type: 'labeled'
      label: string
      value: string
      color?: 'cyan' | 'yellow' | 'gray' | 'white'
    }

/**
 * Renders a properly aligned box with dynamic width based on content.
 *
 * @param rows - Array of row definitions
 * @param options - Optional configuration
 * @returns void (prints to console)
 *
 * @example
 * renderBox([
 *   { type: 'title', text: '.bashrc' },
 *   { type: 'divider' },
 *   { type: 'labeled', label: 'Expected:', value: '/Users/bob/.bashrc' },
 *   { type: 'labeled', label: 'Backup:', value: '/path/to/backup/.bashrc' },
 *   { type: 'divider' },
 *   { type: 'text', text: 'TEST MODE', color: 'yellow' },
 *   { type: 'labeled', label: 'Actual:', value: '/Users/bob/backup-test', color: 'yellow' },
 * ])
 */
export function renderBox(
  rows: BoxRow[],
  options: {
    minWidth?: number
    borderColor?: 'cyan' | 'yellow' | 'gray' | 'white'
    padding?: number
  } = {},
): void {
  const { minWidth = 35, borderColor = 'cyan', padding = 1 } = options

  // Calculate the maximum content width
  let maxContentWidth = 0

  for (const row of rows) {
    let rowWidth = 0
    switch (row.type) {
      case 'title':
        rowWidth = row.text.length
        break
      case 'text':
        rowWidth = row.text.length
        break
      case 'labeled':
        // label + space + value
        rowWidth = row.label.length + 1 + row.value.length
        break
      case 'divider':
        // Dividers don't contribute to width calculation
        break
    }
    maxContentWidth = Math.max(maxContentWidth, rowWidth)
  }

  // Box width = content + left padding + right padding + 2 for borders
  const boxWidth = Math.max(minWidth, maxContentWidth + padding * 2)
  const totalWidth = boxWidth + 2 // +2 for left and right border characters

  // Get terminal width (default to 80 if not available)
  const terminalWidth = process.stdout.columns || 80

  // If box would be too wide, use borderless format
  if (totalWidth > terminalWidth) {
    renderBorderless(rows)
    return
  }

  const colorFn = chalk[borderColor]

  // Helper to pad a string to fill the box
  const padRight = (str: string, totalLen: number): string => {
    const spaces = Math.max(0, totalLen - str.length)
    return str + ' '.repeat(spaces)
  }

  // Print top border
  console.log(colorFn(`┌${'─'.repeat(boxWidth)}┐`))

  for (const row of rows) {
    switch (row.type) {
      case 'title': {
        const content = padRight(row.text, boxWidth - padding * 2)
        console.log(
          colorFn(`│${' '.repeat(padding)}`) +
            chalk.bold(content) +
            colorFn(`${' '.repeat(padding)}│`),
        )
        break
      }
      case 'divider': {
        console.log(colorFn(`├${'─'.repeat(boxWidth)}┤`))
        break
      }
      case 'text': {
        const content = padRight(row.text, boxWidth - padding * 2)
        const textColorFn = row.color ? chalk[row.color] : colorFn
        console.log(
          textColorFn(`│${' '.repeat(padding)}`) +
            chalk.bold(content) +
            textColorFn(`${' '.repeat(padding)}│`),
        )
        break
      }
      case 'labeled': {
        const labeledContent = `${chalk.gray(row.label)} ${row.value}`
        // For padding calculation, use raw text length (without ANSI codes)
        const rawLength = row.label.length + 1 + row.value.length
        const spaces = Math.max(0, boxWidth - padding * 2 - rawLength)
        const rowColorFn = row.color ? chalk[row.color] : colorFn
        console.log(
          rowColorFn(`│${' '.repeat(padding)}`) +
            labeledContent +
            ' '.repeat(spaces) +
            rowColorFn(`${' '.repeat(padding)}│`),
        )
        break
      }
    }
  }

  // Print bottom border
  console.log(colorFn(`└${'─'.repeat(boxWidth)}┘`))
}

/**
 * Renders content in a simple borderless format when terminal is too narrow.
 * Used as fallback by renderBox.
 */
function renderBorderless(rows: BoxRow[]): void {
  for (const row of rows) {
    switch (row.type) {
      case 'title':
        console.log(chalk.bold.cyan(row.text))
        break
      case 'divider':
        // Skip dividers in borderless mode
        break
      case 'text': {
        const textColorFn = row.color ? chalk[row.color] : chalk.cyan
        console.log(textColorFn.bold(row.text))
        break
      }
      case 'labeled': {
        const rowColorFn = row.color ? chalk[row.color] : chalk.white
        console.log(`${chalk.gray(row.label)} ${rowColorFn(row.value)}`)
        break
      }
    }
  }
}
