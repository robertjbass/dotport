/**
 * Editor/IDE Extension Detection Utility
 *
 * Detects installed editors/IDEs and their extensions, keybindings, and settings
 */

import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import {
  EditorType,
  EditorExtensions,
  ExtensionInfo,
  OperatingSystem,
} from '../types/backup-config'
import { expandTilde } from './path-helpers'

const execAsync = promisify(exec)

/**
 * Editor configuration paths
 */
type EditorPaths = {
  configPath?: string
  settingsPath?: string
  keybindingsPath?: string
  snippetsPath?: string
  extensionsPath?: string
  extensionsListCommand?: string
}

/**
 * Get configuration paths for each editor based on OS
 */
export function getEditorPaths(
  editor: EditorType,
  os: OperatingSystem,
): EditorPaths {
  const isMacOS = os === 'macos'

  const paths: Record<EditorType, EditorPaths> = {
    vscode: {
      configPath: isMacOS
        ? '~/Library/Application Support/Code/User'
        : '~/.config/Code/User',
      settingsPath: isMacOS
        ? '~/Library/Application Support/Code/User/settings.json'
        : '~/.config/Code/User/settings.json',
      keybindingsPath: isMacOS
        ? '~/Library/Application Support/Code/User/keybindings.json'
        : '~/.config/Code/User/keybindings.json',
      snippetsPath: isMacOS
        ? '~/Library/Application Support/Code/User/snippets'
        : '~/.config/Code/User/snippets',
      extensionsListCommand: 'code --list-extensions --show-versions',
    },
    'vscode-insiders': {
      configPath: isMacOS
        ? '~/Library/Application Support/Code - Insiders/User'
        : '~/.config/Code - Insiders/User',
      settingsPath: isMacOS
        ? '~/Library/Application Support/Code - Insiders/User/settings.json'
        : '~/.config/Code - Insiders/User/settings.json',
      keybindingsPath: isMacOS
        ? '~/Library/Application Support/Code - Insiders/User/keybindings.json'
        : '~/.config/Code - Insiders/User/keybindings.json',
      snippetsPath: isMacOS
        ? '~/Library/Application Support/Code - Insiders/User/snippets'
        : '~/.config/Code - Insiders/User/snippets',
      extensionsListCommand: 'code-insiders --list-extensions --show-versions',
    },
    cursor: {
      configPath: isMacOS
        ? '~/Library/Application Support/Cursor/User'
        : '~/.config/Cursor/User',
      settingsPath: isMacOS
        ? '~/Library/Application Support/Cursor/User/settings.json'
        : '~/.config/Cursor/User/settings.json',
      keybindingsPath: isMacOS
        ? '~/Library/Application Support/Cursor/User/keybindings.json'
        : '~/.config/Cursor/User/keybindings.json',
      snippetsPath: isMacOS
        ? '~/Library/Application Support/Cursor/User/snippets'
        : '~/.config/Cursor/User/snippets',
      extensionsListCommand: 'cursor --list-extensions --show-versions',
    },
    windsurf: {
      configPath: isMacOS
        ? '~/Library/Application Support/Windsurf/User'
        : '~/.config/Windsurf/User',
      settingsPath: isMacOS
        ? '~/Library/Application Support/Windsurf/User/settings.json'
        : '~/.config/Windsurf/User/settings.json',
      keybindingsPath: isMacOS
        ? '~/Library/Application Support/Windsurf/User/keybindings.json'
        : '~/.config/Windsurf/User/keybindings.json',
      snippetsPath: isMacOS
        ? '~/Library/Application Support/Windsurf/User/snippets'
        : '~/.config/Windsurf/User/snippets',
      extensionsListCommand: 'windsurf --list-extensions --show-versions',
    },
    vim: {
      configPath: '~',
      settingsPath: '~/.vimrc',
    },
    neovim: {
      configPath: '~/.config/nvim',
      settingsPath: '~/.config/nvim/init.vim',
    },
    'jetbrains-idea': {
      configPath: '~/.config/JetBrains/IntelliJIdea*',
    },
    'jetbrains-pycharm': {
      configPath: '~/.config/JetBrains/PyCharm*',
    },
    'jetbrains-webstorm': {
      configPath: '~/.config/JetBrains/WebStorm*',
    },
    'jetbrains-other': {
      configPath: '~/.config/JetBrains',
    },
    sublime: {
      configPath: isMacOS
        ? '~/Library/Application Support/Sublime Text/Packages/User'
        : '~/.config/sublime-text/Packages/User',
      settingsPath: isMacOS
        ? '~/Library/Application Support/Sublime Text/Packages/User/Preferences.sublime-settings'
        : '~/.config/sublime-text/Packages/User/Preferences.sublime-settings',
      keybindingsPath: isMacOS
        ? '~/Library/Application Support/Sublime Text/Packages/User/Default.sublime-keymap'
        : '~/.config/sublime-text/Packages/User/Default.sublime-keymap',
    },
    emacs: {
      configPath: '~/.emacs.d',
      settingsPath: '~/.emacs',
    },
    zed: {
      configPath: '~/.config/zed',
      settingsPath: '~/.config/zed/settings.json',
      keybindingsPath: '~/.config/zed/keymap.json',
    },
  }

  return paths[editor] || {}
}

