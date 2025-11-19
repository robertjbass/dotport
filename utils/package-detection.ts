/**
 * Package Manager Detection Utility
 *
 * Detects installed package managers and retrieves package lists
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import {
  PackageManager,
  PackageManagerType,
  PackageInfo,
  OperatingSystem,
} from '../types/backup-config'

const execAsync = promisify(exec)

/**
 * Check if a command exists in PATH
 */
async function commandExists(command: string): Promise<boolean> {
  try {
    await execAsync(`command -v ${command}`)
    return true
  } catch {
    return false
  }
}

/**
 * Detect available package managers based on OS
 */
export async function detectPackageManagers(
  os: OperatingSystem,
): Promise<PackageManagerType[]> {
  const managers: PackageManagerType[] = []

  // macOS package managers
  if (os === 'macos') {
    if (await commandExists('brew')) {
      managers.push('homebrew', 'homebrew-cask')
    }
    if (await commandExists('mas')) {
      managers.push('mas')
    }
  }

  // Linux package managers
  if (os === 'linux') {
    if (await commandExists('apt')) managers.push('apt')
    if (await commandExists('dnf')) managers.push('dnf')
    if (await commandExists('yum')) managers.push('yum')
    if (await commandExists('pacman')) managers.push('pacman')
  }

  // Cross-platform package managers
  if (await commandExists('snap')) managers.push('snap')
  if (await commandExists('flatpak')) managers.push('flatpak')

  // Language-specific package managers
  if (await commandExists('npm')) managers.push('npm')
  if (await commandExists('pnpm')) managers.push('pnpm')
  if (await commandExists('yarn')) managers.push('yarn')
  if (await commandExists('pip')) managers.push('pip')
  if (await commandExists('pipx')) managers.push('pipx')
  if (await commandExists('cargo')) managers.push('cargo')
  if (await commandExists('gem')) managers.push('gem')
  if (await commandExists('go')) managers.push('go')

  return managers
}

/**
 * Get packages for Homebrew (macOS)
 */
async function getHomebrewPackages(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync('brew list --formula --versions')
    return stdout
      .trim()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.trim().split(' ')
        const name = parts[0]
        const version = parts.slice(1).join(' ') || undefined
        return { name, version }
      })
  } catch (error: any) {
    // Silently handle the error - package manager may not be installed
    return []
  }
}

/**
 * Get Homebrew casks (macOS GUI apps)
 */
async function getHomebrewCasks(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync('brew list --cask --versions')
    return stdout
      .trim()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.trim().split(' ')
        const name = parts[0]
        const version = parts.slice(1).join(' ') || undefined
        return { name, version }
      })
  } catch (error: any) {
    // Silently handle the error - package manager may not be installed
    return []
  }
}

/**
 * Get Mac App Store apps
 */
async function getMasPackages(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync('mas list')
    return stdout
      .trim()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        // Format: "ID Name (Version)"
        const match = line.match(/^(\d+)\s+(.+?)\s+\(([^)]+)\)$/)
        if (match) {
          return {
            name: match[2],
            version: match[3],
          }
        }
        return { name: line.trim() }
      })
  } catch (error: any) {
    // Silently handle the error - package manager may not be installed
    return []
  }
}

/**
 * Get APT packages (Debian/Ubuntu)
 */
async function getAptPackages(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync(
      "apt list --installed 2>/dev/null | grep -v '^Listing'",
    )
    return stdout
      .trim()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        // Format: "package/distribution version arch [installed]"
        const parts = line.split(' ')
        const nameDistro = parts[0].split('/')
        const name = nameDistro[0]
        const version = parts[1]
        return { name, version }
      })
  } catch (error: any) {
    // Silently handle the error - package manager may not be installed
    return []
  }
}

/**
 * Get DNF/YUM packages (Fedora/RHEL)
 */
async function getDnfPackages(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync('dnf list installed')
    return stdout
      .trim()
      .split('\n')
      .slice(1) // Skip header
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(/\s+/)
        const nameArch = parts[0].split('.')
        const name = nameArch[0]
        const version = parts[1]
        return { name, version }
      })
  } catch (error: any) {
    // Silently handle the error - package manager may not be installed
    return []
  }
}

/**
 * Get Pacman packages (Arch)
 */
