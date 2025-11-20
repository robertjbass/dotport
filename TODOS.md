# Project TODOs

This document tracks remaining tasks and future enhancements for the dev-machine-backup-restore tool.

## Project Naming

**Current working name:** `dev-machine-backup-restore`

### Brainstorm Package Name
- [ ] Research npm package name availability
- [ ] Finalize name choice before publishing

**Name Candidates:**
- [ ] **dotshift** ✅ - Short, catchy. "Shift your dots anywhere" (AVAILABLE)
- [ ] **devsnap** ⚠️ - Developer snapshots. Quick and memorable (unpublished, available)
- [ ] **dotpack** ✅ - Pack up your dotfiles. Simple and clear (AVAILABLE)
- [ ] ~~**machina**~~ ❌ - Taken (finite state machine library)
- [ ] **dotporter** ✅ - Port your dots across machines (AVAILABLE)
- [ ] **envclone** ✅ - Clone your development environment (AVAILABLE)
- [ ] **setupkit** ✅ - Your development setup toolkit (AVAILABLE)
- [ ] **dotmover** ✅ - Move dots between machines (AVAILABLE)
- [ ] ~~**devsync**~~ ❌ - Taken (browser sync tool)
- [ ] **workstation-backup** ✅ - Descriptive but longer (AVAILABLE)

**Requirements:**
- Must be available on npm
- Should be descriptive or memorable
- Ideally short (1-2 words, under 12 characters)
- Easy to type and remember

---

## Code Cleanup

### Legacy Backup Removal
- [ ] Test new backup script thoroughly to confirm it works as expected
- [ ] Remove `backup-legacy.ts` once confirmed new backup script is stable
- [ ] Remove `backup-legacy` npm script from `package.json`
- [ ] Audit and remove unused functions/files that were ONLY used in legacy backup
- [ ] Update any documentation that references the old backup script

## High Priority

### Restore Functionality (Shared)
- [ ] Detect existing schema in dotfiles repo
- [ ] Clone dotfiles repo on new machine
- [ ] Parse schema to understand file structure
- [ ] Copy files from repo to home directory
- [ ] Create symlinks based on schema configuration
- [ ] Support for multiple OS/distro restoration
- [ ] Handle conflicts (existing files vs. repo files)
- [ ] **Version restoration options** - Prompt user to choose between:
  - Install exact versions from schema (reproducible environment)
  - Install latest available versions (security updates, new features)
  - Mixed mode: latest for languages/runtimes, exact for packages

### Package Manager Support (Shared)
- [x] Homebrew Bundle export (macOS) ✅
- [ ] Homebrew Bundle import/restore (macOS)
- [x] apt package list export (Debian/Ubuntu) ✅
- [ ] apt package list import/restore (Debian/Ubuntu)
- [ ] dnf/yum package list export/import (Fedora/RHEL)
- [ ] pacman package list export/import (Arch)
- [ ] Snap/Flatpak package lists export/import

### Application Detection & Installation (Shared)
- [ ] Detect installed applications
- [ ] Generate installation scripts per OS/distro
- [ ] Support for cask/mas on macOS
- [ ] Support for AUR on Arch

## Medium Priority

### Window Manager Support (Linux)
- [ ] i3/Sway config backup (file discovery already supports this)
- [ ] Hyprland config backup (file discovery already supports this)
- [x] GNOME Shell extensions (custom extensions backed up, third-party excluded) ✅
- [x] GNOME dconf settings (keybindings, interface settings, WM settings) ✅
- [ ] KDE Plasma settings export/import

### Update Workflow (Shared)
- [ ] Detect changed files since last backup
- [ ] Incremental updates to dotfiles repo
- [ ] Optional automatic commit messages
- [ ] Smart diff showing only meaningful changes

## Low Priority

### Interactive File Browser (Shared)
- [ ] Tree-view file selection
- [ ] Search/filter functionality
- [ ] Preview file contents before backup

### Diff and Sync (Shared)
- [ ] Show diffs between local and repo versions
- [ ] Selective sync (pull specific files)
- [ ] Conflict resolution UI

### Advanced Features (Shared)
- [ ] Multiple profile support (work/personal/etc.)
- [ ] Machine-specific configs
- [ ] Templating for dynamic configs (username, hostname, etc.)
- [ ] Pre/post install hooks

---

## OS-Specific TODOs

### macOS

#### Initial Setup Tasks
- [ ] **Create dotfiles repository** - Run `pnpm run setup` to create automatically
- [ ] **Security - Move API keys to secrets file**:
  - Create `~/.secrets` or `~/.zshsecrets` for sensitive environment variables
  - Remove ANTHROPIC_API_KEY, OPENAI_API_KEY from .zshrc
  - Source secrets file from .zshrc: `[ -f ~/.zshsecrets ] && source ~/.zshsecrets`
  - The backup tool automatically excludes secret files from git
- [ ] **Run `touch ~/.hushlogin`** - Suppress "Last login" message in terminal
- [ ] **Setup Karabiner-Elements** - Remap Caps Lock to Escape (config auto-backed up)

