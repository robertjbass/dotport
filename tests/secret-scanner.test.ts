/**
 * Secret Scanner Tests
 *
 * Tests the secret detection functionality
 */

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import fs from 'fs'
import path from 'path'
import os from 'os'
import {
  scanFile,
  scanFiles,
  generateSummary,
  isKnownSecretFile,
  getRecommendedAction,
  type SecretPattern,
} from '../utils/secret-scanner'

describe('Secret Scanner', () => {
  let testDir: string
  let testFiles: string[]

  before(() => {
    // Create temporary test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'secret-scanner-test-'))
    testFiles = []

    // Create test file with secrets
    const secretFile = path.join(testDir, 'secrets.env')
    fs.writeFileSync(
      secretFile,
      `
API_KEY=sk_live_123456789abcdef
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
password=my_super_secret_password
DATABASE_URL=postgres://user:pass@localhost/db
# This is a comment
SAFE_VALUE=123
`.trim(),
    )
    testFiles.push(secretFile)

    // Create test file without secrets
    const safeFile = path.join(testDir, 'config.txt')
    fs.writeFileSync(
      safeFile,
      `
# Configuration file
PORT=3000
HOST=localhost
DEBUG=false
`.trim(),
    )
    testFiles.push(safeFile)

    // Create binary file
    const binaryFile = path.join(testDir, 'binary.bin')
    fs.writeFileSync(binaryFile, Buffer.from([0x00, 0x01, 0x02, 0x03]))
    testFiles.push(binaryFile)
  })

  after(() => {
    // Cleanup test directory
    testFiles.forEach((file) => {
      try {
        fs.unlinkSync(file)
      } catch (e) {
        // Ignore
      }
    })
    try {
      fs.rmdirSync(testDir)
    } catch (e) {
      // Ignore
    }
  })

  it('should detect secrets in file', () => {
    const result = scanFile(testFiles[0])

    assert.strictEqual(result.scanned, true, 'File should be scanned')
    assert.strictEqual(
      result.containsSecrets,
      true,
      'File should contain secrets',
    )
    assert.ok(result.matches.length > 0, 'Should have secret matches')
  })

  it('should not detect secrets in safe file', () => {
    const result = scanFile(testFiles[1])

    assert.strictEqual(result.scanned, true, 'File should be scanned')
    assert.strictEqual(
      result.containsSecrets,
      false,
      'File should not contain secrets',
    )
    assert.strictEqual(result.matches.length, 0, 'Should have no matches')
  })

  it('should skip binary files', () => {
    const result = scanFile(testFiles[2])

    assert.strictEqual(
      result.scanned,
      false,
      'Binary file should not be scanned',
    )
    assert.ok(result.errors!.length > 0, 'Should have error for binary file')
  })

  it('should handle non-existent files', () => {
    const result = scanFile(path.join(testDir, 'nonexistent.txt'))

    assert.strictEqual(
      result.scanned,
      false,
      'Non-existent file should not be scanned',
    )
    assert.ok(
      result.errors!.length > 0,
      'Should have error for non-existent file',
    )
  })

  it('should scan multiple files', () => {
    const results = scanFiles([testFiles[0], testFiles[1]])

    assert.strictEqual(results.length, 2, 'Should scan all files')
    assert.strictEqual(
      results[0].containsSecrets,
      true,
      'First file has secrets',
    )
    assert.strictEqual(results[1].containsSecrets, false, 'Second file is safe')
  })

  it('should generate correct summary', () => {
    const results = scanFiles([testFiles[0], testFiles[1], testFiles[2]])
    const summary = generateSummary(results)

    assert.strictEqual(summary.totalFiles, 3, 'Should count all files')
    assert.strictEqual(summary.scannedFiles, 2, 'Should count scanned files')
    assert.strictEqual(
      summary.filesWithSecrets,
      1,
      'Should count files with secrets',
    )
    assert.ok(summary.totalMatches > 0, 'Should have total matches')
  })

  it('should identify known secret files', () => {
    assert.strictEqual(
      isKnownSecretFile('.env'),
      true,
      '.env is a known secret file',
    )
    assert.strictEqual(
      isKnownSecretFile('.npmrc'),
      true,
      '.npmrc is a known secret file',
    )
    assert.strictEqual(
      isKnownSecretFile('~/.aws/credentials'),
      true,
      'AWS credentials is a known secret file',
    )
    assert.strictEqual(
      isKnownSecretFile('.gitconfig'),
      false,
      '.gitconfig is not a secret file',
    )
  })

  it('should recommend correct actions', () => {
    const secretFileResult = scanFile(testFiles[0])
    const safeFileResult = scanFile(testFiles[1])

    const secretAction = getRecommendedAction(secretFileResult)
    const safeAction = getRecommendedAction(safeFileResult)

    assert.ok(
      ['exclude', 'review'].includes(secretAction.action),
      'Should recommend exclude or review for secret file',
    )
    assert.strictEqual(
      safeAction.action,
      'safe',
      'Should recommend safe for clean file',
    )
  })

  it('should detect custom patterns', () => {
    const customPatterns: SecretPattern[] = [
      {
        name: 'Custom Token',
        regex: 'CUSTOM_TOKEN_[A-Z0-9]{16}',
        severity: 'high',
      },
    ]

    const testFile = path.join(testDir, 'custom.txt')
    fs.writeFileSync(testFile, 'CUSTOM_TOKEN_ABCD1234EFGH5678')
    testFiles.push(testFile)

    const result = scanFile(testFile, customPatterns)

    assert.strictEqual(
      result.containsSecrets,
      true,
      'Should detect custom pattern',
    )
    assert.ok(
      result.matches.some((m) => m.pattern === 'Custom Token'),
      'Should match custom pattern',
    )

    fs.unlinkSync(testFile)
  })
})
