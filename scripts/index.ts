#!/usr/bin/env node

import fs from 'fs'
import ScriptSession from '../clients/script-session'

async function main() {
  switch (ScriptSession.operatingSystem) {
    case 'darwin':
      console.log('Using macOS')
      break
    case 'linux':
      console.log('Using Linux')
      break
    case 'win32':
      console.log('Windows is not yet supported')
      process.exit(1)
    default:
      console.log('Unsupported operating system')
      process.exit(1)
  }

  const scriptFiles = fs
    .readdirSync('./scripts')
    .map((file) => file.replace('.ts', ''))
    .filter((file) => file !== 'index')

  if (!ScriptSession.script || !scriptFiles.includes(ScriptSession.script)) {
    console.log(`Script ${ScriptSession.script} not found`)
    console.log(`Available scripts: ${scriptFiles.join(', ')}`)

    process.exit(1)
  }

  const scriptFunction = (await import(`./${ScriptSession.script}.ts`)).default
  await scriptFunction()
}

try {
  await main()
} catch (error) {
  console.error(error)
  process.exit(1)
}
