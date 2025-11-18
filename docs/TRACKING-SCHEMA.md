# Package and Application Tracking Schema

This document describes the comprehensive tracking schema for packages, applications, editor extensions, system services, settings, and runtimes.

## Overview

The backup system now tracks not just dotfiles, but also:

- **Packages** - System packages and language-specific packages
- **Applications** - Installed GUI applications
- **Editor Extensions** - Extensions for VS Code, Cursor, Windsurf, Vim, Neovim, etc.
- **System Services** - systemd (Linux) and launchd (macOS) services
- **System Settings** - GNOME settings, macOS defaults, etc.
- **Runtimes** - Node.js, Python, Ruby, Go, Rust, Java, PHP, Deno versions

## Schema Structure

### Package Managers

Track packages installed via various package managers:

```typescript
type SystemPackagesConfig = {
  enabled: boolean
  packageManagers: {
    [osOrDistro: string]: PackageManager[]
  }
}

type PackageManager = {
  type: PackageManagerType
  enabled: boolean
  packages: PackageInfo[]
  exportedAt?: string
  exportPath?: string // e.g., 'macos/Brewfile'
  command?: string // e.g., 'brew bundle dump'
  restoreCommand?: string // e.g., 'brew bundle install'
}
```

#### Supported Package Managers

**macOS:**
- `homebrew` - Homebrew formulae (CLI tools)
- `homebrew-cask` - Homebrew casks (GUI apps)
- `mas` - Mac App Store apps

**Linux:**
- `apt` - Debian/Ubuntu package manager
- `dnf` - Fedora package manager
- `yum` - RHEL/CentOS package manager
- `pacman` - Arch Linux package manager
- `snap` - Snap packages
- `flatpak` - Flatpak packages

**Language-Specific:**
- `npm` - Node.js global packages
- `pnpm` - pnpm global packages
- `yarn` - Yarn global packages
- `pip` - Python packages
- `pipx` - Python applications
- `cargo` - Rust packages
- `gem` - Ruby packages
- `go` - Go packages

#### Package Export Commands

Each package manager has specific export/restore commands:

| Package Manager | Export Command | Restore Command |
|----------------|----------------|-----------------|
| Homebrew | `brew bundle dump --file=Brewfile --force` | `brew bundle install --file=Brewfile` |
| APT | `dpkg --get-selections > apt-packages.txt` | `sudo dpkg --set-selections < apt-packages.txt && sudo apt-get dselect-upgrade` |
| Pacman | `pacman -Qqe > pacman-packages.txt` | `sudo pacman -S --needed - < pacman-packages.txt` |
| npm | `npm list -g --depth=0 --json > npm-global.json` | (manual) |
| pip | `pip list --format=json > pip-packages.json` | `pip install -r requirements.txt` |

### Applications

Track installed GUI applications:

```typescript
type SystemApplicationsConfig = {
  enabled: boolean
  applications: {
    [osOrDistro: string]: ApplicationInfo[]
  }
}

type ApplicationInfo = {
  name: string
  version?: string
  path?: string
  bundleId?: string // macOS only
  installedVia?: PackageManagerType | 'manual' | 'app-store'
  category?: string // e.g., 'development', 'productivity'
}
```

### Editor Extensions

Track editor/IDE extensions, keybindings, settings, and snippets:

```typescript
type SystemExtensionsConfig = {
  enabled: boolean
  editors: {
    [osOrDistro: string]: EditorExtensions[]
  }
}

type EditorExtensions = {
  editor: EditorType
  enabled: boolean
  configPath?: string
  extensions: ExtensionInfo[]
  exportedAt?: string
  exportPath?: string // e.g., 'macos/.config/vscode-extensions.json'

  keybindingsPath?: string
  keybindingsBackedUp: boolean

  settingsPath?: string
  settingsBackedUp: boolean

  snippetsPath?: string
  snippetsBackedUp: boolean
}
```

#### Supported Editors

- `vscode` - Visual Studio Code
- `vscode-insiders` - VS Code Insiders
- `cursor` - Cursor (AI-powered IDE)
- `windsurf` - Windsurf (Codeium IDE)
- `vim` - Vim text editor
- `neovim` - Neovim
- `jetbrains-idea` - IntelliJ IDEA
- `jetbrains-pycharm` - PyCharm
- `jetbrains-webstorm` - WebStorm
- `jetbrains-other` - Other JetBrains IDEs
- `sublime` - Sublime Text
- `emacs` - Emacs
- `zed` - Zed editor

#### Editor Configuration Paths

