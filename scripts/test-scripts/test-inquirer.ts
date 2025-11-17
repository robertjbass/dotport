#!/usr/bin/env node

import inquirer from 'inquirer'

async function test() {
  console.log('Testing inquirer prompts...\n')

  const { answer1 } = await inquirer.prompt([
    {
      type: 'list',
      name: 'answer1',
      message: 'Test question 1 - Can you see these choices?',
      choices: [
        { name: 'Option A', value: 'a' },
        { name: 'Option B', value: 'b' },
        { name: 'Option C', value: 'c' },
      ],
    },
  ])

  console.log(`\nYou selected: ${answer1}\n`)

  const { answer2 } = await inquirer.prompt([
    {
      type: 'list',
      name: 'answer2',
      message: 'Test question 2 - Simple list',
      choices: ['First', 'Second', 'Third'],
    },
  ])

  console.log(`\nYou selected: ${answer2}\n`)
}

test().catch(console.error)
