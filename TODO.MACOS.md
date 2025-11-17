# TODO

## Prepare dotfile and config backup

Set up a system to backup dotfiles and configs for easy machine switching.

### Files to backup:
- `.bashrc`
- `.zshrc` (includes fnm setup - configured with `--use-on-cd` flag)
- Ghostty settings (`~/.config/ghostty/config`)
- Hammerspoon config (`~/.hammerspoon/init.lua`)
- Karabiner-Elements config (`~/.config/karabiner/karabiner.json`)
- Git config (`.gitconfig`)
- SSH config (`~/.ssh/config`)
- fnm default Node version (stored in `~/.local/share/fnm`)
- Other relevant dotfiles

### Tasks:
- [ ] Create a dotfiles repository
- [ ] Create install/setup script for automated setup on new machines
  - Install fnm (NOT nvm) via Homebrew: `brew install fnm`
  - Set fnm default Node version: `fnm install 24 && fnm default 24`
  - Note: .zshrc already configured with `eval "$(fnm env --use-on-cd)"`
- [ ] Document any manual configuration steps
- [ ] Consider using GNU Stow or similar for symlink management
- [ ] Export Homebrew packages list: `brew bundle dump`
- [ ] Run `touch ~/.hushlogin` to suppress "Last login" message
- [ ] Setup Karabiner-Elements to remap Caps Lock to Escape
- [ ] **IMPORTANT - Security**: Move API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY) out of .zshrc
  - Create `~/.secrets` or `~/.env` file for sensitive keys
  - Add `~/.secrets` to .gitignore
  - Source it from .zshrc with `source ~/.secrets`
  - Rotate both API keys since they've been exposed

### Currently Installed Apps

#### Homebrew Casks (GUI Apps):
- hammerspoon
- Fonts: cascadia-code, cascadia-mono, fira-code, hack-nerd-font

#### Key Applications:
- **Terminals**: Ghostty, iTerm
- **Browsers**: Arc, Brave Browser, Google Chrome, Safari
- **Development**: Visual Studio Code, Visual Studio Code - Insiders, Windsurf, Docker, DBngin, TablePlus, RunJS, Insomnia
- **Communication**: Slack, Discord, Telegram, WhatsApp, Zoom, Notion, Slite
- **Productivity**: Raycast, Rectangle, AltTab, Karabiner-Elements, CleanShot X, Obsidian, Numi
- **Creative**: Figma, Screen Studio, Supercut, OBS, Audacity, GarageBand, iMovie, Motion
- **Utilities**: Keka, NordVPN, Tailscale, OpenVPN Connect, Ledger Live, balenaEtcher, Raspberry Pi Imager
- **Other**: Spotify, Steam, OpenEmu, Unity Hub, UTM, VNC Viewer, ChatGPT

#### Homebrew CLI Tools (selected key tools):
- **fnm** (Fast Node Manager - use instead of nvm, currently on Node v22.21.1 default)
- tmux, gh, cowsay, fortune, sshpass
- ffmpeg, sox (audio/video tools)
- mysql, mysql-client, postgresql@14 (databases)
- python@3.10, python@3.11, python@3.12, deno (programming languages)
- pipx, p7zip, tesseract
- Full list available via: `brew list --formula`

### Important Notes:
- **Node Version Manager**: Using **fnm** instead of nvm for faster shell startup
  - Automatically switches Node versions when cd'ing into projects (via `--use-on-cd`)
  - .zshrc includes `nvm` function that forwards to fnm for compatibility
  - Default version: Node v22.21.1 (LTS)