#### Restoration Tasks
- [ ] Install fnm via Homebrew: `brew install fnm`
- [ ] Set fnm default Node version: `fnm install 24 && fnm default 24`
- [ ] Note: .zshrc already configured with `eval "$(fnm env --use-on-cd)"`
- [ ] Restore Homebrew packages: `brew bundle install`
- [ ] Restore macOS system preferences (future enhancement)
- [ ] Restore Dock configuration (future enhancement)

#### Currently Installed Apps (Reference)

**Homebrew Casks (GUI Apps):**
- hammerspoon
- Fonts: cascadia-code, cascadia-mono, fira-code, hack-nerd-font

**Key Applications:**
- **Terminals**: Ghostty, iTerm
- **Browsers**: Arc, Brave Browser, Google Chrome, Safari
- **Development**: Visual Studio Code, Visual Studio Code - Insiders, Windsurf, Docker, DBngin, TablePlus, RunJS, Insomnia
- **Communication**: Slack, Discord, Telegram, WhatsApp, Zoom, Notion, Slite
- **Productivity**: Raycast, Rectangle, AltTab, Karabiner-Elements, CleanShot X, Obsidian, Numi
- **Creative**: Figma, Screen Studio, Supercut, OBS, Audacity, GarageBand, iMovie, Motion
- **Utilities**: Keka, NordVPN, Tailscale, OpenVPN Connect, Ledger Live, balenaEtcher, Raspberry Pi Imager
- **Other**: Spotify, Steam, OpenEmu, Unity Hub, UTM, VNC Viewer, ChatGPT

**Homebrew CLI Tools (selected key tools):**
- **fnm** (Fast Node Manager - use instead of nvm, currently on Node v22.21.1 default)
- tmux, gh, cowsay, fortune, sshpass
- ffmpeg, sox (audio/video tools)
- mysql, mysql-client, postgresql@14 (databases)
- python@3.10, python@3.11, python@3.12, deno (programming languages)
- pipx, p7zip, tesseract
- Full list available via: `brew list --formula`

**Important Notes:**
- **Node Version Manager**: Using **fnm** instead of nvm for faster shell startup
  - Automatically switches Node versions when cd'ing into projects (via `--use-on-cd`)
  - .zshrc includes `nvm` function that forwards to fnm for compatibility
  - Default version: Node v22.21.1 (LTS)

---

### Linux (Debian/Ubuntu)

#### Manual Backups Required

**System Configuration:**
- [ ] `~/keyd-default.conf.backup` - keyd keyboard remapping (backup of `/etc/keyd/default.conf`)
  - Command: `sudo cp /etc/keyd/default.conf ~/keyd-default.conf.backup`
- [ ] Systemd service files from `/etc/systemd/system/`
  - Example: `fix-trackpad-resume.service` (machine-specific)

**Secrets Files (Backup Separately - DO NOT COMMIT TO GIT):**
- [ ] `~/.zshsecrets` - Environment variables and secrets for zsh (if exists)
- [ ] `~/.bashsecrets` - Environment variables and secrets for bash (if exists)

**Important:** Secret files are handled by the backup tool's secret management feature. They are stored locally and NEVER committed to version control. The tool automatically adds them to `.gitignore`.

#### Restoration Script Outline

A complete restoration script should:

1. Install base packages (zsh, git, build tools, xorg-xmodmap, dconf-cli)
2. Install Ghostty from Debian repository
3. Set Ghostty as default terminal (GNOME settings + alternatives system)
4. Install fnm (Fast Node Manager) via `curl -fsSL https://fnm.vercel.app/install | bash`
5. Install Node.js 24 LTS via `fnm install --lts && fnm default 24`
6. Install other applications (flameshot, wmctrl, xdotool, ulauncher)
7. Install keyd via `sudo apt install -y keyd`
8. Restore keyd configuration via `sudo cp ~/keyd-default.conf.backup /etc/keyd/default.conf`
9. Enable and start keyd via `sudo systemctl enable keyd && sudo systemctl start keyd`
10. Copy custom scripts to `~/scripts/` and make executable
11. Copy GNOME Shell extensions to `~/.local/share/gnome-shell/extensions/`
12. Restart GNOME Shell (or log out/in)
13. Enable GNOME extensions via `gnome-extensions enable`
14. Copy config files to `~/.config/`
15. Restore shell dotfiles to `~/` (`.zshrc`, `.bashrc`, `.shell_common`, `.Xmodmap`, etc.)
16. Restore secrets files to `~/` (`.zshsecrets`, `.bashsecrets`) from secure backup
17. **Restore GNOME keybindings via dconf import** (automated via backup script):
    - `dconf load /org/gnome/settings-daemon/plugins/media-keys/ < ~/.config/dconf/gnome-keybindings.conf`
    - `dconf load /org/gnome/desktop/wm/keybindings/ < ~/.config/dconf/gnome-wm-keybindings.conf`
    - `dconf load /org/gnome/shell/keybindings/ < ~/.config/dconf/gnome-shell-keybindings.conf`
    - `dconf load /org/gnome/desktop/interface/ < ~/.config/dconf/gnome-interface.conf`