async function getPacmanPackages(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync('pacman -Q')
    return stdout
      .trim()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(' ')
        return { name: parts[0], version: parts[1] }
      })
  } catch (error: any) {
    // Silently handle the error - package manager may not be installed
    return []
  }
}

/**
 * Get Snap packages
 */
async function getSnapPackages(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync('snap list')
    return stdout
      .trim()
      .split('\n')
      .slice(1) // Skip header
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(/\s+/)
        return { name: parts[0], version: parts[1] }
      })
  } catch (error: any) {
    // Silently handle the error - package manager may not be installed
    return []
  }
}

/**
 * Get Flatpak packages
 */
async function getFlatpakPackages(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync('flatpak list --app --columns=name,version')
    return stdout
      .trim()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split('\t')
        return { name: parts[0], version: parts[1] }
      })
  } catch (error: any) {
    // Silently handle the error - package manager may not be installed
    return []
  }
}

/**
 * Get npm global packages
 */
async function getNpmPackages(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync('npm list -g --depth=0 --json')
    const data = JSON.parse(stdout)
    const packages: PackageInfo[] = []

    if (data.dependencies) {
      for (const [name, info] of Object.entries(data.dependencies)) {
        packages.push({
          name,
          version: (info as any).version,
        })
      }
    }

    return packages
  } catch (error: any) {
    // Silently handle the error - package manager may not be installed
    return []
  }
}

/**
 * Get pnpm global packages
 */
async function getPnpmPackages(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync('pnpm list -g --depth=0 --json')
    const data = JSON.parse(stdout)
    const packages: PackageInfo[] = []

    if (Array.isArray(data) && data[0]?.dependencies) {
      for (const [name, info] of Object.entries(data[0].dependencies)) {
        packages.push({
          name,
          version: (info as any).version,
        })
      }
    }

    return packages
  } catch (error: any) {
    // Silently handle the error - package manager may not be installed
    return []
  }
}

/**
 * Get yarn global packages
 */
async function getYarnPackages(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync('yarn global list --depth=0')
    return stdout
      .trim()
      .split('\n')
      .filter((line) => line.includes('@'))
      .map((line) => {
        const match = line.match(/- (.+)@(.+)/)
        if (match) {
          return { name: match[1], version: match[2] }
        }
        return { name: line.trim() }
      })
  } catch (error: any) {
    // Silently handle the error - package manager may not be installed
    return []
  }
}

/**
 * Get pip packages
 */
async function getPipPackages(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync('pip list --format=json')
    const data = JSON.parse(stdout)
    return data.map((pkg: any) => ({
      name: pkg.name,
      version: pkg.version,
    }))
  } catch (error: any) {
    // Silently handle the error - package manager may not be installed
    return []
  }
}

/**
 * Get pipx packages
 */
async function getPipxPackages(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync('pipx list --json')
    const data = JSON.parse(stdout)
    const packages: PackageInfo[] = []

    if (data.venvs) {
      for (const [name, info] of Object.entries(data.venvs)) {
        packages.push({
          name,
          version: (info as any).metadata?.main_package?.package_version,
        })
      }
    }

    return packages
  } catch (error: any) {
    // Silently handle the error - package manager may not be installed
    return []
  }
}

/**
 * Get cargo packages
 */
async function getCargoPackages(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync('cargo install --list')
    const packages: PackageInfo[] = []
    const lines = stdout.trim().split('\n')

    for (const line of lines) {
      const match = line.match(/^(\S+)\s+v(.+):$/)
      if (match) {
        packages.push({ name: match[1], version: match[2] })
      }
    }

    return packages
  } catch (error: any) {
    // Silently handle the error - package manager may not be installed
    return []
  }
}

/**
 * Get gem packages
 */
async function getGemPackages(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync('gem list --local')
    return stdout
      .trim()
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const match = line.match(/^(.+?)\s+\((.+?)\)/)
        if (match) {
          return { name: match[1], version: match[2] }
        }
        return { name: line.trim() }
      })
  } catch (error: any) {
    // Silently handle the error - package manager may not be installed
    return []
  }
}

/**
 * Get installed Go packages
 */
async function getGoPackages(): Promise<PackageInfo[]> {
  try {
    const { stdout } = await execAsync('go list -m all')
    return stdout
      .trim()
      .split('\n')
      .slice(1) // Skip first line (current module)
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(' ')
        return { name: parts[0], version: parts[1] }
      })
  } catch (error: any) {
    // Silently handle the error - this is expected when no go.mod exists
    return []
  }
}

