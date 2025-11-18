/**
 * File Discovery Utility
 *
 * Scans the user's home directory for common dotfiles and config files
 */

import fs from 'fs'
import path from 'path'
import { OperatingSystem } from '../types/backup-config'
import { expandTilde, getRelativePath } from './path-helpers'

export type DiscoveredFile = {
  name: string // Display name (e.g., '.zshrc', 'Ghostty config')
  path: string // Absolute path (e.g., '/Users/bob/.zshrc')
  relativePath: string // Relative to home (e.g., '~/.zshrc')
  category:
    | 'shell'
    | 'secrets'
    | 'git'
    | 'devtools'
    | 'ssh'
    | 'editor'
    | 'terminal'
    | 'app-config'
    | 'keybinding'
    | 'other'
  exists: boolean // Whether file actually exists
  size?: number // File size in bytes
  isDirectory: boolean // Whether it's a directory
}

/**
 * Common dotfiles and config files to look for (cross-platform)
 */
const COMMON_FILES = {
  // Shell configuration
  shell: [
    { path: '~/.bashrc', name: '.bashrc' },
    { path: '~/.bash_profile', name: '.bash_profile' },
    { path: '~/.zshrc', name: '.zshrc' },
    { path: '~/.zprofile', name: '.zprofile' },
    { path: '~/.zshenv', name: '.zshenv' },
    { path: '~/.shell_common', name: '.shell_common' },
    { path: '~/.profile', name: '.profile' },
  ],

  // Secret files (should NOT be tracked in git)
  secrets: [
    { path: '~/.env', name: '.env (secrets)' },
    { path: '~/.env.sh', name: '.env.sh (secrets)' },
    { path: '~/.secrets', name: '.secrets' },
    { path: '~/.zshsecrets', name: '.zshsecrets' },
    { path: '~/.bashsecrets', name: '.bashsecrets' },
    { path: '~/.npmrc', name: '.npmrc (may contain auth tokens)' },
    { path: '~/.pypirc', name: '.pypirc (may contain PyPI credentials)' },
    {
      path: '~/.docker/config.json',
      name: 'Docker config (may contain registry auth)',
    },
    { path: '~/.aws/credentials', name: 'AWS credentials' },
  ],

  // Git configuration
  git: [
    { path: '~/.gitconfig', name: '.gitconfig' },
    { path: '~/.gitignore_global', name: '.gitignore_global' },
    { path: '~/.config/git/config', name: 'Git config (XDG)' },
    { path: '~/.config/git/ignore', name: 'Git global ignore (XDG)' },
    { path: '~/.gitmessage', name: 'Git commit message template' },
  ],

  // Developer tools
  devtools: [
    // Node.js / npm / yarn / pnpm
    // Note: .npmrc moved to secrets (contains auth tokens)
    { path: '~/.yarnrc', name: 'Yarn config' },
    { path: '~/.yarnrc.yml', name: 'Yarn 2+ config' },
    { path: '~/.config/pnpm/rc', name: 'pnpm config' },

    // Python
    // Note: .pypirc moved to secrets (contains PyPI credentials)
    { path: '~/.pythonrc', name: 'Python startup script' },
    { path: '~/.config/pip/pip.conf', name: 'pip config' },

    // Ruby / Gem
    { path: '~/.gemrc', name: 'RubyGems config' },
    { path: '~/.irbrc', name: 'IRB config' },

    // Docker / Kubernetes
    // Note: Docker config.json moved to secrets (contains registry auth)
    { path: '~/.kube/config', name: 'Kubernetes config' },

    // AWS
    { path: '~/.aws/config', name: 'AWS config' },
    // Note: ~/.aws/credentials is in secrets category

    // Terraform
    { path: '~/.terraformrc', name: 'Terraform config' },
    { path: '~/.terraform.d', name: 'Terraform plugins/config' },

    // tmux
    { path: '~/.tmux.conf', name: 'tmux config' },
    { path: '~/.config/tmux', name: 'tmux config directory' },

    // Wget / Curl
    { path: '~/.wgetrc', name: 'wget config' },
    { path: '~/.curlrc', name: 'curl config' },
  ],

  // SSH configuration
  ssh: [{ path: '~/.ssh/config', name: 'SSH config' }],

  // Editor configurations
  editor: [
    // Vim/Neovim
    { path: '~/.vimrc', name: '.vimrc' },
    { path: '~/.config/nvim', name: 'Neovim config' },

    // VS Code (Linux/cross-platform paths)
    { path: '~/.config/Code/User/settings.json', name: 'VS Code settings' },
    {
      path: '~/.config/Code/User/keybindings.json',
      name: 'VS Code keybindings',
    },
    { path: '~/.config/Code/User/snippets', name: 'VS Code snippets' },
    { path: '~/.config/Code/User/profiles', name: 'VS Code profiles' },
    { path: '~/.config/Code/User/tasks.json', name: 'VS Code tasks' },
    { path: '~/.config/Code/User/launch.json', name: 'VS Code launch config' },

    // VS Code (macOS paths)
    {
      path: '~/Library/Application Support/Code/User/settings.json',
      name: 'VS Code settings (macOS)',
    },
    {
      path: '~/Library/Application Support/Code/User/keybindings.json',
      name: 'VS Code keybindings (macOS)',
    },
    {
      path: '~/Library/Application Support/Code/User/snippets',
      name: 'VS Code snippets (macOS)',
    },
    {
      path: '~/Library/Application Support/Code/User/profiles',
      name: 'VS Code profiles (macOS)',
    },

    // Cursor (AI-powered VS Code fork)
    { path: '~/.config/Cursor/User/settings.json', name: 'Cursor settings' },
    {
      path: '~/.config/Cursor/User/keybindings.json',
      name: 'Cursor keybindings',
    },
    { path: '~/.config/Cursor/User/snippets', name: 'Cursor snippets' },
    { path: '~/.config/Cursor/User/profiles', name: 'Cursor profiles' },
    {
      path: '~/Library/Application Support/Cursor/User/settings.json',
      name: 'Cursor settings (macOS)',
    },
    {
      path: '~/Library/Application Support/Cursor/User/keybindings.json',
      name: 'Cursor keybindings (macOS)',
    },
    {
      path: '~/Library/Application Support/Cursor/User/snippets',
      name: 'Cursor snippets (macOS)',
    },

    // Windsurf (Codeium IDE)
    {
      path: '~/.config/Windsurf/User/settings.json',
      name: 'Windsurf settings',
    },
    {
      path: '~/.config/Windsurf/User/keybindings.json',
      name: 'Windsurf keybindings',
    },
    { path: '~/.config/Windsurf/User/snippets', name: 'Windsurf snippets' },
    { path: '~/.config/Windsurf/User/profiles', name: 'Windsurf profiles' },
    {
      path: '~/Library/Application Support/Windsurf/User/settings.json',
      name: 'Windsurf settings (macOS)',
    },
    {
      path: '~/Library/Application Support/Windsurf/User/keybindings.json',
      name: 'Windsurf keybindings (macOS)',
    },
    {
      path: '~/Library/Application Support/Windsurf/User/snippets',
      name: 'Windsurf snippets (macOS)',
    },

    // JetBrains IDEs (common settings location)
    { path: '~/.config/JetBrains', name: 'JetBrains IDEs config' },

    // Sublime Text
    { path: '~/.config/sublime-text', name: 'Sublime Text config' },
    {
      path: '~/Library/Application Support/Sublime Text/Packages/User',
      name: 'Sublime Text User packages (macOS)',
    },

    // Emacs
    { path: '~/.emacs', name: '.emacs' },
    { path: '~/.emacs.d', name: 'Emacs config directory' },

    // Zed
    { path: '~/.config/zed', name: 'Zed editor config' },
  ],

  // Terminal emulators
  terminal: [
    { path: '~/.config/ghostty', name: 'Ghostty config' },
    { path: '~/.config/alacritty', name: 'Alacritty config' },
    { path: '~/.config/kitty', name: 'Kitty config' },
    { path: '~/.config/wezterm', name: 'WezTerm config' },
    { path: '~/.hyper.js', name: 'Hyper config' },
  ],
}

