import os from 'os'

class ScriptSessionClient {
  args: string[] | null
  operatingSystem: NodeJS.Platform | null
  script: string | null
  shell: string | null
  homeDirectory: string | null
  username: string | null

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
  }
}

const ScriptSession = new ScriptSessionClient()
export default ScriptSession
