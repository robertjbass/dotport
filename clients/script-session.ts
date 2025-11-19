import os from 'os'
import {
  detectRuntime,
  detectPackageManager,
  detectNodeVersionManager,
  detectRuntimeVersion,
  type NodeVersionManager,
  type Runtime,
  type PackageManager,
} from '../utils/detect-runtime'

class ScriptSessionClient {
  args: string[] | null
  operatingSystem: NodeJS.Platform | null
  script: string | null
  shell: string | null
  homeDirectory: string | null
  username: string | null
  runtime: Runtime | null
  runtimeVersion: string | null
  packageManager: PackageManager | null
  nodeVersionManager: NodeVersionManager | null

  constructor() {
    const args = process.argv.slice(2)
    const script = args[0]
    args.shift()
    this.args = args
    this.operatingSystem = os.platform()
    this.script = script
    const userInfo = os.userInfo()

    this.shell = userInfo.shell
    this.homeDirectory = userInfo.homedir
    this.username = userInfo.username
    this.runtime = detectRuntime()
    this.runtimeVersion = detectRuntimeVersion()
    this.packageManager = detectPackageManager()
    this.nodeVersionManager =
      this.runtime === 'node' ? detectNodeVersionManager() : null
  }
}

const ScriptSession = new ScriptSessionClient()
export default ScriptSession