/**
 * macOS-specific files
 */
const MACOS_FILES = {
  appConfig: [
    { path: '~/.hammerspoon', name: 'Hammerspoon config' },
    { path: '~/.config/karabiner', name: 'Karabiner-Elements config' },
    { path: '~/.config/raycast', name: 'Raycast config' },
    { path: '~/.finicky.js', name: 'Finicky config' },
    { path: '~/.skhdrc', name: 'SKHD config' },
    { path: '~/.yabairc', name: 'Yabai config' },
  ],
  homebrew: [
    { path: '~/Brewfile', name: 'Homebrew Bundle' },
    { path: '~/.Brewfile', name: 'Homebrew Bundle (hidden)' },
  ],
}

/**
 * Linux-specific files
 */
const LINUX_FILES = {
  appConfig: [
    { path: '~/.config/flameshot', name: 'Flameshot config' },
    { path: '~/.config/ulauncher', name: 'Ulauncher config' },
    { path: '~/.config/i3', name: 'i3 window manager config' },
    { path: '~/.config/sway', name: 'Sway compositor config' },
    { path: '~/.config/hypr', name: 'Hyprland config' },
    { path: '~/.Xmodmap', name: 'Xmodmap (key remapping)' },
    { path: '~/keyd-default.conf.backup', name: 'keyd config backup' },
  ],
  gnome: [
    {
      path: '~/.local/share/gnome-shell/extensions',
      name: 'GNOME Shell extensions',
    },
    { path: '~/.config/gtk-3.0', name: 'GTK 3 settings' },
    { path: '~/.config/gtk-4.0', name: 'GTK 4 settings' },
  ],
  scripts: [{ path: '~/scripts', name: 'Custom scripts directory' }],
}

