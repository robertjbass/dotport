/**
 * Restore Backup - backups files before overwriting during restoration
 */

import fs from 'fs'
import path from 'path'
import { expandTilde, ensureDirectory, pathExists } from './path-helpers'

export type BackupEntry = {
  filename: string
  location: string
  backedUpAt: string // ISO 8601 timestamp
  backupFilename: string // Unique filename in backup directory
  originalSize?: number // Size in bytes
  checksum?: string // Optional file checksum for verification
}

export type FileLocationMap = {
  version: string
  backupDirectory: string
  createdAt: string
  lastUpdatedAt: string
  entries: BackupEntry[]
}

const BACKUP_ROOT = '~/dotfiles-backups'
const MAP_FILENAME = 'fileLocationMap.json'
const MAP_VERSION = '1.0.0'

export function getBackupDirectory(): string {
  return expandTilde(BACKUP_ROOT)
}

export function getMapFilePath(): string {
  return path.join(getBackupDirectory(), MAP_FILENAME)
}

export function loadFileLocationMap(): FileLocationMap | null {
  const mapPath = getMapFilePath()

  if (!pathExists(mapPath)) {
    return null
  }

  try {
    const content = fs.readFileSync(mapPath, 'utf-8')
    return JSON.parse(content) as FileLocationMap
  } catch (error) {
    console.error('Failed to load file location map:', error)
    return null
  }
}

export function saveFileLocationMap(map: FileLocationMap): void {
  const mapPath = getMapFilePath()
  map.lastUpdatedAt = new Date().toISOString()

  try {
    fs.writeFileSync(mapPath, JSON.stringify(map, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save file location map:', error)
    throw error
  }
}

export function initializeFileLocationMap(): FileLocationMap {
  const backupDir = getBackupDirectory()
  ensureDirectory(backupDir)

  const map: FileLocationMap = {
    version: MAP_VERSION,
    backupDirectory: backupDir,
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    entries: [],
  }

  saveFileLocationMap(map)
  return map
}

export function getOrCreateFileLocationMap(): FileLocationMap {
  let map = loadFileLocationMap()

  if (!map) {
    map = initializeFileLocationMap()
  }

  return map
}

export function generateBackupFilename(
  originalPath: string,
  timestamp: Date = new Date(),
): string {
  const basename = path.basename(originalPath)
  const timestampStr = timestamp.toISOString().replace(/[:.]/g, '-')
  return `${basename}.${timestampStr}.backup`
}

function getFileSize(filePath: string): number | undefined {
  try {
    const stats = fs.statSync(filePath)
    return stats.size
  } catch {
    return undefined
  }
}

export function backupFileBeforeOverwrite(
  filePath: string,
): BackupEntry | null {
  const absolutePath = expandTilde(filePath)

  // Check if file exists
  if (!pathExists(absolutePath)) {
    console.warn(`File does not exist, skipping backup: ${absolutePath}`)
    return null
  }

  try {
    // Ensure backup directory exists
    const backupDir = getBackupDirectory()
    ensureDirectory(backupDir)

    // Generate unique backup filename
    const timestamp = new Date()
    const backupFilename = generateBackupFilename(absolutePath, timestamp)
    const backupPath = path.join(backupDir, backupFilename)

    // Copy file to backup location
    fs.copyFileSync(absolutePath, backupPath)

    // Create backup entry
    const entry: BackupEntry = {
      filename: path.basename(absolutePath),
      location: absolutePath,
      backedUpAt: timestamp.toISOString(),
      backupFilename,
      originalSize: getFileSize(absolutePath),
    }

    // Update file location map
    const map = getOrCreateFileLocationMap()
    map.entries.push(entry)
    saveFileLocationMap(map)

    return entry
  } catch (error) {
    console.error(`Failed to backup file ${absolutePath}:`, error)
    return null
  }
}

export function restoreBackupEntry(
  entry: BackupEntry,
  removeAfterRestore = false,
): boolean {
  try {
    const backupDir = getBackupDirectory()
    const backupPath = path.join(backupDir, entry.backupFilename)

    if (!pathExists(backupPath)) {
      console.error(`Backup file not found: ${backupPath}`)
      return false
    }

    // Restore the file
    fs.copyFileSync(backupPath, entry.location)

    // Optionally remove the backup
    if (removeAfterRestore) {
      fs.unlinkSync(backupPath)

      // Update the map to remove this entry
      const map = loadFileLocationMap()
      if (map) {
        map.entries = map.entries.filter(
          (e) => e.backupFilename !== entry.backupFilename,
        )
        saveFileLocationMap(map)
      }
    }

    return true
  } catch (error) {
    console.error(`Failed to restore backup entry:`, error)
    return false
  }
}

export function findBackupEntriesForFile(filePath: string): BackupEntry[] {
  const map = loadFileLocationMap()
  if (!map) {
    return []
  }

  const absolutePath = expandTilde(filePath)
  return map.entries.filter((entry) => entry.location === absolutePath)
}

export function listAllBackups(sortByDate = true): BackupEntry[] {
  const map = loadFileLocationMap()
  if (!map) {
    return []
  }

  const entries = [...map.entries]

  if (sortByDate) {
    entries.sort(
      (a, b) =>
        new Date(b.backedUpAt).getTime() - new Date(a.backedUpAt).getTime(),
    )
  }

  return entries
}

export function getBackupSummary(): {
  totalBackups: number
  totalSize: number
  oldestBackup: string | null
  newestBackup: string | null
  backupDirectory: string
} {
  const map = loadFileLocationMap()

  if (!map || map.entries.length === 0) {
    return {
      totalBackups: 0,
      totalSize: 0,
      oldestBackup: null,
      newestBackup: null,
      backupDirectory: getBackupDirectory(),
    }
  }

  const totalSize = map.entries.reduce(
    (sum, entry) => sum + (entry.originalSize || 0),
    0,
  )

  const timestamps = map.entries.map((e) => new Date(e.backedUpAt).getTime())
  const oldestBackup = new Date(Math.min(...timestamps)).toISOString()
  const newestBackup = new Date(Math.max(...timestamps)).toISOString()

  return {
    totalBackups: map.entries.length,
    totalSize,
    oldestBackup,
    newestBackup,
    backupDirectory: getBackupDirectory(),
  }
}

export function cleanupOldBackups(daysToKeep = 30): number {
  const map = loadFileLocationMap()
  if (!map) {
    return 0
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
  const cutoffTime = cutoffDate.getTime()

  const backupDir = getBackupDirectory()
  let cleanedCount = 0

  // Filter out old entries and remove their files
  map.entries = map.entries.filter((entry) => {
    const entryTime = new Date(entry.backedUpAt).getTime()

    if (entryTime < cutoffTime) {
      const backupPath = path.join(backupDir, entry.backupFilename)
      try {
        if (pathExists(backupPath)) {
          fs.unlinkSync(backupPath)
          cleanedCount++
        }
        return false // Remove from map
      } catch (error) {
        console.error(`Failed to delete old backup: ${backupPath}`, error)
        return true // Keep in map if deletion failed
      }
    }

    return true // Keep recent backups
  })

  if (cleanedCount > 0) {
    saveFileLocationMap(map)
  }

  return cleanedCount
}

export function deleteAllBackups(): boolean {
  const backupDir = getBackupDirectory()

  if (!pathExists(backupDir)) {
    return true
  }

  try {
    fs.rmSync(backupDir, { recursive: true, force: true })
    return true
  } catch (error) {
    console.error('Failed to delete backup directory:', error)
    return false
  }
}
