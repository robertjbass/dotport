# System Configuration Documentation

## System Information

- **Display Server:** Wayland
- **Desktop Environment:** GNOME
- **Default Shell:** zsh (`/usr/bin/zsh`)
- **OS:** Debian (kernel 6.12.48+deb13-amd64)

## Purpose

This document tracks all custom configurations, scripts, and applications that need to be backed up and restored. The goal is to create a shell script that can automatically install all applications and recreate all configurations on a fresh system.

## Applications to Install

### Ghostty Terminal Emulator

- **Main Repository:** https://debian.griffo.io/
- **Installation Guide:** https://debian.griffo.io/install-latest-ghostty-in-debian.html
- **Current Version:** 1.2.3
- **Important:** Ghostty updates are only available in Trixie and newer versions of Debian. Bookworm is not updated beyond 1.1.3.

**Set as Default Terminal:**

After installing Ghostty, set it as the default terminal emulator. **These commands must be run:**

```bash
# Set as GNOME default terminal
gsettings set org.gnome.desktop.default-applications.terminal exec 'ghostty'
gsettings set org.gnome.desktop.default-applications.terminal exec-arg ''

# Add to Debian alternatives system (priority 60) - MUST RUN ON ONE LINE
sudo update-alternatives --install /usr/bin/x-terminal-emulator x-terminal-emulator /usr/bin/ghostty 60

# Set as the default in alternatives system
sudo update-alternatives --set x-terminal-emulator /usr/bin/ghostty
```

**Important:** The `update-alternatives` commands must be run on a single line each (no line breaks).

### FNM (Fast Node Manager)

- **GitHub:** https://github.com/Schniz/fnm
- **Purpose:** Fast and simple Node.js version manager (replacement for nvm)
- **Current Version:** 1.38.1
- **Node.js Version:** v24.11.1 LTS

**Why fnm instead of nvm:**
- **Performance:** fnm is written in Rust and is significantly faster than nvm (which is written in bash)
- **Speed:** Shell initialization is much faster (no noticeable delay when opening new terminals)
- **Simplicity:** Cleaner, more modern codebase with better cross-shell support
- **Active Development:** More actively maintained with frequent updates

**Installation:**
```bash
curl -fsSL https://fnm.vercel.app/install | bash
```

**Configuration:** FNM is configured in `~/.shell_common` to keep it consistent with other tools like pnpm.

**Common Commands:**
- `fnm install --lts` - Install latest LTS version of Node.js
- `fnm install 20` - Install specific Node.js version
- `fnm use 24` - Switch to Node.js 24
- `fnm default 24` - Set Node.js 24 as default
- `fnm list` - List installed Node.js versions
- `fnm current` - Show currently active Node.js version

**Migration from nvm:** A `nvm()` function is defined in `.zshrc` that displays "use fnm instead of nvm" as a reminder to use fnm instead.

### Ulauncher (Application Launcher)

- **Purpose:** Fast application launcher similar to macOS Spotlight/Raycast - global search bar for apps, files, web searches
- **GitHub:** https://github.com/Ulauncher/Ulauncher
- **Website:** https://ulauncher.io/

**Installation:**
```bash
sudo apt update
sudo apt install ulauncher
```

**Configuration:**

Ulauncher runs in the background after installation. To set up the Alt+Space hotkey:

**Method 1: GNOME Settings (GUI)**
1. Open Settings → Keyboard → View and Customize Shortcuts
2. Scroll to bottom and click "+" to add custom shortcut
3. Set Name: `Toggle Ulauncher`
4. Set Command: `ulauncher-toggle`
5. Set Shortcut: Click "Set Shortcut" and press `Alt+Space`

**Method 2: Terminal (gsettings command)**
```bash
# Set the custom keybinding
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom2/ name 'Toggle Ulauncher'
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom2/ binding '<Alt>space'
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom2/ command 'ulauncher-toggle'

# Enable the custom keybinding
gsettings set org.gnome.settings-daemon.plugins.media-keys custom-keybindings "['/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/', '/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/', '/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom2/']"
```

**Autostart:**

Ulauncher should autostart automatically after installation. To verify:
```bash
# Check if ulauncher is running
pgrep -f ulauncher
```

If it's not running, you can start it with:
```bash
ulauncher &
```

**Usage:**
- Press `Alt+Space` to show Ulauncher
- Type to search for applications, files, or use web searches
- Customize in Ulauncher preferences (run `ulauncher-toggle` and type "preferences")

