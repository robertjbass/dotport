/**
 * Dry Run Integration Tests
 *
 * Tests the complete backup flow using temporary repositories
 * without creating actual remote GitHub repositories
 */

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'
import { backupFilesToRepo } from '../utils/file-backup'
import { exportSchemaToRepo } from '../utils/schema-export'
import type { TrackedFile, BackupConfig } from '../types/backup-config'

const execPromise = promisify(exec)

describe('Dry Run - Full Backup Flow', () => {
  let testDir: string
  let homeDir: string
  let repoDir: string
  let testFiles: Map<string, string>

  before(async () => {
    // Create temporary directories
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dry-run-test-'))
    homeDir = path.join(testDir, 'home')
    repoDir = path.join(testDir, 'dotfiles-test')

    fs.mkdirSync(homeDir, { recursive: true })
    fs.mkdirSync(repoDir, { recursive: true })

    // Initialize git repository
    await execPromise('git init', { cwd: repoDir })
    await execPromise('git config user.email "test@example.com"', {
      cwd: repoDir,
    })
    await execPromise('git config user.name "Test User"', { cwd: repoDir })

    // Create test dotfiles in fake home directory
    testFiles = new Map()

    const dotfiles = [
      {
        name: '.zshrc',
        content: '# Zsh configuration\nexport PATH=$HOME/bin:$PATH',
      },
      {
        name: '.gitconfig',
        content: '[user]\n\tname = Test User\n\temail = test@example.com',
      },
      { name: '.vimrc', content: 'set number\nset tabstop=2' },
    ]

    dotfiles.forEach(({ name, content }) => {
      const filePath = path.join(homeDir, name)
      fs.writeFileSync(filePath, content)
      testFiles.set(name, filePath)
    })

    // Create a nested config file
    const nvimDir = path.join(homeDir, '.config', 'nvim')
    fs.mkdirSync(nvimDir, { recursive: true })
    const initVim = path.join(nvimDir, 'init.vim')
    fs.writeFileSync(initVim, 'syntax on\nset number')
    testFiles.set('.config/nvim/init.vim', initVim)
  })

  after(() => {
    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true })
  })

  it('should backup files to temporary repository', async () => {
    const trackedFiles: TrackedFile[] = [
      {
        name: '.zshrc',
        sourcePath: testFiles.get('.zshrc')!,
        repoPath: 'macos/.zshrc',
        symlinkEnabled: true,
        tracked: true,
      },
      {
        name: '.gitconfig',
        sourcePath: testFiles.get('.gitconfig')!,
        repoPath: 'macos/.gitconfig',
        symlinkEnabled: true,
        tracked: true,
      },
    ]

    const result = await backupFilesToRepo(trackedFiles, repoDir, 'macos', {
      verbose: false,
    })

    assert.strictEqual(result.success, true, 'Backup should succeed')
    assert.strictEqual(result.backedUpCount, 2, 'Should backup 2 files')
    assert.strictEqual(result.errors.length, 0, 'Should have no errors')

    // Verify files exist in repo
    assert.ok(
      fs.existsSync(path.join(repoDir, 'macos', '.zshrc')),
      '.zshrc should be in repo',
    )
    assert.ok(
      fs.existsSync(path.join(repoDir, 'macos', '.gitconfig')),
      '.gitconfig should be in repo',
    )
  })

  it('should preserve directory structure', async () => {
    const trackedFiles: TrackedFile[] = [
      {
        name: '.config/nvim/init.vim',
        sourcePath: testFiles.get('.config/nvim/init.vim')!,
        repoPath: 'macos/.config/nvim/init.vim',
        symlinkEnabled: false,
        tracked: true,
      },
    ]

    const result = await backupFilesToRepo(trackedFiles, repoDir, 'macos', {
      verbose: false,
    })

    assert.strictEqual(result.success, true, 'Backup should succeed')

    const nestedFile = path.join(
      repoDir,
      'macos',
      '.config',
      'nvim',
      'init.vim',
    )
    assert.ok(
      fs.existsSync(nestedFile),
      'Nested file should exist in correct directory structure',
    )
  })

  it('should export schema to repository', async () => {
    const backupConfig: Partial<BackupConfig> = {
      version: '1.0.0',
      systems: [
        {
          os: 'macos',
          distro: 'darwin',
          nickname: 'test-machine',
          repoPath: 'macos-darwin-test-machine',
          shell: 'zsh',
          shellConfigFile: '.zshrc',
        },
      ],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }

    const result = await exportSchemaToRepo(
      backupConfig as BackupConfig,
      repoDir,
      { verbose: false },
    )

    assert.strictEqual(result.success, true, 'Schema export should succeed')

    const schemaPath = path.join(repoDir, 'schema.json')
    assert.ok(fs.existsSync(schemaPath), 'Schema file should exist')

    // Verify schema content
    const schemaContent = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'))
    assert.strictEqual(
      schemaContent.version,
      '1.0.0',
      'Schema should have correct version',
    )
  })

  it('should create git commits', async () => {
    // Stage and commit files
    await execPromise('git add .', { cwd: repoDir })
    await execPromise('git commit -m "Test backup"', { cwd: repoDir })

    // Verify commit was created
    const { stdout } = await execPromise('git log --oneline', { cwd: repoDir })
    assert.ok(stdout.includes('Test backup'), 'Commit should exist')
  })

  it('should handle missing source files gracefully', async () => {
    const trackedFiles: TrackedFile[] = [
      {
        name: '.nonexistent',
        sourcePath: path.join(homeDir, '.nonexistent'),
        repoPath: 'macos/.nonexistent',
        symlinkEnabled: true,
        tracked: true,
      },
    ]

    const result = await backupFilesToRepo(trackedFiles, repoDir, 'macos', {
      verbose: false,
    })

    assert.strictEqual(
      result.success,
      true,
      'Should complete even with missing files',
    )
    assert.strictEqual(
      result.backedUpCount,
      0,
      'Should not backup missing files',
    )
    assert.ok(result.errors.length > 0, 'Should have errors for missing files')
  })

  it('should detect and skip SSH keys', async () => {
    // Create fake SSH directory
    const sshDir = path.join(homeDir, '.ssh')
    fs.mkdirSync(sshDir, { recursive: true })

    const privateKey = path.join(sshDir, 'id_rsa')
    fs.writeFileSync(
      privateKey,
      '-----BEGIN RSA PRIVATE KEY-----\nfake key content',
    )

    const sshConfig = path.join(sshDir, 'config')
    fs.writeFileSync(sshConfig, 'Host github.com\n  IdentityFile ~/.ssh/id_rsa')

    const trackedFiles: TrackedFile[] = [
      {
        name: '.ssh/id_rsa',
        sourcePath: privateKey,
        repoPath: 'macos/.ssh/id_rsa',
        symlinkEnabled: false,
        tracked: true,
      },
      {
        name: '.ssh/config',
        sourcePath: sshConfig,
        repoPath: 'macos/.ssh/config',
        symlinkEnabled: true,
        tracked: true,
      },
    ]

    await backupFilesToRepo(trackedFiles, repoDir, 'macos', {
      verbose: false,
    })

    // SSH keys should be skipped, but config should be backed up
    const backedUpKey = fs.existsSync(
      path.join(repoDir, 'macos', '.ssh', 'id_rsa'),
    )
    const backedUpConfig = fs.existsSync(
      path.join(repoDir, 'macos', '.ssh', 'config'),
    )

    assert.strictEqual(
      backedUpKey,
      false,
      'SSH private key should NOT be backed up',
    )
    assert.strictEqual(backedUpConfig, true, 'SSH config should be backed up')
  })
})
