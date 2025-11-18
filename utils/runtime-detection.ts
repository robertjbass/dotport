/**
 * Runtime Version Detection Utility
 *
 * Detects installed runtime environments and version managers
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { RuntimeType, RuntimeVersion } from '../types/backup-config'

const execAsync = promisify(exec)

/**
 * Check if a command exists
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
 * Detect Node.js versions and version manager
 */
export async function detectNodeVersions(): Promise<RuntimeVersion | null> {
  const versions: string[] = []
  let manager: string | undefined
  let defaultVersion: string | undefined
  let installCommand: string | undefined

  // Check for fnm
  if (await commandExists('fnm')) {
    manager = 'fnm'
    try {
      const { stdout } = await execAsync('fnm list')
      const lines = stdout.trim().split('\n')
      for (const line of lines) {
        // fnm output: "v20.11.0 default"
        const match = line.match(/v?([\d.]+)/)
        if (match) {
          const version = match[1]
          versions.push(version)
          if (line.includes('default')) {
            defaultVersion = version
          }
        }
      }
      installCommand = `fnm install ${defaultVersion || 'lts'} && fnm default ${defaultVersion || 'lts'}`
    } catch (error) {
      console.error('Error detecting fnm versions:', error)
    }
  }
  // Check for nvm
  else if (await commandExists('nvm')) {
    manager = 'nvm'
    try {
      const { stdout } = await execAsync('nvm list')
      const lines = stdout.trim().split('\n')
      for (const line of lines) {
        const match = line.match(/v?([\d.]+)/)
        if (match) {
          const version = match[1]
          versions.push(version)
          if (line.includes('default')) {
            defaultVersion = version
          }
        }
      }
      installCommand = `nvm install ${defaultVersion || 'lts'} && nvm alias default ${defaultVersion || 'lts'}`
    } catch (error) {
      console.error('Error detecting nvm versions:', error)
    }
  }
  // Check for asdf
  else if (await commandExists('asdf')) {
    manager = 'asdf'
    try {
      const { stdout } = await execAsync('asdf list nodejs')
      versions.push(...stdout.trim().split('\n').map((v) => v.trim()))

      const { stdout: currentOut } = await execAsync('asdf current nodejs')
      const match = currentOut.match(/([\d.]+)/)
      if (match) {
        defaultVersion = match[1]
      }

      installCommand = `asdf install nodejs ${defaultVersion || 'latest'} && asdf global nodejs ${defaultVersion || 'latest'}`
    } catch (error) {
      console.error('Error detecting asdf nodejs versions:', error)
    }
  }
  // Check for system Node.js
  else if (await commandExists('node')) {
    manager = 'system'
    try {
      const { stdout } = await execAsync('node --version')
      const version = stdout.trim().replace('v', '')
      versions.push(version)
      defaultVersion = version
    } catch (error) {
      console.error('Error detecting node version:', error)
    }
  }

  if (versions.length === 0) return null

  return {
    type: 'node',
    manager,
    versions,
    defaultVersion,
    installCommand,
    exportedAt: new Date().toISOString(),
  }
}

/**
 * Detect Python versions and version manager
 */
export async function detectPythonVersions(): Promise<RuntimeVersion | null> {
  const versions: string[] = []
  let manager: string | undefined
  let defaultVersion: string | undefined
  let installCommand: string | undefined

  // Check for pyenv
  if (await commandExists('pyenv')) {
    manager = 'pyenv'
    try {
      const { stdout } = await execAsync('pyenv versions')
      const lines = stdout.trim().split('\n')
      for (const line of lines) {
        const match = line.match(/([\d.]+)/)
        if (match) {
          const version = match[1]
          versions.push(version)
          if (line.includes('*')) {
            defaultVersion = version
          }
        }
      }
      installCommand = `pyenv install ${defaultVersion || '3.11'} && pyenv global ${defaultVersion || '3.11'}`
    } catch (error) {
      console.error('Error detecting pyenv versions:', error)
    }
  }
  // Check for asdf
  else if (await commandExists('asdf')) {
    manager = 'asdf'
    try {
      const { stdout } = await execAsync('asdf list python')
      versions.push(...stdout.trim().split('\n').map((v) => v.trim()))

      const { stdout: currentOut } = await execAsync('asdf current python')
      const match = currentOut.match(/([\d.]+)/)
      if (match) {
        defaultVersion = match[1]
      }

      installCommand = `asdf install python ${defaultVersion || 'latest'} && asdf global python ${defaultVersion || 'latest'}`
    } catch (error) {
      console.error('Error detecting asdf python versions:', error)
    }
  }
  // Check for system Python
  else if (await commandExists('python3')) {
    manager = 'system'
    try {
      const { stdout } = await execAsync('python3 --version')
      const match = stdout.match(/([\d.]+)/)
      if (match) {
        const version = match[1]
        versions.push(version)
        defaultVersion = version
      }
    } catch (error) {
      console.error('Error detecting python version:', error)
    }
  }

  if (versions.length === 0) return null

  return {
    type: 'python',
    manager,
    versions,
    defaultVersion,
    installCommand,
    exportedAt: new Date().toISOString(),
  }
}