/**
 * Check if an editor is installed
 */
export async function isEditorInstalled(
  editor: EditorType,
  os: OperatingSystem,
): Promise<boolean> {
  const paths = getEditorPaths(editor, os)

  if (paths.configPath) {
    const expandedPath = expandTilde(paths.configPath)
    try {
      // For glob patterns (JetBrains), check if any matching directory exists
      if (expandedPath.includes('*')) {
        const { stdout } = await execAsync(`ls -d ${expandedPath} 2>/dev/null || true`)
        return stdout.trim().length > 0
      }

      return fs.existsSync(expandedPath)
    } catch {
      return false
    }
  }

  // Try to detect by command
  const commands: Record<string, string> = {
    vscode: 'code',
    'vscode-insiders': 'code-insiders',
    cursor: 'cursor',
    windsurf: 'windsurf',
    vim: 'vim',
    neovim: 'nvim',
    sublime: 'subl',
    emacs: 'emacs',
    zed: 'zed',
  }

  const command = commands[editor]
  if (command) {
    try {
      await execAsync(`command -v ${command}`)
      return true
    } catch {
      return false
    }
  }

  return false
}

/**
 * Get extensions for VS Code-based editors (VS Code, Cursor, Windsurf)
 */
async function getVSCodeExtensions(
  command: string,
): Promise<ExtensionInfo[]> {
  try {
    const { stdout } = await execAsync(command)
    return stdout
      .trim()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const match = line.match(/(.+)@(.+)/)
        if (match) {
          const id = match[1]
          const version = match[2]
          const parts = id.split('.')
          return {
            id,
            version,
            publisher: parts[0],
            name: parts[1],
            enabled: true,
          }
        }
        return {
          id: line.trim(),
          enabled: true,
        }
      })
  } catch (error: any) {
    // If stdout exists despite the error (e.g., VS Code crash after outputting data),
    // parse and return the extensions we got
    if (error.stdout && typeof error.stdout === 'string') {
      const stdout = error.stdout.trim()
      if (stdout) {
        return stdout
          .split('\n')
          .filter((line: string) => line.trim())
          .map((line: string) => {
            const match = line.match(/(.+)@(.+)/)
            if (match) {
              const id = match[1]
              const version = match[2]
              const parts = id.split('.')
              return {
                id,
                version,
                publisher: parts[0],
                name: parts[1],
                enabled: true,
              }
            }
            return {
              id: line.trim(),
              enabled: true,
            }
          })
      }
    }

    // Silently handle the error - command may have failed
    return []
  }
}

/**
 * Get Vim plugins from various plugin managers
 */
async function getVimPlugins(): Promise<ExtensionInfo[]> {
  const plugins: ExtensionInfo[] = []

  // Check for vim-plug
  const vimPlugDir = expandTilde('~/.vim/plugged')
  if (fs.existsSync(vimPlugDir)) {
    try {
      const dirs = fs.readdirSync(vimPlugDir)
      dirs.forEach((dir) => {
        plugins.push({
          id: dir,
          name: dir,
          enabled: true,
        })
      })
    } catch (error) {
      console.error('Error reading vim-plug directory:', error)
    }
  }

  // Check for Vundle
  const vundleDir = expandTilde('~/.vim/bundle')
  if (fs.existsSync(vundleDir)) {
    try {
      const dirs = fs.readdirSync(vundleDir)
      dirs.forEach((dir) => {
        if (!plugins.find((p) => p.id === dir)) {
          plugins.push({
            id: dir,
            name: dir,
            enabled: true,
          })
        }
      })
    } catch (error) {
      console.error('Error reading Vundle directory:', error)
    }
  }

  return plugins
}

/**
 * Get Neovim plugins
 */