### Other Applications

- Flameshot (screenshot tool)
- wmctrl (window management)
- xdotool (X automation)

## Custom Scripts

All custom scripts are located in `~/scripts/`

### 1. Terminal Focus Helper (`~/scripts/focus-terminal-helper.py`)

**Purpose:** Focus or launch Ghostty terminal window via Ctrl+Alt+T keybinding

**Details:**
- Python script that checks if Ghostty is running
- Uses DBus to communicate with GNOME Shell extension to focus window
- Falls back to launching new window if focus fails
- Works with Wayland

**Dependencies:**
- GNOME Shell extension: `window-focus@custom`
- Ghostty window class: `com.mitchellh.ghostty`

### 2. Terminal Focus Wrapper (`~/scripts/focus-terminal.sh`)

**Purpose:** Bash wrapper that executes the Python helper

**Details:**
- Simple bash script that calls `focus-terminal-helper.py`
- Used by GNOME keybinding

### 3. Trackpad Fix (`~/scripts/setup-trackpad-fix.sh`)

**Purpose:** Fix trackpad resume issue on Debian

**Details:**
- Created to fix Lenovo ThinkPad trackpad bug and may not be needed on other machines
- Creates systemd service: `fix-trackpad-resume.service`
- Automatically reloads `psmouse` module after waking from sleep
- Fixes issue where trackpad stops working after resume from suspend
- Service file location: `/etc/systemd/system/fix-trackpad-resume.service`

**To restore:**
```bash
~/scripts/setup-trackpad-fix.sh
```

### 4. Keyboard Remapping (`~/scripts/setup-keyboard-remapping.sh`)

**Purpose:** Remap Page Up/Page Down keys to Left/Right Arrow keys on ThinkPad

**Details:**
- **Hardware-specific:** This remapping is for Lenovo ThinkPad to match MacBook arrow key layout
- Page Up → Left Arrow
- Page Down → Right Arrow
- This matches the MacBook layout where left/right arrow keys are taller than up/down
- Creates `~/.Xmodmap` file with the key remappings
- Uses `xmodmap` to apply the configuration

**To restore:**
```bash
~/scripts/setup-keyboard-remapping.sh
```

**Note:** The remapping persists across sessions and doesn't require running on every login.

### 5. System-wide Key Remapping with keyd

**Purpose:** System-level key remapping daemon for both keyboard shortcuts and copy/paste shortcuts

**Details:**
- **keyd** is a system-level key remapping daemon that works on Wayland
- Currently configured remappings:
  - Page Up → Left Arrow (for ThinkPad keyboard layout)
  - Page Down → Right Arrow (for ThinkPad keyboard layout)
  - Alt+C → Ctrl+C (copy - works alongside original Ctrl+C)
  - Alt+X → Ctrl+X (cut - works alongside original Ctrl+X)
  - Alt+V → Ctrl+V (paste - works alongside original Ctrl+V)
  - Alt+A → Ctrl+A (select all - works alongside original Ctrl+A)
  - Alt+Q → Alt+F4 (close focused window - like Cmd+Q on Mac)
- Configuration file: `/etc/keyd/default.conf`
- **IMPORTANT:** Back up `/etc/keyd/default.conf` - it contains all your custom key mappings

**Installation:**
```bash
sudo apt update
sudo apt install -y keyd
```

**Configuration file (`/etc/keyd/default.conf`):**
```ini
[ids]
*

[main]
pageup = left
pagedown = right

[alt]
c = C-c
x = C-x
v = C-v
a = C-a
q = A-f4
```

