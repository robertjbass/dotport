/**
 * Directory Manager - manages the ~/.dotport directory structure
 */

import fs from 'fs'
import path from 'path'
import {
  SYSTEM_ROOT_FOLDER,
  CONFIG_FOLDER,
  BACKUPS_FOLDER,
  GENERATED_BACKUPS_FOLDER,
  DESTRUCTED_FILES_FOLDER,
  LOGS_FOLDER,
  TEMP_FOLDER,
  DESTRUCTED_FILES_LOG,
} from '../constants/app-config'
import { expandTilde } from './path-helpers'
import type { DestructedFilesLog } from '../types/user-system-config'

export function ensureDotPortDirectories(): void {
  const directories = [
    SYSTEM_ROOT_FOLDER,
    CONFIG_FOLDER,
    BACKUPS_FOLDER,
    GENERATED_BACKUPS_FOLDER,
    DESTRUCTED_FILES_FOLDER,
    LOGS_FOLDER,
    TEMP_FOLDER,
  ]

  for (const dir of directories) {
    const fullPath = expandTilde(`~/${dir}`)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true, mode: 0o755 })
    }
  }

  const logPath = expandTilde(`~/${DESTRUCTED_FILES_LOG}`)
  if (!fs.existsSync(logPath)) {
    const emptyLog: DestructedFilesLog = { entries: [] }
    fs.writeFileSync(logPath, JSON.stringify(emptyLog, null, 2), 'utf-8')
  }
}

export function getDotPortPath(relativePath: string): string {
  return expandTilde(`~/${SYSTEM_ROOT_FOLDER}/${relativePath}`)
}

export function dotPortDirectoriesExist(): boolean {
  const rootPath = expandTilde(`~/${SYSTEM_ROOT_FOLDER}`)
  return fs.existsSync(rootPath)
}

export function createTimestampedBackupDir(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
  const backupDir = expandTilde(`~/${GENERATED_BACKUPS_FOLDER}/${timestamp}`)

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true, mode: 0o755 })
  }

  return backupDir
}

export function createTimestampedDestructedDir(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
  const destructedDir = expandTilde(`~/${DESTRUCTED_FILES_FOLDER}/${timestamp}`)

  if (!fs.existsSync(destructedDir)) {
    fs.mkdirSync(destructedDir, { recursive: true, mode: 0o755 })
  }

  return destructedDir
}

export function cleanupTempFiles(olderThanDays = 7): void {
  const tempDir = expandTilde(`~/${TEMP_FOLDER}`)

  if (!fs.existsSync(tempDir)) return

  const now = Date.now()
  const maxAge = olderThanDays * 24 * 60 * 60 * 1000

  const files = fs.readdirSync(tempDir)
  for (const file of files) {
    const filePath = path.join(tempDir, file)
    const stats = fs.statSync(filePath)

    if (now - stats.mtimeMs > maxAge) {
      if (stats.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true })
      } else {
        fs.unlinkSync(filePath)
      }
    }
  }
}

export function getDotPortSize(): number {
  const rootPath = expandTilde(`~/${SYSTEM_ROOT_FOLDER}`)

  if (!fs.existsSync(rootPath)) return 0

  let totalSize = 0

  function calculateDirSize(dirPath: string): void {
    const files = fs.readdirSync(dirPath)

    for (const file of files) {
      const filePath = path.join(dirPath, file)
      const stats = fs.statSync(filePath)

      if (stats.isDirectory()) {
        calculateDirSize(filePath)
      } else {
        totalSize += stats.size
      }
    }
  }

  calculateDirSize(rootPath)
  return totalSize
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
