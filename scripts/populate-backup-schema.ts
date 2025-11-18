import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import ScriptSession from '../clients/script-session'
import type {
  BackupSchema,
  DarwinConfig,
  DotfileConfig,
  DotfilesConfig,
  LinuxConfig,
  Metadata,
  Preferences,
  Runtimes,
} from '../types/backup-schema'

/**
 * Executes a command and returns the output, or null if it fails
 */
function safeExec(command: string): string | null {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim()
  } catch (error) {
    return null
  }
}

/**
 * Get Homebrew formulae (CLI tools)
 */
function getBrewFormulae(): string[] {
  const output = safeExec('brew list --formula')
  if (!output) return []
  return output.split('\n').filter(Boolean)
}

/**
 * Get Homebrew casks (GUI apps)
 */
function getBrewCasks(): string[] {
  const output = safeExec('brew list --cask')
  if (!output) return []
  return output.split('\n').filter(Boolean)
}

/**
 * Get Homebrew taps
 */
function getBrewTaps(): string[] {
  const output = safeExec('brew tap')
  if (!output) return []
  return output.split('\n').filter(Boolean)
}

/**
 * Get global npm packages
 */
function getNpmGlobalPackages(): string[] {
  const output = safeExec('npm list -g --depth=0 --json')
  if (!output) return []

  try {
    const parsed = JSON.parse(output)
    const dependencies = parsed.dependencies || {}
    return Object.keys(dependencies).filter((pkg) => pkg !== 'npm')
  } catch {
    return []
  }
}

/**
 * Get global pnpm packages
 */
function getPnpmGlobalPackages(): string[] {
  const output = safeExec('pnpm list -g --depth=0 --json')
  if (!output) return []

  try {
    const parsed = JSON.parse(output)
    if (Array.isArray(parsed) && parsed.length > 0) {
      const dependencies = parsed[0].dependencies || {}
      return Object.keys(dependencies)
    }
    return []
  } catch {
    return []
  }
}

/**
 * Get global yarn packages
 */
function getYarnGlobalPackages(): string[] {
  const output = safeExec('yarn global list --json 2>/dev/null')
  if (!output) return []

  try {
    // Yarn outputs multiple JSON objects, one per line
    const lines = output.split('\n').filter(Boolean)
    for (const line of lines) {
      const parsed = JSON.parse(line)
      if (parsed.type === 'tree' && parsed.data?.trees) {
        return parsed.data.trees.map((tree: any) => {
          // Format: "package@version"
          const name = tree.name.split('@')[0]
          return name
        })
      }
    }
    return []
  } catch {
    return []
  }
}

/**
 * Get pip user-installed packages
 */
function getPipPackages(): string[] {
  const output = safeExec('python3 -m pip list --user --format=freeze')
  if (!output) return []
  return output.split('\n').filter(Boolean)
}

/**
 * Get pipx packages
 */
function getPipxPackages(): string[] {
  const output = safeExec('pipx list --short 2>/dev/null')
  if (!output) return []
  return output.split('\n').filter(Boolean)
}

/**
 * Get Bun global packages
 */
function getBunGlobalPackages(): string[] {
  const output = safeExec('bun pm ls -g 2>/dev/null')
  if (!output) return []

  // Bun outputs package list, one per line
  return output
    .split('\n')
    .filter(Boolean)
    .filter((line) => !line.startsWith('├') && !line.startsWith('└'))
    .map((line) => line.trim())
}

/**
 * Get Deno installed packages/tools
 */
function getDenoInstalledPackages(): string[] {
  const output = safeExec('deno install --list 2>/dev/null')
  if (!output) return []

  // Parse deno install --list output
  const lines = output.split('\n').filter(Boolean)
  const packages: string[] = []

  for (const line of lines) {
    // Format varies, try to extract package names
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('No')) {
      packages.push(trimmed)
    }
  }

  return packages
}

/**
 * Get fnm Node versions and default
 */