**IMPORTANT - Configuration Syntax:**
- Alt key combinations MUST be in a separate `[alt]` layer section
- DO NOT use `alt.c = C-c` syntax in the `[main]` section (this doesn't work!)
- The `[alt]` section defines what happens when Alt is held down with other keys

**Enable and start the service:**
```bash
sudo systemctl enable keyd
sudo systemctl start keyd
```

**Fix permissions (if keyd can't access input devices):**
```bash
# Add user to input and keyd groups
sudo usermod -aG input $USER
sudo usermod -aG keyd $USER

# Log out and log back in (or reboot) for group changes to take effect
# Then restart keyd
sudo systemctl restart keyd
```

**After editing the configuration file:**
```bash
# Restart keyd to apply changes (reload is NOT supported)
sudo systemctl restart keyd
```

**To verify it's working:**
```bash
# Check service status
sudo systemctl status keyd

# Monitor keypresses (press Ctrl+C to exit)
sudo keyd -m
```

**Backup and Restore:**

The keyd configuration file is located in `/etc/keyd/default.conf` and requires sudo to access.

To back up:
```bash
# Copy the config file to your home directory for backup
sudo cp /etc/keyd/default.conf ~/keyd-default.conf.backup

# Make it readable by your user
sudo chown $USER:$USER ~/keyd-default.conf.backup
```

To restore:
```bash
# Copy the backed up config to /etc/keyd/
sudo cp ~/keyd-default.conf.backup /etc/keyd/default.conf

# Restart keyd to apply the configuration
sudo systemctl restart keyd

# Verify it's running
sudo systemctl status keyd
```

**Note:** When backing up your system config, make sure to include `~/keyd-default.conf.backup` in your backup checklist. This file should be version-controlled or backed up alongside your dotfiles.

**How to Update keyd Configuration:**

When you make changes to your keyd configuration, follow these steps:

1. Edit the backup config file (optional but recommended):
```bash
# Edit the backup file in your home directory
nano ~/keyd-default.conf.backup
# Or edit directly: nano /etc/keyd/default.conf (requires sudo)
```

2. Copy the updated config to /etc/keyd/:
```bash
sudo cp ~/keyd-default.conf.backup /etc/keyd/default.conf
```

3. Restart keyd to apply changes:
```bash
sudo systemctl restart keyd
```

4. Verify it's working:
```bash
sudo systemctl status keyd
```

**IMPORTANT:** keyd does NOT support `reload` - you MUST use `restart` to apply configuration changes.

## Configuration Files

### Application Configs (`~/.config/`)

- **ghostty/** - Ghostty terminal configuration
  - **Custom keybindings configured:**
    - `Super+T` (Windows key + T) - Toggle quick terminal (dropdown terminal from top of screen)
    - `Ctrl+T` or `Alt+T` - Open new tab
    - `Ctrl+N` or `Alt+N` - Open new window
  - **Config file location:** `~/.config/ghostty/config`
  - **How to update Ghostty config:**
    1. Edit `~/.config/ghostty/config`
    2. Reload config: Press `Ctrl+Shift+,` (comma) while Ghostty is focused
    3. Or restart Ghostty: Close all Ghostty windows and reopen
  - **Note:** At time of writing, the `Super+T` global shortcut is configured but not yet working. May require logout/login or system restart to register with GNOME's desktop portal. The keybinding is set as `keybind = global:super+t=toggle_quick_terminal` in the config.
- **alacritty/** - Alacritty terminal configuration (legacy, replaced by Ghostty)
- **flameshot/** - Flameshot screenshot tool configuration
- **git/** - Git configuration
- **gtk-3.0/** - GTK 3 theming and settings
- **gtk-4.0/** - GTK 4 theming and settings
- **Code/** - VS Code settings and extensions

### Shell Configuration

- Shell dotfiles (`.zshrc`, `.zprofile`, `.bashrc`, etc.)
- `~/.shell_common` - **Common shell configuration file**

**Purpose of `~/.shell_common`:**

This file contains configuration that should be shared between different shells (zsh, bash, etc.). By keeping common configuration in one place, we avoid duplication and ensure consistency across shells.

**What's in `~/.shell_common`:**
- **PNPM configuration:** PATH setup for pnpm global packages
- **FNM (Fast Node Manager) configuration:** PATH setup and environment initialization for fnm

**How it works:**
- The file is sourced in `.zshrc` with: `[ -f "$HOME/.shell_common" ] && . "$HOME/.shell_common"`
- This ensures the same configuration is loaded regardless of which shell you use
- Keep shell-agnostic tools (like pnpm, fnm) in `.shell_common`
- Keep shell-specific functions and aliases in `.zshrc` or `.bashrc`

**IMPORTANT - Environment Variables and Secrets:**

Any environment variables containing secrets (API keys, tokens, passwords, etc.) saved in `.zshrc` or `.bashrc` should be moved to separate files:

- **For zsh:** Create `~/.zshsecrets` and source it from `.zshrc`
- **For bash:** Create `~/.bashsecrets` and source it from `.bashrc`

**Example in `.zshrc`:**
```bash
# Source secrets (if file exists)
[ -f ~/.zshsecrets ] && source ~/.zshsecrets
```

**Example in `.bashrc`:**
```bash
# Source secrets (if file exists)
[ -f ~/.bashsecrets ] && source ~/.bashsecrets
```

**Benefits:**
- Keep secrets out of version control (add `.zshsecrets` and `.bashsecrets` to `.gitignore`)
- Safely backup and share dotfiles without exposing sensitive data
- Restore main config files without worrying about committed secrets

**Custom Shell Functions in `.zshrc`:**

The following convenience functions are defined:
- `zshrc()` - Reloads `.zshrc` configuration (`source ~/.zshrc`)
- `bashrc()` - Reloads `.bashrc` configuration (`source ~/.bashrc`)
- `nvm()` - Displays message to use fnm instead of nvm (reminder function)
- `mkcd()` - Create directory and cd into it
- `todev()` - Navigate to `~/dev/` or `~/dev/<subdirectory>`
- `o()` - Open current directory in Nautilus file manager
- `conn()` - Connect to NordVPN (Boston server)
- `connf()` - Connect to NordVPN and launch Firefox private window
- `disco()` - Disconnect from NordVPN and clear terminal
- `focus_terminal()` - Run terminal focus script

## GNOME Shell Extensions

Location: `~/.local/share/gnome-shell/extensions/`

### 1. Window Focus Helper (`window-focus@custom`)

**Purpose:** Provides DBus interface for focusing windows by WM_CLASS

**Details:**
- Custom extension that enables window focusing via DBus
- Exports method: `org.gnome.Shell.Extensions.WindowFocus.FocusWindow`
- Required for terminal focus script to work
- Location: `~/.local/share/gnome-shell/extensions/window-focus@custom/`

**Files:**
- `extension.js` - Main extension code
- `metadata.json` - Extension metadata

### 2. Advanced Alt-Tab (`advanced-alt-tab@G-dH.github.com`)

**Purpose:** Enhanced Alt-Tab window switcher

**Location:** `~/.local/share/gnome-shell/extensions/advanced-alt-tab@G-dH.github.com/`

## GNOME Keybindings

Custom keybindings managed via `gsettings`:

### Custom Keybinding 0: Focus Terminal

- **Name:** Focus Terminal
- **Binding:** `Ctrl+Alt+T`
- **Command:** `/home/bob/scripts/focus-terminal.sh`
- **Purpose:** Open new Ghostty window or focus existing one

**To restore:**
```bash
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ name 'Focus Terminal'
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ binding '<Control><Alt>t'
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/ command '/home/bob/scripts/focus-terminal.sh'
```

### Custom Keybinding 1: Flameshot

- **Name:** Flameshot
- **Binding:** `Ctrl+4`
- **Command:** `sh -c "QT_QPA_PLATFORM=wayland flameshot gui"`
- **Purpose:** Launch Flameshot screenshot tool with Wayland support

**To restore:**
```bash
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/ name 'Flameshot'
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/ binding '<Control>4'
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/ command 'sh -c "QT_QPA_PLATFORM=wayland flameshot gui"'
```

### Custom Keybinding 2: Ulauncher

- **Name:** Toggle Ulauncher
- **Binding:** `Alt+Space`
- **Command:** `ulauncher-toggle`
- **Purpose:** Toggle Ulauncher application launcher (similar to macOS Spotlight/Raycast)

**To restore:**
```bash
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom2/ name 'Toggle Ulauncher'
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom2/ binding '<Alt>space'
gsettings set org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom2/ command 'ulauncher-toggle'
```

### Enable Custom Keybindings

After setting individual keybindings, enable them:
```bash
gsettings set org.gnome.settings-daemon.plugins.media-keys custom-keybindings "['/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/', '/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom1/', '/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom2/']"
```

## Systemd Services

### 1. Trackpad Resume Fix

- **Service:** `fix-trackpad-resume.service`
- **Location:** `/etc/systemd/system/fix-trackpad-resume.service`
- **Purpose:** Reload trackpad driver after sleep/resume
- **Note:** Created to fix Lenovo ThinkPad trackpad bug and may not be needed on other machines
- **Status:** Should be enabled

**To check:**
```bash
systemctl status fix-trackpad-resume.service
```

## Backup Checklist

### Directories to Backup

- [ ] `~/scripts/` - All custom scripts (terminal focus, trackpad fix, keyboard remapping)
- [ ] `~/.config/ghostty/` - Ghostty configuration
- [ ] `~/.config/alacritty/` - Alacritty configuration
- [ ] `~/.config/flameshot/` - Flameshot configuration
- [ ] `~/.config/ulauncher/` - Ulauncher configuration and preferences
- [ ] `~/.config/git/` - Git configuration
- [ ] `~/.config/gtk-3.0/` - GTK 3 settings
- [ ] `~/.config/gtk-4.0/` - GTK 4 settings
- [ ] `~/.config/Code/` - VS Code settings
- [ ] `~/.local/share/gnome-shell/extensions/` - GNOME extensions
- [ ] `~/` - Shell dotfiles (`.zshrc`, `.zprofile`, `.bashrc`, `.shell_common`, `.Xmodmap`, etc.)
- [ ] `~/keyd-default.conf.backup` - keyd keyboard remapping configuration (backup of `/etc/keyd/default.conf`)

### Secrets Files (Backup Separately - DO NOT COMMIT TO GIT)

- [ ] `~/.zshsecrets` - Environment variables and secrets for zsh (if exists)
- [ ] `~/.bashsecrets` - Environment variables and secrets for bash (if exists)

**Important:** These files should be backed up to a secure location but NEVER committed to version control. Add them to `.gitignore` if backing up dotfiles to a git repository.

### Settings to Export

- [ ] GNOME keybindings (gsettings)
- [ ] GNOME dconf settings
- [ ] Systemd service files from `/etc/systemd/system/`
- [ ] keyd configuration - Use `sudo cp /etc/keyd/default.conf ~/keyd-default.conf.backup` to back up (includes PageUp/PageDown and Alt+C/X/V/A shortcuts)

## Restoration Script Outline

A complete restoration script should:

1. Install base packages (zsh, git, build tools, xorg-xmodmap)
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
17. Set up GNOME keybindings via `gsettings` (including Ulauncher Alt+Space)
18. Run trackpad fix setup script (if needed): `~/scripts/setup-trackpad-fix.sh`
19. Run keyboard remapping script: `~/scripts/setup-keyboard-remapping.sh`
20. Set zsh as default shell via `chsh`

## Notes

- **Shell Configuration:** The `~/.shell_common` file is used to share configuration between zsh and bash. It contains tool configurations (pnpm, fnm) that should work across different shells. This file is sourced by `.zshrc` at startup.
- **Node.js Version Manager:** We use fnm instead of nvm for performance reasons. fnm is written in Rust and significantly faster, especially for shell initialization.
- **Keyboard Remapping (ThinkPad):** On the Lenovo ThinkPad, Page Up and Page Down keys are remapped to Left Arrow and Right Arrow respectively to match the MacBook arrow key layout (with tall left/right keys). This is done via xmodmap and persists across sessions. Run `~/scripts/setup-keyboard-remapping.sh` to apply.
- **Screenshot Hotkey:** Ctrl+4 is configured to launch Flameshot screenshot tool with Wayland support. The gsettings commands to restore this keybinding are documented in the GNOME Keybindings section.
- **Wayland-specific:** Flameshot requires `QT_QPA_PLATFORM=wayland` to work properly
- **Ghostty Window Class:** Uses `com.mitchellh.ghostty` as WM_CLASS (not just `ghostty`)
- **Ghostty Keybindings:**
  - **Quick Terminal:** `Super+T` (Windows key + T) - Toggles quick terminal that slides down from top of screen
    - Uses `global:` prefix to work system-wide: `keybind = global:super+t=toggle_quick_terminal`
    - **Status:** At time of writing, the global shortcut is not yet working despite being properly configured
    - **Troubleshooting:** May require logout/login or system restart to register with the desktop portal. GNOME 48+ supports global shortcuts via the XDG desktop portal. If it doesn't work after restart, this may be a known issue with the desktop portal implementation.
  - **New Tab:** `Ctrl+T` or `Alt+T` - Opens a new tab in the current Ghostty window
  - **New Window:** `Ctrl+N` or `Alt+N` - Opens a new Ghostty window
  - **Reload Config:** `Ctrl+Shift+,` (comma) - Reloads Ghostty configuration without restarting
  - All keybindings are configured in `~/.config/ghostty/config`
- **Terminal Focus:** Requires both the Python script AND the GNOME Shell extension to work
- **Extensions:** May need to reload GNOME Shell after copying extensions (Alt+F2, type `r`, Enter on X11; log out/in on Wayland)
- **Secrets Management:** Environment variables with sensitive data should be stored in `~/.zshsecrets` or `~/.bashsecrets` (not in main rc files) and added to `.gitignore`
