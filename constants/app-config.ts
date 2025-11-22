/**
 * Application Configuration Constants
 *
 * Central location for all application-level constants including
 * directory paths, file names, and version information.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Application metadata
export const APP_NAME = 'Dotport'

// Read version from package.json
let appVersion = '1.0.0'
try {
  // Try multiple possible paths for package.json
  const possiblePaths = [
    join(__dirname, '..', 'package.json'),
    join(process.cwd(), 'package.json'),
  ]

  for (const packageJsonPath of possiblePaths) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      appVersion = packageJson.version
      break
    } catch {
      continue
    }
  }
} catch (error) {
  // Silently use fallback version
}

export const APP_VERSION = appVersion
export const APP_NAME_NORMALIZED = APP_NAME.toLowerCase()

// System directories (relative to home directory)
export const SYSTEM_ROOT_FOLDER = `.${APP_NAME_NORMALIZED}`
export const CONFIG_FOLDER = `${SYSTEM_ROOT_FOLDER}/config`
export const BACKUPS_FOLDER = `${SYSTEM_ROOT_FOLDER}/backups`
export const GENERATED_BACKUPS_FOLDER = `${BACKUPS_FOLDER}/generated-backups`
export const DESTRUCTED_FILES_FOLDER = `${BACKUPS_FOLDER}/destructed-files`
export const LOGS_FOLDER = `${SYSTEM_ROOT_FOLDER}/logs`
export const TEMP_FOLDER = `${SYSTEM_ROOT_FOLDER}/temp`

// Config files (relative to home directory)
export const USER_SYSTEM_CONFIG_FILE = `${CONFIG_FOLDER}/user-system.json`
export const GITHUB_AUTH_FILE = `${CONFIG_FOLDER}/github-auth.json`
export const DESTRUCTED_FILES_LOG = `${DESTRUCTED_FILES_FOLDER}/log.json`

// Default values
export const DEFAULT_REPO_NAME = 'dotfiles'
export const DEFAULT_CLONE_LOCATION = '~/dev'
export const DEFAULT_SECRET_FILE_NAME = '.env.sh'
export const DEFAULT_SECRET_FILE_LOCATION = '~'
export const DEFAULT_BRANCH = 'main'