**VS Code / Cursor / Windsurf (macOS):**
- Config: `~/Library/Application Support/{Editor}/User`
- Settings: `~/Library/Application Support/{Editor}/User/settings.json`
- Keybindings: `~/Library/Application Support/{Editor}/User/keybindings.json`
- Snippets: `~/Library/Application Support/{Editor}/User/snippets`

**VS Code / Cursor / Windsurf (Linux):**
- Config: `~/.config/{Editor}/User`
- Settings: `~/.config/{Editor}/User/settings.json`
- Keybindings: `~/.config/{Editor}/User/keybindings.json`
- Snippets: `~/.config/{Editor}/User/snippets`

**Vim:**
- Config: `~/.vimrc`
- Plugins: `~/.vim/plugged` (vim-plug) or `~/.vim/bundle` (Vundle)

**Neovim:**
- Config: `~/.config/nvim/init.vim`
- Plugins: `~/.local/share/nvim/site/pack/packer/start` (packer) or `~/.local/share/nvim/lazy` (lazy.nvim)

#### Extension List Commands

| Editor | Command |
|--------|---------|
| VS Code | `code --list-extensions --show-versions` |
| VS Code Insiders | `code-insiders --list-extensions --show-versions` |
| Cursor | `cursor --list-extensions --show-versions` |
| Windsurf | `windsurf --list-extensions --show-versions` |
| Vim | (detect from plugin manager directories) |
| Neovim | (detect from plugin manager directories) |

### System Services

Track system services (Linux systemd, macOS launchd):

```typescript
type SystemServicesConfig = {
  enabled: boolean
  services: {
    [osOrDistro: string]: SystemService[]
  }
}

type SystemService = {
  name: string
  type: 'systemd' | 'launchd'
  enabled: boolean
  state?: 'running' | 'stopped' | 'failed' | 'unknown'
  description?: string
  configPath?: string // Path to service file
  backupPath?: string // Path in dotfiles repo
}
```

**Example Linux Services:**
- `fix-trackpad-resume.service` - Trackpad resume fix
- `keyd.service` - Keyboard remapping daemon
- Custom user services

**Example macOS Services:**
- LaunchAgents in `~/Library/LaunchAgents`
- LaunchDaemons in `/Library/LaunchDaemons`

### System Settings

Track desktop environment and system settings:

```typescript
type SystemSettingsConfig = {
  enabled: boolean
  settings: {
    [osOrDistro: string]: SystemSettings[]
  }
}

type SystemSettings = {
  type: SettingsType
  enabled: boolean
  exportPath?: string
  exportedAt?: string
  keys?: string[] // Specific settings keys to track
  command?: string // Export command
  restoreCommand?: string // Restore command
}
```

#### Supported Settings Types

**Linux (GNOME):**
- `gnome-gsettings` - GNOME settings via gsettings
- `gnome-dconf` - GNOME configuration database
- `gnome-extensions` - GNOME Shell extensions
- `gnome-keybindings` - Custom keyboard shortcuts

**Linux (Other):**
- `kde-plasma` - KDE Plasma settings
- `xfce` - XFCE settings

**macOS:**
- `macos-defaults` - macOS system defaults

#### GNOME Settings Export/Restore

**Export gsettings:**
```bash
# Export all settings
dconf dump / > gnome-settings.dconf

# Export specific paths
gsettings list-recursively org.gnome.desktop > desktop-settings.txt
```

**Restore gsettings:**
```bash
# Restore from dump
dconf load / < gnome-settings.dconf

# Restore custom keybindings
gsettings set org.gnome.settings-daemon.plugins.media-keys custom-keybindings "['/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/']"
```

### Runtime Versions

Track programming language runtimes and their version managers:

```typescript
type SystemRuntimesConfig = {
  enabled: boolean
  runtimes: {
    [osOrDistro: string]: RuntimeVersion[]
  }
}

type RuntimeVersion = {
  type: RuntimeType
  manager?: string // e.g., 'fnm', 'nvm', 'pyenv', 'rbenv'
  versions: string[]
  defaultVersion?: string
  exportedAt?: string
  installCommand?: string
}
```

#### Supported Runtimes

| Runtime | Type | Version Managers |
|---------|------|------------------|
| Node.js | `node` | fnm, nvm, asdf, system |
| Python | `python` | pyenv, asdf, system |
| Ruby | `ruby` | rbenv, rvm, asdf, system |
| Go | `go` | system |
| Rust | `rust` | rustup |
| Java | `java` | sdkman, asdf, system |
| PHP | `php` | system |
| Deno | `deno` | system |

#### Version Manager Commands

**Node.js (fnm):**
```bash
# List versions
fnm list

# Install and set default
fnm install 24 && fnm default 24
```