function getFnmNodeVersions(): {
  defaultVersion: string | null
  installedVersions: string[]
} {
  const output = safeExec('fnm list')
  if (!output) {
    return { defaultVersion: null, installedVersions: [] }
  }

  const lines = output.split('\n').filter(Boolean)
  const versions: string[] = []
  let defaultVersion: string | null = null

  for (const line of lines) {
    // Example output:
    // * v22.21.1
    // * v24.11.1 default
    // * system
    if (line.includes('system')) continue

    const match = line.match(/\*?\s*v?([\d.]+)/)
    if (match) {
      const version = match[1]
      versions.push(version)

      if (line.includes('default')) {
        defaultVersion = version
      }
    }
  }

  return { defaultVersion, installedVersions: versions }
}

/**
 * Get apt packages (Linux)
 * Only returns user-installed packages, excluding:
 * - Base system packages (required/important/standard priority)
 * - Desktop environment packages (gnome-*, kde-*, xfce-*)
 * - Library packages (lib*, gir1.2-*, python3-*)
 * - Font packages (fonts-*)
 */
function getAptPackages(): string[] {
  // Get manually installed packages
  const manualPackages = safeExec('apt-mark showmanual')
  if (!manualPackages) return []

  // Get base system packages to exclude
  const basePackages = safeExec(
    "dpkg-query -Wf '${Package} ${Priority}\\n' | awk '$2 ~ /^(required|important|standard)$/ {print $1}'",
  )
  const basePackageSet = new Set(
    basePackages?.split('\n').filter(Boolean) || [],
  )

  // Patterns to exclude
  const excludePatterns = [
    /^lib.+/, // Library packages
    /^gir1\.2-.+/, // GObject introspection bindings
    /^python3-.+/, // Python libraries
    /^fonts-.+/, // Font packages
    /^gnome-.+/, // GNOME desktop packages
    /^kde-.+/, // KDE desktop packages
    /^xfce.+/, // XFCE desktop packages
    /^gcc-\d+-.+/, // GCC version-specific packages
    /^linux-(headers|image|modules)-.+/, // Kernel packages
  ]

  return manualPackages
    .split('\n')
    .filter(Boolean)
    .filter((pkg) => {
      // Exclude base system packages
      if (basePackageSet.has(pkg)) return false

      // Exclude packages matching patterns
      if (excludePatterns.some((pattern) => pattern.test(pkg))) return false

      return true
    })
}

/**
 * Get PPAs (Linux)
 */
function getAptPPAs(): string[] {
  const sourcesDir = '/etc/apt/sources.list.d/'
  if (!fs.existsSync(sourcesDir)) return []

  try {
    const files = fs.readdirSync(sourcesDir)
    return files.filter((file) => file.endsWith('.list'))
  } catch {
    return []
  }
}

/**
 * Get snap packages (Linux)
 */
function getSnapPackages(): string[] {
  const output = safeExec('snap list 2>/dev/null')
  if (!output) return []

  return output
    .split('\n')
    .slice(1) // Skip header
    .filter(Boolean)
    .map((line) => {
      const packageName = line.split(/\s+/)[0]
      return packageName
    })
}

/**
 * Get flatpak packages (Linux)
 */
function getFlatpakPackages(): string[] {
  const output = safeExec(
    'flatpak list --app --columns=application 2>/dev/null',
  )
  if (!output) return []
  return output.split('\n').filter(Boolean)
}

/**
 * Get flatpak remotes (Linux)
 */
function getFlatpakRemotes(): string[] {
  const output = safeExec('flatpak remotes --columns=name 2>/dev/null')
  if (!output) return []
  return output.split('\n').filter(Boolean)
}

/**
 * Detect runtimes and programming languages
 */