18. Run trackpad fix setup script (if needed): `~/scripts/setup-trackpad-fix.sh`
19. Run keyboard remapping script: `~/scripts/setup-keyboard-remapping.sh`
20. Set zsh as default shell via `chsh`

#### GNOME Extensions

**Custom Extensions (Backed Up):**

1. **Window Focus (`window-focus@custom`)** - Custom GNOME Shell extension for terminal window management
   - Location: `~/.local/share/gnome-shell/extensions/window-focus@custom/`
   - Files: `extension.js`, `metadata.json`
   - ✅ Automatically backed up (has `@custom` suffix)

**Third-Party Extensions (NOT Backed Up):**

2. **Advanced Alt-Tab (`advanced-alt-tab@G-dH.github.com`)** - Enhanced Alt-Tab window switcher
   - Location: `~/.local/share/gnome-shell/extensions/advanced-alt-tab@G-dH.github.com/`
   - ⚠️ Not backed up (third-party extension can be reinstalled from GNOME Extensions website)

#### GNOME Keybindings

Custom keybindings are managed via `dconf` (GNOME's configuration database).

**Automatic Backup:** When running the backup script on Linux, GNOME settings are automatically exported to `.config/dconf/` in your dotfiles repository. The following files are created:
- `gnome-keybindings.conf` - Custom keybindings (Alt+Space for ulauncher, Ctrl+Alt+T for terminal, etc.)
- `gnome-wm-keybindings.conf` - Window manager keybindings
- `gnome-shell-keybindings.conf` - GNOME Shell keybindings
- `gnome-interface.conf` - Desktop interface settings

**Manual Restoration:** To restore keybindings on a new system, you can either:
1. Use the backup script's restore functionality (automatically loads dconf files)
2. Manually import: `dconf load /org/gnome/settings-daemon/plugins/media-keys/ < ~/.config/dconf/gnome-keybindings.conf`

**Manual Configuration (Alternative):**

If you need to manually configure keybindings via `gsettings`:

**Custom Keybinding 0: Focus Terminal**
- **Name:** Focus Terminal
- **Binding:** `Ctrl+Alt+T`
- **Command:** `/home/bob/scripts/focus-terminal.sh`
- **Purpose:** Open new Ghostty window or focus existing one

**Custom Keybinding 1: Flameshot Screenshot**
- **Name:** Flameshot
- **Binding:** `Ctrl+4`
- **Command:** `sh -c "QT_QPA_PLATFORM=wayland flameshot gui"`
- **Purpose:** Take screenshots with Flameshot on Wayland

**Custom Keybinding 2: Ulauncher Toggle**
- **Name:** Toggle Ulauncher
- **Binding:** `Alt+Space`
- **Command:** `ulauncher-toggle`
- **Purpose:** Show/hide Ulauncher application launcher

#### Systemd Services

**Trackpad Resume Fix Service:**
- **Location:** `/etc/systemd/system/fix-trackpad-resume.service`
- **Purpose:** Fix trackpad after resume from suspend
- **Status:** Machine-specific, may need manual setup on new machines

**To check:**
```bash
systemctl status fix-trackpad-resume.service
```

#### Important Notes

- **Shell Configuration:** The `~/.shell_common` file is used to share configuration between zsh and bash. It contains tool configurations (pnpm, fnm) that should work across different shells. This file is sourced by `.zshrc` at startup.
- **Node.js Version Manager:** We use fnm instead of nvm for performance reasons. fnm is written in Rust and significantly faster, especially for shell initialization.
- **Ghostty Keybindings:**
  - **Global Shortcut:** `Super+Ctrl+\`` (Super key + Ctrl + backtick) - Toggle Ghostty from anywhere
    - **Status:** At time of writing, the global shortcut is not yet working despite being properly configured
    - **Troubleshooting:** May require logout/login or system restart to register with the desktop portal. GNOME 48+ supports global shortcuts via the XDG desktop portal. If it doesn't work after restart, this may be a known issue with the desktop portal implementation.
  - **New Tab:** `Ctrl+T` or `Alt+T` - Opens a new tab in the current Ghostty window
  - **New Window:** `Ctrl+N` or `Alt+N` - Opens a new Ghostty window
  - **Reload Config:** `Ctrl+Shift+,` (comma) - Reloads Ghostty configuration without restarting
  - All keybindings are configured in `~/.config/ghostty/config`
- **Terminal Focus:** Requires both the Python script AND the GNOME Shell extension to work
- **Extensions:** May need to reload GNOME Shell after copying extensions (Alt+F2, type `r`, Enter on X11; log out/in on Wayland)
- **Secrets Management:** Environment variables with sensitive data should be stored in `~/.zshsecrets` or `~/.bashsecrets` (not in main rc files) and added to `.gitignore`

---

**Last Updated:** 2025-01-18
