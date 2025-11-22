/**
 * Destructed Files - manages logging/restoration of files backed up before overwrite
 */

import fs from 'fs'
import path from 'path'
import { DESTRUCTED_FILES_LOG } from '../constants/app-config'
import { expandTilde } from './path-helpers'
import type {
  DestructedFilesLog,
  DestructedFileEntry,
} from '../types/user-system-config'

export function readDestructedFilesLog(): DestructedFilesLog {
  const logPath = expandTilde(`~/${DESTRUCTED_FILES_LOG}`)

  if (!fs.existsSync(logPath)) {
    return { entries: [] }
  }

  try {
    const content = fs.readFileSync(logPath, 'utf-8')
    return JSON.parse(content) as DestructedFilesLog
  } catch {
    return { entries: [] }
  }
}

function writeDestructedFilesLog(log: DestructedFilesLog): void {
  const logPath = expandTilde(`~/${DESTRUCTED_FILES_LOG}`)

  const logDir = path.dirname(logPath)
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true, mode: 0o755 })
  }

  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf-8')
}

// Call before overwriting or symlinking a file
export function logDestructedFile(entry: DestructedFileEntry): void {
  const log = readDestructedFilesLog()

  log.entries.push({
    ...entry,
    timestamp: new Date().toISOString(),
  })

  writeDestructedFilesLog(log)
}

export function getDestructedFilesForMachine(
  machineId: string,
): DestructedFileEntry[] {
  const log = readDestructedFilesLog()
  return log.entries.filter((entry) => entry.machineId === machineId)
}

export function getDestructedFilesByReason(
  reason: 'symlink' | 'overwrite' | 'manual',
): DestructedFileEntry[] {
  const log = readDestructedFilesLog()
  return log.entries.filter((entry) => entry.reason === reason)
}

export function getRestoreableDestructedFiles(): DestructedFileEntry[] {
  const log = readDestructedFilesLog()
  return log.entries.filter(
    (entry) => entry.restoreable && fs.existsSync(entry.backupPath),
  )
}

export function findDestructedFile(
  originalPath: string,
): DestructedFileEntry | null {
  const log = readDestructedFilesLog()
  const normalizedPath = expandTilde(originalPath)

  const entries = log.entries
    .filter((entry) => expandTilde(entry.originalPath) === normalizedPath)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )

  return entries.length > 0 ? entries[0] : null
}

export function restoreDestructedFile(entry: DestructedFileEntry): boolean {
  try {
    const backupPath = expandTilde(entry.backupPath)
    const originalPath = expandTilde(entry.originalPath)

    if (!fs.existsSync(backupPath)) {
      console.error(`Backup file not found: ${backupPath}`)
      return false
    }

    const originalDir = path.dirname(originalPath)
    if (!fs.existsSync(originalDir)) {
      fs.mkdirSync(originalDir, { recursive: true, mode: 0o755 })
    }

    fs.copyFileSync(backupPath, originalPath)
    return true
  } catch (error) {
    console.error(`Error restoring destructed file: ${error}`)
    return false
  }
}

export function cleanupOldDestructedFiles(olderThanDays = 30): number {
  const log = readDestructedFilesLog()
  const now = Date.now()
  const maxAge = olderThanDays * 24 * 60 * 60 * 1000

  let deletedCount = 0
  const entriesToKeep: DestructedFileEntry[] = []

  for (const entry of log.entries) {
    const entryTime = new Date(entry.timestamp).getTime()

    if (now - entryTime > maxAge) {
      try {
        const backupPath = expandTilde(entry.backupPath)
        if (fs.existsSync(backupPath)) {
          fs.unlinkSync(backupPath)
          deletedCount++
        }
      } catch {
        entriesToKeep.push(entry)
      }
    } else {
      entriesToKeep.push(entry)
    }
  }

  if (deletedCount > 0) {
    writeDestructedFilesLog({ entries: entriesToKeep })
  }

  return deletedCount
}

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
    stats.byReason[entry.reason] = (stats.byReason[entry.reason] || 0) + 1
    stats.byMachine[entry.machineId] =
      (stats.byMachine[entry.machineId] || 0) + 1
  }

  return stats
}