function detectRuntimes(): Runtimes {
  const nodeVersions = getFnmNodeVersions()

  return {
    node: {
      manager: detectNodeVersionManager() || 'fnm',
      defaultVersion: nodeVersions.defaultVersion,
      installedVersions: nodeVersions.installedVersions,
    },
    python: {
      defaultVersion:
        safeExec('python3 --version 2>/dev/null')?.split(' ')[1] || null,
      installedVersions: [], // TODO: Detect installed Python versions
    },
    ruby: {
      defaultVersion:
        safeExec('ruby --version 2>/dev/null')?.split(' ')[1] || null,
      installedVersions: [],
    },
    go: {
      version:
        safeExec('go version 2>/dev/null')?.split(' ')[2]?.replace('go', '') ||
        null,
    },
    rust: {
      version: safeExec('rustc --version 2>/dev/null')?.split(' ')[1] || null,
    },
    java: {
      defaultVersion:
        safeExec('java -version 2>&1')?.split('\n')[0]?.split('"')[1] || null,
      installedVersions: [],
    },
    databases: {
      mysql: safeExec('mysql --version 2>/dev/null')?.split(' ')[2] || null,
      postgresql: safeExec('psql --version 2>/dev/null')?.split(' ')[2] || null,
      mongodb: safeExec('mongod --version 2>/dev/null')?.split(' ')[2] || null,
      redis:
        safeExec('redis-server --version 2>/dev/null')?.split(' ')[2] || null,
      sqlite: safeExec('sqlite3 --version 2>/dev/null')?.split(' ')[0] || null,
    },
  }
}

/**
 * Detect dotfiles in home directory
 */
function detectDotfiles(): DotfilesConfig {
  const knownDotfiles = [
    '.zshrc',
    '.bashrc',
    '.bash_profile',
    '.hushlogin',
    '.p10k.zsh',
    '.tmux.conf',
    '.vimrc',
    '.gitconfig',
  ]

  const dotfiles: DotfilesConfig = {}
  const homeDir = ScriptSession.homeDirectory || os.homedir()

  console.log('🔍 Detecting dotfiles in home directory...')

  for (const filename of knownDotfiles) {
    const fullPath = path.join(homeDir, filename)
    const exists = fs.existsSync(fullPath)

    if (exists) {
      console.log(`  ✓ Found ${filename}`)
    }

    const dotfileConfig: DotfileConfig = {
      filename,
      detectedLocally: exists,
      dir: '~',
      path: fullPath,
      backupPath: `darwin/dotfiles/${filename}`,
      content: exists ? fs.readFileSync(fullPath, 'utf-8') : null,
      remoteGitLocation: exists
        ? `dotfile-backup-restore/darwin/dotfiles/${filename}`
        : null,
    }

    dotfiles[filename] = dotfileConfig
  }

  console.log('')
  return dotfiles
}

/**
 * Populate complete macOS config
 */
function populateDarwinConfig(): DarwinConfig {
  console.log('📦 Collecting macOS configuration...')

  const preferences: Preferences = {
    defaultTerminal: detectDefaultTerminal(),
    nodeVersionManager: detectNodeVersionManager(),
    packageManager: detectPackageManager(),
  }

  const metadata: Metadata = {
    hostname: ScriptSession.username || null,
    username: ScriptSession.username || null,
    shell: ScriptSession.shell || null,
    lastBackup: new Date().toISOString(),
  }

  return {
    metadata,
    preferences,
    packages: {
      homebrew: {
        formulae: getBrewFormulae(),
        casks: getBrewCasks(),
        taps: getBrewTaps(),
      },
      npm: { global: getNpmGlobalPackages() },
      pnpm: { global: getPnpmGlobalPackages() },
      yarn: { global: getYarnGlobalPackages() },
      pip: { packages: getPipPackages() },
      pipx: { packages: getPipxPackages() },
      bun: { global: getBunGlobalPackages() },
      deno: { installed: getDenoInstalledPackages() },
    },
    runtimes: detectRuntimes(),
    dotfiles: detectDotfiles(),
  }
}

