#!/usr/bin/env node

import path from 'path'
import { fileURLToPath } from 'url'
import ScriptSession from '../clients/script-session'
import fs from 'fs'
import chalk from 'chalk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default async function createScript() {
  const args = ScriptSession.args
  const scriptName = args?.join('-')
  if (!scriptName) {
    console.log(chalk.red('Please provide a script name'))
    return
  }

  const scriptNameKebab = scriptName
    .replace(/ /g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase()
  const scriptNameCamel = scriptName
    .split('-')
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '')

  const scriptFileName = `${scriptNameKebab}.ts`
  const scriptFilePath = path.join(__dirname, scriptFileName)
  const scriptFunctionName = `${scriptNameCamel}`

  // Check if script already exists
  if (fs.existsSync(scriptFilePath)) {
    console.log(chalk.red(`\n❌ Script already exists: ${scriptFileName}`))
    console.log(chalk.gray(`   Path: scripts/${scriptFileName}`))
    return
  }

  const fileContents = `#!/usr/bin/env node

import ScriptSession from '../clients/script-session'

export default async function ${scriptFunctionName}() {
  console.log('created with pnpm new-script. Access script session information with ScriptSession:', {
    session: ScriptSession,
  })
}`

  fs.writeFileSync(scriptFilePath, fileContents)

  // read package.json
  const packageJsonPath = path.join(__dirname, '../package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

  // add script to package.json
  packageJson.scripts[`script:${scriptNameKebab}`] =
    `pnpm script ${scriptNameKebab}`

  // write package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

  console.log(chalk.green(`\n✅ Created script: ${scriptFileName}`))
  console.log(chalk.gray(`   Path: scripts/${scriptFileName}`))
  console.log(chalk.cyan(`\n   Run with: pnpm script:${scriptNameKebab}`))
  console.log(
    chalk.yellow(
      `\n   Update scripts/index.ts -> SCRIPT_METADATA to customize how the script appears in the list\n`,
    ),
  )
}