/**
 * Get packages for a specific package manager
 */
export async function getPackagesForManager(
  type: PackageManagerType,
): Promise<PackageInfo[]> {
  switch (type) {
    case 'homebrew':
      return getHomebrewPackages()
    case 'homebrew-cask':
      return getHomebrewCasks()
    case 'mas':
      return getMasPackages()
    case 'apt':
      return getAptPackages()
    case 'dnf':
    case 'yum':
      return getDnfPackages()
    case 'pacman':
      return getPacmanPackages()
    case 'snap':
      return getSnapPackages()
    case 'flatpak':
      return getFlatpakPackages()
    case 'npm':
      return getNpmPackages()
    case 'pnpm':
      return getPnpmPackages()
    case 'yarn':
      return getYarnPackages()
    case 'pip':
      return getPipPackages()
    case 'pipx':
      return getPipxPackages()
    case 'cargo':
      return getCargoPackages()
    case 'gem':
      return getGemPackages()
    case 'go':
      return getGoPackages()
    default:
      return []
  }
}

/**
 * Get package manager export/restore commands
 */
export function getPackageManagerCommands(type: PackageManagerType): {
  command?: string
  restoreCommand?: string
  exportPath?: string
} {
  const commands: Record<
    PackageManagerType,
    { command?: string; restoreCommand?: string; exportPath?: string }
  > = {
    homebrew: {
      command: 'brew bundle dump --file=Brewfile --force',
      restoreCommand: 'brew bundle install --file=Brewfile',
      exportPath: 'Brewfile',
    },
    'homebrew-cask': {
      command: 'brew bundle dump --file=Brewfile --force',
      restoreCommand: 'brew bundle install --file=Brewfile',
      exportPath: 'Brewfile',
    },
    mas: {
      command: 'mas list > mas-apps.txt',
      exportPath: 'mas-apps.txt',
    },
    apt: {
      command: 'dpkg --get-selections > apt-packages.txt',
      restoreCommand: 'sudo dpkg --set-selections < apt-packages.txt && sudo apt-get dselect-upgrade',
      exportPath: 'apt-packages.txt',
    },
    dnf: {
      command: 'dnf list installed > dnf-packages.txt',
      exportPath: 'dnf-packages.txt',
    },
    yum: {
      command: 'yum list installed > yum-packages.txt',
      exportPath: 'yum-packages.txt',
    },
    pacman: {
      command: 'pacman -Qqe > pacman-packages.txt',
      restoreCommand: 'sudo pacman -S --needed - < pacman-packages.txt',
      exportPath: 'pacman-packages.txt',
    },
    snap: {
      command: 'snap list > snap-packages.txt',
      exportPath: 'snap-packages.txt',
    },
    flatpak: {
      command: 'flatpak list --app > flatpak-packages.txt',
      exportPath: 'flatpak-packages.txt',
    },
    npm: {
      command: 'npm list -g --depth=0 --json > npm-global.json',
      exportPath: 'npm-global.json',
    },
    pnpm: {
      command: 'pnpm list -g --depth=0 --json > pnpm-global.json',
      exportPath: 'pnpm-global.json',
    },
    yarn: {
      command: 'yarn global list > yarn-global.txt',
      exportPath: 'yarn-global.txt',
    },
    pip: {
      command: 'pip list --format=json > pip-packages.json',
      restoreCommand: 'pip install -r requirements.txt',
      exportPath: 'pip-packages.json',
    },
    pipx: {
      command: 'pipx list --json > pipx-packages.json',
      exportPath: 'pipx-packages.json',
    },
    cargo: {
      command: 'cargo install --list > cargo-packages.txt',
      exportPath: 'cargo-packages.txt',
    },
    gem: {
      command: 'gem list --local > gem-packages.txt',
      exportPath: 'gem-packages.txt',
    },
    go: {
      command: 'go list -m all > go-packages.txt',
      exportPath: 'go-packages.txt',
    },
  }

  return commands[type] || {}
}

/**
 * Create a PackageManager object with detected packages
 */
export async function createPackageManager(
  type: PackageManagerType,
): Promise<PackageManager> {
  const packages = await getPackagesForManager(type)
  const commands = getPackageManagerCommands(type)

  return {
    type,
    enabled: true,
    packages,
    ...commands,
  }
}