**Python (pyenv):**
```bash
# List versions
pyenv versions

# Install and set global
pyenv install 3.11 && pyenv global 3.11
```

**Ruby (rbenv):**
```bash
# List versions
rbenv versions

# Install and set global
rbenv install 3.2.0 && rbenv global 3.2.0
```

## Storage Structure

All tracked data is organized by OS/distro in the dotfiles repository:

```
dotfiles/
├── macos/
│   ├── Brewfile                          # Homebrew packages
│   ├── mas-apps.txt                      # Mac App Store apps
│   ├── npm-global.json                   # npm packages
│   ├── .config/
│   │   ├── vscode-extensions.json        # VS Code extensions
│   │   ├── cursor-extensions.json        # Cursor extensions
│   │   └── ...
│   └── .zshrc                            # Shell config
├── debian/
│   ├── apt-packages.txt                  # APT packages
│   ├── snap-packages.txt                 # Snap packages
│   ├── pip-packages.json                 # Python packages
│   ├── gnome-settings.dconf              # GNOME settings
│   ├── systemd/
│   │   ├── fix-trackpad-resume.service   # Custom services
│   │   └── ...
│   ├── .config/
│   │   ├── vscode-extensions.json        # VS Code extensions
│   │   ├── ghostty/config                # Terminal config
│   │   └── ...
│   └── .zshrc                            # Shell config
└── schema.json                           # Complete backup schema
```

## Utilities

### Package Detection

```typescript
import { detectPackageManagers, createPackageManager } from './utils/package-detection'

// Detect available package managers
const managers = await detectPackageManagers('macos')

// Create package manager with packages
const homebrew = await createPackageManager('homebrew')
```

### Editor Detection

```typescript
import { detectInstalledEditors, createEditorExtensions } from './utils/editor-detection'

// Detect installed editors
const editors = await detectInstalledEditors('macos')

// Create editor extensions config
const vscodeExt = await createEditorExtensions('vscode', 'macos', 'macos')
```

### Runtime Detection

```typescript
import { detectAllRuntimes, detectNodeVersions } from './utils/runtime-detection'

// Detect all runtimes
const runtimes = await detectAllRuntimes()

// Detect specific runtime
const node = await detectNodeVersions()
```

## Restore Process

When restoring on a new machine, the schema provides all necessary information:

1. **Package Managers**: Use `restoreCommand` to install packages
2. **Applications**: Reinstall via package managers or manually
3. **Editor Extensions**:
   - VS Code-based: `cat extensions.json | xargs -L 1 code --install-extension`
   - Vim/Neovim: Plugin managers will auto-install from config
4. **System Services**: Copy service files and enable
5. **System Settings**: Run restore commands to apply settings
6. **Runtimes**: Use `installCommand` to install versions

## Example Schema

```json
{
  "version": "1.0.0",
  "packages": {
    "enabled": true,
    "packageManagers": {
      "macos": [
        {
          "type": "homebrew",
          "enabled": true,
          "packages": [
            { "name": "fnm", "version": "1.38.1" },
            { "name": "gh", "version": "2.40.1" }
          ],
          "exportPath": "macos/Brewfile",
          "command": "brew bundle dump --file=Brewfile --force",
          "restoreCommand": "brew bundle install --file=Brewfile"
        }
      ]
    }
  },
  "extensions": {
    "enabled": true,
    "editors": {
      "macos": [
        {
          "editor": "vscode",
          "enabled": true,
          "extensions": [
            {
              "id": "dbaeumer.vscode-eslint",
              "version": "2.4.4",
              "publisher": "dbaeumer",
              "enabled": true
            }
          ],
          "exportPath": "macos/.config/vscode-extensions.json",
          "keybindingsPath": "macos/.config/vscode-keybindings.json",
          "keybindingsBackedUp": true,
          "settingsPath": "macos/.config/vscode-settings.json",
          "settingsBackedUp": true
        }
      ]
    }
  },
  "runtimes": {
    "enabled": true,
    "runtimes": {
      "macos": [
        {
          "type": "node",
          "manager": "fnm",
          "versions": ["20.11.0", "22.21.1", "24.11.1"],
          "defaultVersion": "24.11.1",
          "installCommand": "fnm install 24.11.1 && fnm default 24.11.1"
        }
      ]
    }
  }
}
```

## Future Enhancements

- Auto-detect applications from `/Applications` (macOS) and `/usr/share/applications` (Linux)
- Browser extension tracking (Chrome, Firefox, Brave, Arc)
- Font tracking
- Terminal theme tracking
- Shell plugin tracking (Oh My Zsh, Fisher, etc.)
- Docker container/image lists
- Database exports