/**
 * Detect Ruby versions and version manager
 */
export async function detectRubyVersions(): Promise<RuntimeVersion | null> {
  const versions: string[] = []
  let manager: string | undefined
  let defaultVersion: string | undefined
  let installCommand: string | undefined

  // Check for rbenv
  if (await commandExists('rbenv')) {
    manager = 'rbenv'
    try {
      const { stdout } = await execAsync('rbenv versions')
      const lines = stdout.trim().split('\n')
      for (const line of lines) {
        const match = line.match(/([\d.]+)/)
        if (match) {
          const version = match[1]
          versions.push(version)
          if (line.includes('*')) {
            defaultVersion = version
          }
        }
      }
      installCommand = `rbenv install ${defaultVersion || '3.2.0'} && rbenv global ${defaultVersion || '3.2.0'}`
    } catch (error) {
      console.error('Error detecting rbenv versions:', error)
    }
  }
  // Check for rvm
  else if (await commandExists('rvm')) {
    manager = 'rvm'
    try {
      const { stdout } = await execAsync('rvm list')
      const lines = stdout.trim().split('\n')
      for (const line of lines) {
        const match = line.match(/ruby-([\d.]+)/)
        if (match) {
          const version = match[1]
          versions.push(version)
          if (line.includes('current') || line.includes('=*')) {
            defaultVersion = version
          }
        }
      }
      installCommand = `rvm install ${defaultVersion || '3.2.0'} && rvm use ${defaultVersion || '3.2.0'} --default`
    } catch (error) {
      console.error('Error detecting rvm versions:', error)
    }
  }
  // Check for asdf
  else if (await commandExists('asdf')) {
    manager = 'asdf'
    try {
      const { stdout } = await execAsync('asdf list ruby')
      versions.push(...stdout.trim().split('\n').map((v) => v.trim()))

      const { stdout: currentOut } = await execAsync('asdf current ruby')
      const match = currentOut.match(/([\d.]+)/)
      if (match) {
        defaultVersion = match[1]
      }

      installCommand = `asdf install ruby ${defaultVersion || 'latest'} && asdf global ruby ${defaultVersion || 'latest'}`
    } catch (error) {
      console.error('Error detecting asdf ruby versions:', error)
    }
  }
  // Check for system Ruby
  else if (await commandExists('ruby')) {
    manager = 'system'
    try {
      const { stdout } = await execAsync('ruby --version')
      const match = stdout.match(/ruby ([\d.]+)/)
      if (match) {
        const version = match[1]
        versions.push(version)
        defaultVersion = version
      }
    } catch (error) {
      console.error('Error detecting ruby version:', error)
    }
  }

  if (versions.length === 0) return null

  return {
    type: 'ruby',
    manager,
    versions,
    defaultVersion,
    installCommand,
    exportedAt: new Date().toISOString(),
  }
}

/**
 * Detect Go version
 */
export async function detectGoVersion(): Promise<RuntimeVersion | null> {
  if (!(await commandExists('go'))) return null

  try {
    const { stdout } = await execAsync('go version')
    const match = stdout.match(/go([\d.]+)/)
    if (match) {
      const version = match[1]
      return {
        type: 'go',
        manager: 'system',
        versions: [version],
        defaultVersion: version,
        exportedAt: new Date().toISOString(),
      }
    }
  } catch (error) {
    console.error('Error detecting go version:', error)
  }

  return null
}

/**
 * Detect Rust version
 */