async function getNeovimPlugins(): Promise<ExtensionInfo[]> {
  const plugins: ExtensionInfo[] = []

  // Check for packer
  const packerDir = expandTilde('~/.local/share/nvim/site/pack/packer/start')
  if (fs.existsSync(packerDir)) {
    try {
      const dirs = fs.readdirSync(packerDir)
      dirs.forEach((dir) => {
        plugins.push({
          id: dir,
          name: dir,
          enabled: true,
        })
      })
    } catch (error) {
      console.error('Error reading packer directory:', error)
    }
  }

  // Check for lazy.nvim
  const lazyDir = expandTilde('~/.local/share/nvim/lazy')
  if (fs.existsSync(lazyDir)) {
    try {
      const dirs = fs.readdirSync(lazyDir)
      dirs.forEach((dir) => {
        if (!plugins.find((p) => p.id === dir)) {
          plugins.push({
            id: dir,
            name: dir,
            enabled: true,
          })
        }
      })
    } catch (error) {
      console.error('Error reading lazy.nvim directory:', error)
    }
  }

  return plugins
}

/**
 * Get extensions for a specific editor
 */
export async function getEditorExtensions(
  editor: EditorType,
): Promise<ExtensionInfo[]> {
  const paths = getEditorPaths(editor, process.platform === 'darwin' ? 'macos' : 'linux')

  // VS Code-based editors
  if (paths.extensionsListCommand) {
    return getVSCodeExtensions(paths.extensionsListCommand)
  }

  // Vim
  if (editor === 'vim') {
    return getVimPlugins()
  }

  // Neovim
  if (editor === 'neovim') {
    return getNeovimPlugins()
  }

  // For other editors, we don't have extension detection yet
  return []
}

/**
 * Check if a file exists and return the path in dotfiles repo
 */
function checkAndGetRepoPath(
  filePath: string | undefined,
  osOrDistro: string,
): string | undefined {
  if (!filePath) return undefined

  const expandedPath = expandTilde(filePath)
  if (fs.existsSync(expandedPath)) {
    const fileName = path.basename(filePath)
    return `${osOrDistro}/.config/${fileName}`
  }

  return undefined
}

/**
 * Detect installed editors
 */
export async function detectInstalledEditors(
  os: OperatingSystem,
): Promise<EditorType[]> {
  const editors: EditorType[] = [
    'vscode',
    'vscode-insiders',
    'cursor',
    'windsurf',
    'vim',
    'neovim',
    'jetbrains-idea',
    'jetbrains-pycharm',
    'jetbrains-webstorm',
    'sublime',
    'emacs',
    'zed',
  ]

  const installed: EditorType[] = []

  for (const editor of editors) {
    if (await isEditorInstalled(editor, os)) {
      installed.push(editor)
    }
  }

  return installed
}

/**
 * Create an EditorExtensions object for a specific editor
 */
export async function createEditorExtensions(
  editor: EditorType,
  os: OperatingSystem,
  osOrDistro: string,
): Promise<EditorExtensions> {
  const paths = getEditorPaths(editor, os)
  const extensions = await getEditorExtensions(editor)

  const settingsBackedUp = paths.settingsPath
    ? fs.existsSync(expandTilde(paths.settingsPath))
    : false
  const keybindingsBackedUp = paths.keybindingsPath
    ? fs.existsSync(expandTilde(paths.keybindingsPath))
    : false
  const snippetsBackedUp = paths.snippetsPath
    ? fs.existsSync(expandTilde(paths.snippetsPath))
    : false

  return {
    editor,
    enabled: true,
    configPath: paths.configPath,
    extensions,
    exportedAt: new Date().toISOString(),
    exportPath: `.config/${editor}-extensions.json`,
    keybindingsPath: checkAndGetRepoPath(paths.keybindingsPath, osOrDistro),
    keybindingsBackedUp,
    settingsPath: checkAndGetRepoPath(paths.settingsPath, osOrDistro),
    settingsBackedUp,
    snippetsPath: checkAndGetRepoPath(paths.snippetsPath, osOrDistro),
    snippetsBackedUp,
  }
}

/**
 * Export extensions list to a JSON file
 */
export async function exportExtensionsToFile(
  editor: EditorExtensions,
  exportPath: string,
): Promise<void> {
  const data = {
    editor: editor.editor,
    exportedAt: editor.exportedAt,
    extensions: editor.extensions,
  }

  fs.writeFileSync(exportPath, JSON.stringify(data, null, 2), 'utf-8')
}
