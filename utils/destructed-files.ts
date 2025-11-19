/**
 * Destructed Files Utility
 *
 * Manages the logging and restoration of files that were backed up
 * before being overwritten or symlinked.
 */

import fs from 'fs'
import path from 'path'
import { DESTRUCTED_FILES_LOG } from '../constants/app-config'
import { expandTilde } from './path-helpers'
import type {
  DestructedFilesLog,
  DestructedFileEntry,
} from '../types/user-system-config'

/**
 * Read the destructed files log
 */
export function readDestructedFilesLog(): DestructedFilesLog {
  const logPath = expandTilde(`~/${DESTRUCTED_FILES_LOG}`)

  if (!fs.existsSync(logPath)) {
    return { entries: [] }
  }

  try {
    const content = fs.readFileSync(logPath, 'utf-8')
    return JSON.parse(content) as DestructedFilesLog
  } catch (error) {
    console.error(`Error reading destructed files log: ${error}`)
    return { entries: [] }
  }
}

/**
 * Write the destructed files log
 */
function writeDestructedFilesLog(log: DestructedFilesLog): void {
  const logPath = expandTilde(`~/${DESTRUCTED_FILES_LOG}`)

  // Ensure parent directory exists
  const logDir = path.dirname(logPath)
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true, mode: 0o755 })
  }

  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf-8')
}

/**
 * Log a destructed file
 * This should be called before overwriting or symlinking a file
 */
export function logDestructedFile(entry: DestructedFileEntry): void {
  const log = readDestructedFilesLog()

  log.entries.push({
    ...entry,
    timestamp: new Date().toISOString(),
  })

  writeDestructedFilesLog(log)
}

/**
 * Get all destructed files for a specific machine
 */
export function getDestructedFilesForMachine(machineId: string): DestructedFileEntry[] {
  const log = readDestructedFilesLog()
  return log.entries.filter((entry) => entry.machineId === machineId)
}

/**
 * Get destructed files by reason
 */
export function getDestructedFilesByReason(
  reason: 'symlink' | 'overwrite' | 'manual'
): DestructedFileEntry[] {
  const log = readDestructedFilesLog()
  return log.entries.filter((entry) => entry.reason === reason)
}

/**
 * Get all restoreable destructed files
 */
export function getRestoreableDestructedFiles(): DestructedFileEntry[] {
  const log = readDestructedFilesLog()
  return log.entries.filter((entry) => entry.restoreable && fs.existsSync(entry.backupPath))
}

/**
 * Find a destructed file by original path
 */
export function findDestructedFile(originalPath: string): DestructedFileEntry | null {
  const log = readDestructedFilesLog()
  const normalizedPath = expandTilde(originalPath)

  // Find the most recent entry for this path
  const entries = log.entries
    .filter((entry) => expandTilde(entry.originalPath) === normalizedPath)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return entries.length > 0 ? entries[0] : null
}

/**
 * Restore a destructed file
 * Copies the file from the backup location back to its original location
 */
export function restoreDestructedFile(entry: DestructedFileEntry): boolean {
  try {
    const backupPath = expandTilde(entry.backupPath)
    const originalPath = expandTilde(entry.originalPath)

    if (!fs.existsSync(backupPath)) {
      console.error(`Backup file not found: ${backupPath}`)
      return false
    }

    // Create parent directory if it doesn't exist
    const originalDir = path.dirname(originalPath)
    if (!fs.existsSync(originalDir)) {
      fs.mkdirSync(originalDir, { recursive: true, mode: 0o755 })
    }

    // Copy the backup file to the original location
    fs.copyFileSync(backupPath, originalPath)

    return true
  } catch (error) {
    console.error(`Error restoring destructed file: ${error}`)
    return false
  }
}

/**
 * Delete old destructed file backups
 * Removes backup files older than the specified number of days
 */
export function cleanupOldDestructedFiles(olderThanDays = 30): number {
  const log = readDestructedFilesLog()
  const now = Date.now()
  const maxAge = olderThanDays * 24 * 60 * 60 * 1000 // Convert to milliseconds

  let deletedCount = 0

  // Track which entries to keep
  const entriesToKeep: DestructedFileEntry[] = []

  for (const entry of log.entries) {
    const entryTime = new Date(entry.timestamp).getTime()

    if (now - entryTime > maxAge) {
      // Try to delete the backup file
      try {
        const backupPath = expandTilde(entry.backupPath)
        if (fs.existsSync(backupPath)) {
          fs.unlinkSync(backupPath)
          deletedCount++
        }
        // Don't keep this entry in the log
      } catch (error) {
        console.error(`Error deleting old backup: ${error}`)
        // Keep the entry if we couldn't delete the file
        entriesToKeep.push(entry)
      }
    } else {
      // Keep this entry
      entriesToKeep.push(entry)
    }
  }

  // Update the log with remaining entries
  if (deletedCount > 0) {
    writeDestructedFilesLog({ entries: entriesToKeep })
  }

  return deletedCount
}

/**
 * Get statistics about destructed files
 */
export function getDestructedFilesStats(): {
  total: number
  restoreable: number
  byReason: Record<string, number>
  byMachine: Record<string, number>
} {
  const log = readDestructedFilesLog()

  const stats = {
    total: log.entries.length,
    restoreable: log.entries.filter((e) => e.restoreable).length,
    byReason: {} as Record<string, number>,
    byMachine: {} as Record<string, number>,
  }

  for (const entry of log.entries) {
    // Count by reason
    stats.byReason[entry.reason] = (stats.byReason[entry.reason] || 0) + 1

    // Count by machine
    stats.byMachine[entry.machineId] = (stats.byMachine[entry.machineId] || 0) + 1
  }

  return stats
}