export async function detectRustVersion(): Promise<RuntimeVersion | null> {
  if (!(await commandExists('rustc'))) return null

  try {
    const { stdout } = await execAsync('rustc --version')
    const match = stdout.match(/rustc ([\d.]+)/)
    if (match) {
      const version = match[1]
      return {
        type: 'rust',
        manager: 'rustup',
        versions: [version],
        defaultVersion: version,
        exportedAt: new Date().toISOString(),
      }
    }
  } catch (error) {
    console.error('Error detecting rust version:', error)
  }

  return null
}

/**
 * Detect Java version
 */
export async function detectJavaVersion(): Promise<RuntimeVersion | null> {
  const versions: string[] = []
  let manager: string | undefined
  let defaultVersion: string | undefined
  let installCommand: string | undefined

  // Check for SDKMAN
  if (await commandExists('sdk')) {
    manager = 'sdkman'
    try {
      const { stdout } = await execAsync('sdk list java | grep installed')
      const lines = stdout.trim().split('\n')
      for (const line of lines) {
        const match = line.match(/([\d.]+)/)
        if (match) {
          versions.push(match[1])
        }
      }

      const { stdout: currentOut } = await execAsync('sdk current java')
      const match = currentOut.match(/([\d.]+)/)
      if (match) {
        defaultVersion = match[1]
      }

      installCommand = `sdk install java ${defaultVersion || 'latest'}`
    } catch (error) {
      console.error('Error detecting sdkman java versions:', error)
    }
  }
  // Check for asdf
  else if (await commandExists('asdf')) {
    manager = 'asdf'
    try {
      const { stdout } = await execAsync('asdf list java')
      versions.push(...stdout.trim().split('\n').map((v) => v.trim()))

      const { stdout: currentOut } = await execAsync('asdf current java')
      const match = currentOut.match(/([\d.]+)/)
      if (match) {
        defaultVersion = match[1]
      }

      installCommand = `asdf install java ${defaultVersion || 'latest'} && asdf global java ${defaultVersion || 'latest'}`
    } catch (error) {
      console.error('Error detecting asdf java versions:', error)
    }
  }
  // Check for system Java
  else if (await commandExists('java')) {
    manager = 'system'
    try {
      const { stdout } = await execAsync('java -version 2>&1')
      const match = stdout.match(/version "?([\d._]+)"?/)
      if (match) {
        const version = match[1].replace(/_/g, '.')
        versions.push(version)
        defaultVersion = version
      }
    } catch (error) {
      console.error('Error detecting java version:', error)
    }
  }

  if (versions.length === 0) return null

  return {
    type: 'java',
    manager,
    versions,
    defaultVersion,
    installCommand,
    exportedAt: new Date().toISOString(),
  }
}

/**
 * Detect PHP version
 */
export async function detectPhpVersion(): Promise<RuntimeVersion | null> {
  if (!(await commandExists('php'))) return null

  try {
    const { stdout } = await execAsync('php --version')
    const match = stdout.match(/PHP ([\d.]+)/)
    if (match) {
      const version = match[1]
      return {
        type: 'php',
        manager: 'system',
        versions: [version],
        defaultVersion: version,
        exportedAt: new Date().toISOString(),
      }
    }
  } catch (error) {
    console.error('Error detecting php version:', error)
  }

  return null
}

/**
 * Detect Deno version
 */
export async function detectDenoVersion(): Promise<RuntimeVersion | null> {
  if (!(await commandExists('deno'))) return null

  try {
    const { stdout } = await execAsync('deno --version')
    const match = stdout.match(/deno ([\d.]+)/)
    if (match) {
      const version = match[1]
      return {
        type: 'deno',
        manager: 'system',
        versions: [version],
        defaultVersion: version,
        exportedAt: new Date().toISOString(),
      }
    }
  } catch (error) {
    console.error('Error detecting deno version:', error)
  }

  return null
}

/**
 * Detect all installed runtimes
 */
export async function detectAllRuntimes(): Promise<RuntimeVersion[]> {
  const runtimes: RuntimeVersion[] = []

  const detectors = [
    detectNodeVersions,
    detectPythonVersions,
    detectRubyVersions,
    detectGoVersion,
    detectRustVersion,
    detectJavaVersion,
    detectPhpVersion,
    detectDenoVersion,
  ]

  for (const detector of detectors) {
    const runtime = await detector()
    if (runtime) {
      runtimes.push(runtime)
    }
  }

  return runtimes
}