/**
 * Populate complete Linux config
 */
function populateLinuxConfig(): LinuxConfig {
  console.log('📦 Collecting Linux configuration...')

  const preferences: Preferences = {
    defaultTerminal: detectDefaultTerminal(),
    nodeVersionManager: detectNodeVersionManager(),
    packageManager: detectPackageManager(),
  }

  const metadata: Metadata = {
    hostname: ScriptSession.username || null,
    username: ScriptSession.username || null,
    shell: ScriptSession.shell || null,
    lastBackup: new Date().toISOString(),
  }

  return {
    metadata,
    preferences,
    packages: {
      apt: {
        packages: getAptPackages(),
        ppas: getAptPPAs(),
      },
      snap: { packages: getSnapPackages() },
      flatpak: {
        packages: getFlatpakPackages(),
        remotes: getFlatpakRemotes(),
      },
      npm: { global: getNpmGlobalPackages() },
      pnpm: { global: getPnpmGlobalPackages() },
      yarn: { global: getYarnGlobalPackages() },
      pip: { packages: getPipPackages() },
      pipx: { packages: getPipxPackages() },
      bun: { global: getBunGlobalPackages() },
      deno: { installed: getDenoInstalledPackages() },
    },
    runtimes: detectRuntimes(),
    dotfiles: detectDotfiles(),
  }
}

/**
 * Detect default terminal application (macOS)
 */
function detectDefaultTerminal(): string | null {
  // Check for common terminal apps
  const terminals = ['ghostty', 'iterm', 'warp', 'alacritty', 'kitty']

  for (const term of terminals) {
    const output = safeExec(`pgrep -x ${term}`)
    if (output) return term
  }

  return null
}

/**
 * Detect which Node version manager is being used
 */
function detectNodeVersionManager(): string | null {
  // Check for fnm
  if (safeExec('which fnm')) return 'fnm'

  // Check for nvm (looks for the nvm function/directory)
  if (safeExec('[ -d "$HOME/.nvm" ] && echo "exists"')) return 'nvm'

  // Check for n
  if (safeExec('which n')) return 'n'

  // Check for asdf with nodejs plugin
  if (safeExec('asdf plugin list 2>/dev/null | grep nodejs')) return 'asdf'

  return null
}

/**
 * Detect preferred package manager
 */
function detectPackageManager(): string | null {
  // Check which package manager is installed and prioritize based on speed
  if (safeExec('which pnpm')) return 'pnpm'
  if (safeExec('which bun')) return 'bun'
  if (safeExec('which yarn')) return 'yarn'
  if (safeExec('which npm')) return 'npm'

  return null
}

/**
 * Main function - Populates the backup schema with package and system data
 */