/**
 * Check if a file or directory exists and get its details
 */
function checkFileExists(filePath: string): {
  exists: boolean
  size?: number
  isDirectory: boolean
} {
  const absolutePath = expandTilde(filePath)

  try {
    const stats = fs.statSync(absolutePath)
    return {
      exists: true,
      size: stats.isDirectory() ? undefined : stats.size,
      isDirectory: stats.isDirectory(),
    }
  } catch (error) {
    return {
      exists: false,
      isDirectory: false,
    }
  }
}

/**
 * Discover common dotfiles and config files
 */
export function discoverConfigFiles(osType: OperatingSystem): DiscoveredFile[] {
  const discovered: DiscoveredFile[] = []

  // Add common files
  Object.entries(COMMON_FILES).forEach(([category, files]) => {
    files.forEach((file) => {
      const absolutePath = expandTilde(file.path)
      const fileInfo = checkFileExists(file.path)

      discovered.push({
        name: file.name,
        path: absolutePath,
        relativePath: getRelativePath(absolutePath),
        category: category as any,
        ...fileInfo,
      })
    })
  })

  // Add OS-specific files
  if (osType === 'macos') {
    Object.entries(MACOS_FILES).forEach(([category, files]) => {
      files.forEach((file) => {
        const absolutePath = expandTilde(file.path)
        const fileInfo = checkFileExists(file.path)

        discovered.push({
          name: file.name,
          path: absolutePath,
          relativePath: getRelativePath(absolutePath),
          category: category === 'homebrew' ? 'app-config' : 'app-config',
          ...fileInfo,
        })
      })
    })
  } else if (osType === 'linux') {
    Object.entries(LINUX_FILES).forEach(([category, files]) => {
      files.forEach((file) => {
        const absolutePath = expandTilde(file.path)
        const fileInfo = checkFileExists(file.path)

        discovered.push({
          name: file.name,
          path: absolutePath,
          relativePath: getRelativePath(absolutePath),
          category: category === 'scripts' ? 'other' : 'app-config',
          ...fileInfo,
        })
      })
    })
  }

  return discovered
}

/**
 * Get only files that exist
 */
export function getExistingFiles(osType: OperatingSystem): DiscoveredFile[] {
  return discoverConfigFiles(osType).filter((file) => file.exists)
}

/**
 * Group files by category
 */
export function groupFilesByCategory(
  files: DiscoveredFile[],
): Map<string, DiscoveredFile[]> {
  const grouped = new Map<string, DiscoveredFile[]>()

  files.forEach((file) => {
    const category = file.category
    if (!grouped.has(category)) {
      grouped.set(category, [])
    }
    grouped.get(category)!.push(file)
  })

  return grouped
}

/**
 * Format file for display in selection list
 */
export function formatFileForDisplay(file: DiscoveredFile): string {
  const sizeStr = file.isDirectory
    ? '(dir)'
    : file.size
      ? `(${formatBytes(file.size)})`
      : ''

  return `${file.name} ${sizeStr} - ${file.relativePath}`
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    shell: 'Shell Configuration',
    secrets: 'Secret Files (NOT tracked in git)',
    git: 'Git Configuration',
    devtools: 'Developer Tools & Languages',
    ssh: 'SSH Configuration',
    editor: 'Editor & IDE Configuration',
    terminal: 'Terminal Emulator Configuration',
    'app-config': 'Application Configuration',
    keybinding: 'Key Bindings',
    other: 'Other',
  }

  return names[category] || category
}