export default async function populateBackupSchema() {
  console.log('🚀 Starting backup schema population...\n')

  // Read existing data.json to preserve other OS data
  const dataPath = path.join(process.cwd(), 'data.json')
  let existingData: Partial<BackupSchema> = {}

  if (fs.existsSync(dataPath)) {
    try {
      const content = fs.readFileSync(dataPath, 'utf-8')
      existingData = JSON.parse(content)
      console.log('📖 Loaded existing backup data\n')
    } catch (error) {
      console.warn('⚠️  Could not read existing data.json, creating new file\n')
    }
  }

  // Build backup data, preserving existing OS configs
  const backupData: Partial<BackupSchema> = {
    version: '1.0.0',
    // Preserve existing darwin/linux data
    darwin: existingData.darwin,
    linux: existingData.linux,
    shared: existingData.shared || {
      git: {
        config: {
          path: '~/.gitconfig',
          backupPath: 'shared/git/config',
          content: null, // TODO: Read git config
        },
      },
      ssh: {
        config: {
          path: '~/.ssh/config',
          backupPath: 'shared/ssh/config',
          content: null, // TODO: Read SSH config
        },
        note: 'SSH keys (id_rsa, etc.) are never backed up - only the config file',
      },
      secrets: {
        template: {
          path: '~/.env.sh.example',
          backupPath: 'shared/secrets/.env.sh.example',
          content: null, // TODO: Read secrets template
        },
        note: 'Actual secrets file (~/.env.sh) is never backed up - only the template',
      },
    },
  }

  // Only update the current OS section
  if (ScriptSession.operatingSystem === 'darwin') {
    console.log(
      '🍎 Updating macOS configuration (preserving Linux data if present)\n',
    )
    backupData.darwin = populateDarwinConfig()
  } else if (ScriptSession.operatingSystem === 'linux') {
    console.log(
      '🐧 Updating Linux configuration (preserving macOS data if present)\n',
    )
    backupData.linux = populateLinuxConfig()
  } else {
    console.error('❌ Unsupported operating system')
    process.exit(1)
  }

  // Write to data.json
  fs.writeFileSync(dataPath, JSON.stringify(backupData, null, 2))

  console.log('\n✅ Backup schema written to data.json')

  const currentConfig = backupData.darwin || backupData.linux
  if (currentConfig) {
    console.log('\n📊 System Info:')
    console.log(`  Hostname: ${currentConfig.metadata.hostname}`)
    console.log(`  Shell: ${currentConfig.metadata.shell}`)
    console.log(`  Last backup: ${currentConfig.metadata.lastBackup}`)

    console.log('\n⚙️  Preferences:')
    console.log(
      `  Terminal: ${currentConfig.preferences.defaultTerminal || 'not detected'}`,
    )
    console.log(
      `  Node manager: ${currentConfig.preferences.nodeVersionManager || 'not detected'}`,
    )
    console.log(
      `  Package manager: ${currentConfig.preferences.packageManager || 'not detected'}`,
    )

    console.log('\n📦 Packages:')
    if (backupData.darwin) {
      console.log(
        `  Homebrew formulae: ${backupData.darwin.packages.homebrew.formulae.length}`,
      )
      console.log(
        `  Homebrew casks: ${backupData.darwin.packages.homebrew.casks.length}`,
      )
      console.log(
        `  Homebrew taps: ${backupData.darwin.packages.homebrew.taps.length}`,
      )
    }
    if (backupData.linux) {
      console.log(
        `  APT packages: ${backupData.linux.packages.apt.packages.length}`,
      )
      console.log(
        `  Snap packages: ${backupData.linux.packages.snap.packages.length}`,
      )
      console.log(
        `  Flatpak packages: ${backupData.linux.packages.flatpak.packages.length}`,
      )
    }

    console.log(`  npm global: ${currentConfig.packages.npm.global.length}`)
    console.log(`  pnpm global: ${currentConfig.packages.pnpm.global.length}`)
    console.log(`  yarn global: ${currentConfig.packages.yarn.global.length}`)
    console.log(`  pipx: ${currentConfig.packages.pipx.packages.length}`)

    console.log('\n🔧 Runtimes:')
    console.log(
      `  Node: ${currentConfig.runtimes.node.installedVersions.join(', ')} (default: ${currentConfig.runtimes.node.defaultVersion})`,
    )
    if (currentConfig.runtimes.python.defaultVersion) {
      console.log(`  Python: ${currentConfig.runtimes.python.defaultVersion}`)
    }
    if (currentConfig.runtimes.go.version) {
      console.log(`  Go: ${currentConfig.runtimes.go.version}`)
    }
    if (currentConfig.runtimes.rust.version) {
      console.log(`  Rust: ${currentConfig.runtimes.rust.version}`)
    }
    if (currentConfig.runtimes.databases.mysql) {
      console.log(`  MySQL: ${currentConfig.runtimes.databases.mysql}`)
    }
    if (currentConfig.runtimes.databases.postgresql) {
      console.log(
        `  PostgreSQL: ${currentConfig.runtimes.databases.postgresql}`,
      )
    }
  }
}
