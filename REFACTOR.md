# TODO

- [ ] Update Schema Structure to massively simplify it

New Intended Structure (not exact, use for motivation):

```json
{
  "version": "1.0.0",
    "metadata": {
    "createdAt": "2025-11-18T06:58:56.107Z",
    "updatedAt": "2025-11-19T04:45:54.309Z"
  },
  "repo": {
    "repoType": "github",
    "repoName": "dotfiles",
    "repoUrl": "https://github.com/robertjbass/dotfiles.git",
    "repoOwner": "bob",
    "branch": "main",
    "visibility": "private"
  },
  "systems": [
    {
      "os": "macos",
      "distro": "darwin",
      "nickname": "macbook-air-m2",
      "repoPath": "macos-darwin-macbook-air-m2",
      "shell": "zsh",
      "shellConfigFile": ".zshrc"
    },
    {
      "os": "linux",
      "distro": "debian",
      "nickname": "lenovo-thinkpad",
      "shell": "zsh",
      "shellConfigFile": ".zshrc",
      "repoPath": "linux-debian-lenovo-thinkpad"
    }
  ],
  "dotfiles": {
    "linux-debian-lenovo-thinkpad": {
      "tracked-files": {
        "cloneLocation": "/Users/bob/dev/dotfiles",
        "files": []
      },
      "secrets": {
        "enabled": false,
        "secretFile": {
          "name": ".env.sh",
          "location": "~",
          "format": "shell-export"
        },
        "storage": {
          "type": "local-only"
        },
        "trackedSecrets": {}
      },
      "symlinks": {
        "enabled": true,
        "strategy": "direct",
        "conflictResolution": "ask",
        "backupLocation": "~/.dotfiles-backup"
      },
      "packages": {
        "enabled": true,
        "packageManagers": {...}
      },
      "applications": {
        "enabled": false,
        "applications": {...}
      },
      "extensions": {
        "enabled": true,
        "editors": {...}
      },
      "services": {
        "enabled": false,
        "services": {...}
      },
      "settings": {
        "enabled": false,
        "settings": {}
      },
      "runtimes": {
        "enabled": true,
        "runtimes": {...}
      }
    },
    "macos-darwin-macbook-air-m2": {...}
  }
}


```

The old structure for context:

```json
{
  "version": "1.0.0",
  "multiOS": {
    "enabled": true,
    "supportedOS": ["macos", "linux"],
    "linuxDistros": ["debian"]
  },
  "dotfiles": {
    "enabled": true,
    "repoType": "github",
    "repoName": "dotfiles",
    "repoUrl": "https://github.com/robertjbass/dotfiles.git",
    "repoOwner": "",
    "branch": "main",
    "visibility": "private",
    "structure": {
      "type": "nested",
      "directories": {
        "macos": "macos/",
        "debian": "debian/"
      }
    },
    "trackedFiles": {
      "macos": {
        "cloneLocation": "/Users/bob/dev/dotfiles",
        "files": [
          {
            "name": ".bashrc",
            "sourcePath": "~/.bashrc",
            "repoPath": "macos/.bashrc",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".zshrc",
            "sourcePath": "~/.zshrc",
            "repoPath": "macos/.zshrc",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".zprofile",
            "sourcePath": "~/.zprofile",
            "repoPath": "macos/.zprofile",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".zshenv",
            "sourcePath": "~/.zshenv",
            "repoPath": "macos/.zshenv",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".p10k.zsh",
            "sourcePath": "~/.p10k.zsh",
            "repoPath": "macos/.p10k.zsh",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".profile",
            "sourcePath": "~/.profile",
            "repoPath": "macos/.profile",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".gitconfig",
            "sourcePath": "~/.gitconfig",
            "repoPath": "macos/.gitconfig",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".config/git/ignore",
            "sourcePath": "~/.config/git/ignore",
            "repoPath": "macos/.config/git/ignore",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".ssh/config",
            "sourcePath": "~/.ssh/config",
            "repoPath": "macos/.ssh/config",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": "Library/Application Support/Code/User/keybindings.json",
            "sourcePath": "~/Library/Application Support/Code/User/keybindings.json",
            "repoPath": "macos/Library/Application Support/Code/User/keybindings.json",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": "Library/Application Support/Code/User/snippets",
            "sourcePath": "~/Library/Application Support/Code/User/snippets",
            "repoPath": "macos/Library/Application Support/Code/User/snippets",
            "symlinkEnabled": false,
            "tracked": true
          },
          {
            "name": "Library/Application Support/Windsurf/User/settings.json",
            "sourcePath": "~/Library/Application Support/Windsurf/User/settings.json",
            "repoPath": "macos/Library/Application Support/Windsurf/User/settings.json",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": "Library/Application Support/Windsurf/User/keybindings.json",
            "sourcePath": "~/Library/Application Support/Windsurf/User/keybindings.json",
            "repoPath": "macos/Library/Application Support/Windsurf/User/keybindings.json",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": "Library/Application Support/Windsurf/User/snippets",
            "sourcePath": "~/Library/Application Support/Windsurf/User/snippets",
            "repoPath": "macos/Library/Application Support/Windsurf/User/snippets",
            "symlinkEnabled": false,
            "tracked": true
          },
          {
            "name": ".config/ghostty",
            "sourcePath": "~/.config/ghostty",
            "repoPath": "macos/.config/ghostty",
            "symlinkEnabled": false,
            "tracked": true
          }
        ]
      },
      "debian": {
        "cloneLocation": "/home/bob/dev/dotfiles",
        "files": [
          {
            "name": ".bashrc",
            "sourcePath": "~/.bashrc",
            "repoPath": "debian/.bashrc",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".zshrc",
            "sourcePath": "~/.zshrc",
            "repoPath": "debian/.zshrc",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".shell_common",
            "sourcePath": "~/.shell_common",
            "repoPath": "debian/.shell_common",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".profile",
            "sourcePath": "~/.profile",
            "repoPath": "debian/.profile",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".gitconfig",
            "sourcePath": "~/.gitconfig",
            "repoPath": "debian/.gitconfig",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".config/git/ignore",
            "sourcePath": "~/.config/git/ignore",
            "repoPath": "debian/.config/git/ignore",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".config/Code/User/settings.json",
            "sourcePath": "~/.config/Code/User/settings.json",
            "repoPath": "debian/.config/Code/User/settings.json",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".config/Code/User/keybindings.json",
            "sourcePath": "~/.config/Code/User/keybindings.json",
            "repoPath": "debian/.config/Code/User/keybindings.json",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".config/Code/User/snippets",
            "sourcePath": "~/.config/Code/User/snippets",
            "repoPath": "debian/.config/Code/User/snippets",
            "symlinkEnabled": false,
            "tracked": true
          },
          {
            "name": ".config/Windsurf/User/settings.json",
            "sourcePath": "~/.config/Windsurf/User/settings.json",
            "repoPath": "debian/.config/Windsurf/User/settings.json",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".config/Windsurf/User/snippets",
            "sourcePath": "~/.config/Windsurf/User/snippets",
            "repoPath": "debian/.config/Windsurf/User/snippets",
            "symlinkEnabled": false,
            "tracked": true
          },
          {
            "name": ".config/ghostty",
            "sourcePath": "~/.config/ghostty",
            "repoPath": "debian/.config/ghostty",
            "symlinkEnabled": false,
            "tracked": true
          },
          {
            "name": ".config/alacritty",
            "sourcePath": "~/.config/alacritty",
            "repoPath": "debian/.config/alacritty",
            "symlinkEnabled": false,
            "tracked": true
          },
          {
            "name": ".config/flameshot",
            "sourcePath": "~/.config/flameshot",
            "repoPath": "debian/.config/flameshot",
            "symlinkEnabled": false,
            "tracked": true
          },
          {
            "name": ".config/ulauncher",
            "sourcePath": "~/.config/ulauncher",
            "repoPath": "debian/.config/ulauncher",
            "symlinkEnabled": false,
            "tracked": true
          },
          {
            "name": ".Xmodmap",
            "sourcePath": "~/.Xmodmap",
            "repoPath": "debian/.Xmodmap",
            "symlinkEnabled": true,
            "tracked": true
          },
          {
            "name": ".local/share/gnome-shell/extensions",
            "sourcePath": "~/.local/share/gnome-shell/extensions",
            "repoPath": "debian/.local/share/gnome-shell/extensions",
            "symlinkEnabled": false,
            "tracked": true
          },
          {
            "name": ".config/gtk-3.0",
            "sourcePath": "~/.config/gtk-3.0",
            "repoPath": "debian/.config/gtk-3.0",
            "symlinkEnabled": false,
            "tracked": true
          },
          {
            "name": ".config/gtk-4.0",
            "sourcePath": "~/.config/gtk-4.0",
            "repoPath": "debian/.config/gtk-4.0",
            "symlinkEnabled": false,
            "tracked": true
          },
          {
            "name": "scripts",
            "sourcePath": "~/scripts",
            "repoPath": "debian/scripts",
            "symlinkEnabled": false,
            "tracked": true
          }
        ]
      }
    }
  },
  "secrets": {
    "enabled": false,
    "secretFile": {
      "name": ".env.sh",
      "location": "~",
      "format": "shell-export"
    },
    "storage": {
      "type": "local-only"
    },
    "trackedSecrets": {}
  },
  "symlinks": {
    "enabled": true,
    "strategy": "direct",
    "conflictResolution": "ask",
    "backupLocation": "~/.dotfiles-backup"
  },
  "packages": {
    "enabled": true,
    "packageManagers": {
      "macos": [
        {
          "type": "homebrew",
          "enabled": true,
          "packages": [
            {
              "name": "abseil",
              "version": "20240116.2"
            },
            {
              "name": "aom",
              "version": "3.9.1"
            },
            {
              "name": "aribb24",
              "version": "1.0.4"
            },
            {
              "name": "brotli",
              "version": "1.1.0"
            },
            {
              "name": "ca-certificates",
              "version": "2025-09-09"
            },
            {
              "name": "cairo",
              "version": "1.18.0"
            },
            {
              "name": "cjson",
              "version": "1.7.18"
            },
            {
              "name": "dav1d",
              "version": "1.4.3"
            },
            {
              "name": "deno",
              "version": "1.45.2"
            },
            {
              "name": "ffmpeg",
              "version": "7.0.1"
            },
            {
              "name": "flac",
              "version": "1.4.3"
            },
            {
              "name": "fnm",
              "version": "1.38.1"
            },
            {
              "name": "fontconfig",
              "version": "2.15.0"
            },
            {
              "name": "freetype",
              "version": "2.13.2"
            },
            {
              "name": "frei0r",
              "version": "2.3.3"
            },
            {
              "name": "fribidi",
              "version": "1.0.15"
            },
            {
              "name": "gdbm",
              "version": "1.24"
            },
            {
              "name": "gettext",
              "version": "0.22.5"
            },
            {
              "name": "gh",
              "version": "2.82.1"
            },
            {
              "name": "giflib",
              "version": "5.2.2"
            },
            {
              "name": "glib",
              "version": "2.80.4"
            },
            {
              "name": "gmp",
              "version": "6.3.0"
            },
            {
              "name": "gnutls",
              "version": "3.8.4"
            },
            {
              "name": "graphite2",
              "version": "1.3.14"
            },
            {
              "name": "harfbuzz",
              "version": "9.0.0"
            },
            {
              "name": "highway",
              "version": "1.2.0"
            },
            {
              "name": "icu4c",
              "version": "74.2"
            },
            {
              "name": "imath",
              "version": "3.1.11"
            },
            {
              "name": "jpeg-turbo",
              "version": "3.0.3"
            },
            {
              "name": "jpeg-xl",
              "version": "0.10.3"
            },
            {
              "name": "krb5",
              "version": "1.21.3"
            },
            {
              "name": "lame",
              "version": "3.100"
            },
            {
              "name": "leptonica",
              "version": "1.84.1"
            },
            {
              "name": "libarchive",
              "version": "3.7.4"
            },
            {
              "name": "libass",
              "version": "0.17.3"
            },
            {
              "name": "libb2",
              "version": "0.98.1"
            },
            {
              "name": "libbluray",
              "version": "1.3.4"
            },
            {
              "name": "libcbor",
              "version": "0.11.0"
            },
            {
              "name": "libevent",
              "version": "2.1.12_1"
            },
            {
              "name": "libfido2",
              "version": "1.15.0"
            },
            {
              "name": "libidn2",
              "version": "2.3.7"
            },
            {
              "name": "libmicrohttpd",
              "version": "1.0.1"
            },
            {
              "name": "libnghttp2",
              "version": "1.61.0"
            },
            {
              "name": "libogg",
              "version": "1.3.5"
            },
            {
              "name": "libpng",
              "version": "1.6.43"
            },
            {
              "name": "librist",
              "version": "0.2.10_1"
            },
            {
              "name": "libsamplerate",
              "version": "0.2.2"
            },
            {
              "name": "libsndfile",
              "version": "1.2.2"
            },
            {
              "name": "libsodium",
              "version": "1.0.20"
            },
            {
              "name": "libsoxr",
              "version": "0.1.3"
            },
            {
              "name": "libssh",
              "version": "0.10.6"
            },
            {
              "name": "libtasn1",
              "version": "4.19.0"
            },
            {
              "name": "libtiff",
              "version": "4.6.0"
            },
            {
              "name": "libunibreak",
              "version": "6.1"
            },
            {
              "name": "libunistring",
              "version": "1.2"
            },
            {
              "name": "libvidstab",
              "version": "1.1.1"
            },
            {
              "name": "libvmaf",
              "version": "3.0.0"
            },
            {
              "name": "libvorbis",
              "version": "1.3.7"
            },
            {
              "name": "libvpx",
              "version": "1.13.1"
            },
            {
              "name": "libx11",
              "version": "1.8.9"
            },
            {
              "name": "libxau",
              "version": "1.0.11"
            },
            {
              "name": "libxcb",
              "version": "1.17.0"
            },
            {
              "name": "libxdmcp",
              "version": "1.1.5"
            },
            {
              "name": "libxext",
              "version": "1.3.6"
            },
            {
              "name": "libxrender",
              "version": "0.9.11"
            },
            {
              "name": "little-cms2",
              "version": "2.16"
            },
            {
              "name": "lz4",
              "version": "1.9.4 1.10.0"
            },
            {
              "name": "lzo",
              "version": "2.10"
            },
            {
              "name": "mad",
              "version": "0.15.1b"
            },
            {
              "name": "mbedtls",
              "version": "3.6.0"
            },
            {
              "name": "mpdecimal",
              "version": "4.0.1 4.0.0"
            },
            {
              "name": "mpg123",
              "version": "1.32.6"
            },
            {
              "name": "mysql",
              "version": "8.3.0_1"
            },
            {
              "name": "mysql-client",
              "version": "8.3.0"
            },
            {
              "name": "ncurses",
              "version": "6.5"
            },
            {
              "name": "nettle",
              "version": "3.10"
            },
            {
              "name": "opencore-amr",
              "version": "0.1.6"
            },
            {
              "name": "openexr",
              "version": "3.2.4"
            },
            {
              "name": "openjpeg",
              "version": "2.5.2"
            },
            {
              "name": "openssl@3",
              "version": "3.6.0"
            },
            {
              "name": "opus",
              "version": "1.5.2"
            },
            {
              "name": "opusfile",
              "version": "0.12_1"
            },
            {
              "name": "p11-kit",
              "version": "0.25.5"
            },
            {
              "name": "p7zip",
              "version": "17.05"
            },
            {
              "name": "pango",
              "version": "1.54.0"
            },
            {
              "name": "pcre2",
              "version": "10.44"
            },
            {
              "name": "pipx",
              "version": "1.8.0"
            },
            {
              "name": "pixman",
              "version": "0.42.2"
            },
            {
              "name": "pkg-config",
              "version": "0.29.2_3"
            },
            {
              "name": "pkgconf",
              "version": "2.5.1"
            },
            {
              "name": "postgresql@14",
              "version": "14.12"
            },
            {
              "name": "protobuf",
              "version": "27.1"
            },
            {
              "name": "protobuf@21",
              "version": "21.12"
            },
            {
              "name": "python-tk@3.11",
              "version": "3.11.9"
            },
            {
              "name": "python@3.10",
              "version": "3.10.14_1"
            },
            {
              "name": "python@3.11",
              "version": "3.11.9_1"
            },
            {
              "name": "python@3.12",
              "version": "3.12.4"
            },
            {
              "name": "python@3.14",
              "version": "3.14.0_1"
            },
            {
              "name": "rav1e",
              "version": "0.7.1"
            },
            {
              "name": "readline",
              "version": "8.2.10 8.3.1"
            },
            {
              "name": "rubberband",
              "version": "3.3.0"
            },
            {
              "name": "sdl2",
              "version": "2.30.5"
            },
            {
              "name": "snappy",
              "version": "1.2.1"
            },
            {
              "name": "sox",
              "version": "14.4.2_5"
            },
            {
              "name": "speex",
              "version": "1.2.1"
            },
            {
              "name": "sqlite",
              "version": "3.46.0 3.51.0"
            },
            {
              "name": "srt",
              "version": "1.5.3"
            },
            {
              "name": "sshpass",
              "version": "1.06"
            },
            {
              "name": "svt-av1",
              "version": "2.1.2"
            },
            {
              "name": "tcl-tk",
              "version": "8.6.14"
            },
            {
              "name": "tesseract",
              "version": "5.4.1"
            },
            {
              "name": "theora",
              "version": "1.1.1"
            },
            {
              "name": "tmux",
              "version": "3.5a"
            },
            {
              "name": "unbound",
              "version": "1.20.0"
            },
            {
              "name": "utf8proc",
              "version": "2.11.0"
            },
            {
              "name": "webp",
              "version": "1.4.0"
            },
            {
              "name": "x264",
              "version": "r3108"
            },
            {
              "name": "x265",
              "version": "3.6"
            },
            {
              "name": "xorgproto",
              "version": "2024.1"
            },
            {
              "name": "xvid",
              "version": "1.3.7"
            },
            {
              "name": "xz",
              "version": "5.6.2 5.8.1"
            },
            {
              "name": "zeromq",
              "version": "4.3.5_1"
            },
            {
              "name": "zimg",
              "version": "3.0.5"
            },
            {
              "name": "zlib",
              "version": "1.3.1"
            },
            {
              "name": "zstd",
              "version": "1.5.6 1.5.7"
            }
          ],
          "exportedAt": "2025-11-19T01:22:10.443Z",
          "command": "brew bundle dump --file=Brewfile --force",
          "restoreCommand": "brew bundle install --file=Brewfile",
          "exportPath": "Brewfile"
        },
        {
          "type": "homebrew-cask",
          "enabled": true,
          "packages": [
            {
              "name": "claude-code",
              "version": "2.0.37"
            },
            {
              "name": "font-cascadia-code",
              "version": "2404.23"
            },
            {
              "name": "font-cascadia-code-pl",
              "version": "2404.23"
            },
            {
              "name": "font-cascadia-mono",
              "version": "2404.23"
            },
            {
              "name": "font-cascadia-mono-pl",
              "version": "2404.23"
            },
            {
              "name": "font-fira-code",
              "version": "6.2"
            },
            {
              "name": "font-hack-nerd-font",
              "version": "3.2.1"
            },
            {
              "name": "hammerspoon",
              "version": "1.0.0"
            }
          ],
          "exportedAt": "2025-11-19T01:22:11.294Z",
          "command": "brew bundle dump --file=Brewfile --force",
          "restoreCommand": "brew bundle install --file=Brewfile",
          "exportPath": "Brewfile"
        },
        {
          "type": "npm",
          "enabled": true,
          "packages": [
            {
              "name": "corepack",
              "version": "0.34.2"
            },
            {
              "name": "npm",
              "version": "11.6.2"
            }
          ],
          "exportedAt": "2025-11-19T01:22:11.643Z",
          "command": "npm list -g --depth=0 --json > npm-global.json",
          "exportPath": "npm-global.json"
        },
        {
          "type": "pnpm",
          "enabled": true,
          "packages": [],
          "exportedAt": "2025-11-19T01:22:11.812Z",
          "command": "pnpm list -g --depth=0 --json > pnpm-global.json",
          "exportPath": "pnpm-global.json"
        },
        {
          "type": "pip",
          "enabled": true,
          "packages": [
            {
              "name": "pip",
              "version": "19.2.3"
            },
            {
              "name": "setuptools",
              "version": "41.2.0"
            }
          ],
          "exportedAt": "2025-11-19T01:22:12.761Z",
          "command": "pip list --format=json > pip-packages.json",
          "restoreCommand": "pip install -r requirements.txt",
          "exportPath": "pip-packages.json"
        },
        {
          "type": "pipx",
          "enabled": true,
          "packages": [
            {
              "name": "bottles-cli",
              "version": "0.2.0"
            }
          ],
          "exportedAt": "2025-11-19T01:22:12.917Z",
          "command": "pipx list --json > pipx-packages.json",
          "exportPath": "pipx-packages.json"
        },
        {
          "type": "cargo",
          "enabled": true,
          "packages": [],
          "exportedAt": "2025-11-19T01:22:12.986Z",
          "command": "cargo install --list > cargo-packages.txt",
          "exportPath": "cargo-packages.txt"
        },
        {
          "type": "gem",
          "enabled": true,
          "packages": [
            {
              "name": "addressable",
              "version": "2.8.5"
            },
            {
              "name": "algoliasearch",
              "version": "1.27.5"
            },
            {
              "name": "atomos",
              "version": "0.1.3"
            },
            {
              "name": "bigdecimal",
              "version": "default: 1.4.1"
            },
            {
              "name": "bundler",
              "version": "default: 1.17.2"
            },
            {
              "name": "CFPropertyList",
              "version": "2.3.6"
            },
            {
              "name": "claide",
              "version": "1.1.0"
            },
            {
              "name": "cmath",
              "version": "default: 1.0.0"
            },
            {
              "name": "cocoapods-deintegrate",
              "version": "1.0.5"
            },
            {
              "name": "cocoapods-downloader",
              "version": "1.6.3"
            },
            {
              "name": "cocoapods-plugins",
              "version": "1.0.0"
            },
            {
              "name": "cocoapods-search",
              "version": "1.0.1"
            },
            {
              "name": "cocoapods-trunk",
              "version": "1.6.0"
            },
            {
              "name": "cocoapods-try",
              "version": "1.2.0"
            },
            {
              "name": "colored2",
              "version": "3.1.2"
            },
            {
              "name": "concurrent-ruby",
              "version": "1.2.2"
            },
            {
              "name": "csv",
              "version": "default: 3.0.9"
            },
            {
              "name": "date",
              "version": "default: 2.0.3"
            },
            {
              "name": "dbm",
              "version": "default: 1.0.0"
            },
            {
              "name": "did_you_mean",
              "version": "1.3.0"
            },
            {
              "name": "e2mmap",
              "version": "default: 0.1.0"
            },
            {
              "name": "escape",
              "version": "0.0.4"
            },
            {
              "name": "etc",
              "version": "default: 1.0.1"
            },
            {
              "name": "ethon",
              "version": "0.16.0"
            },
            {
              "name": "fcntl",
              "version": "default: 1.0.0"
            },
            {
              "name": "ffi",
              "version": "1.15.5"
            },
            {
              "name": "fiddle",
              "version": "default: 1.0.0"
            },
            {
              "name": "fileutils",
              "version": "default: 1.1.0"
            },
            {
              "name": "forwardable",
              "version": "default: 1.2.0"
            },
            {
              "name": "fourflusher",
              "version": "2.3.1"
            },
            {
              "name": "fuzzy_match",
              "version": "2.0.4"
            },
            {
              "name": "gh_inspector",
              "version": "1.1.3"
            },
            {
              "name": "httpclient",
              "version": "2.8.3"
            },
            {
              "name": "i18n",
              "version": "1.14.1"
            },
            {
              "name": "io-console",
              "version": "default: 0.4.7"
            },
            {
              "name": "ipaddr",
              "version": "default: 1.2.2"
            },
            {
              "name": "irb",
              "version": "default: 1.0.0"
            },
            {
              "name": "json",
              "version": "default: 2.1.0"
            },
            {
              "name": "libxml-ruby",
              "version": "3.2.1"
            },
            {
              "name": "logger",
              "version": "default: 1.3.0"
            },
            {
              "name": "matrix",
              "version": "default: 0.1.0"
            },
            {
              "name": "mini_portile2",
              "version": "2.8.0"
            },
            {
              "name": "minitest",
              "version": "5.11.3"
            },
            {
              "name": "molinillo",
              "version": "0.8.0"
            },
            {
              "name": "mutex_m",
              "version": "default: 0.1.0"
            },
            {
              "name": "nanaimo",
              "version": "0.3.0"
            },
            {
              "name": "nap",
              "version": "1.1.0"
            },
            {
              "name": "net-telnet",
              "version": "0.2.0"
            },
            {
              "name": "netrc",
              "version": "0.11.0"
            },
            {
              "name": "nokogiri",
              "version": "1.13.8"
            },
            {
              "name": "openssl",
              "version": "default: 2.1.2"
            },
            {
              "name": "ostruct",
              "version": "default: 0.1.0"
            },
            {
              "name": "power_assert",
              "version": "1.1.3"
            },
            {
              "name": "prime",
              "version": "default: 0.1.0"
            },
            {
              "name": "psych",
              "version": "default: 3.1.0"
            },
            {
              "name": "public_suffix",
              "version": "4.0.7"
            },
            {
              "name": "rake",
              "version": "12.3.3"
            },
            {
              "name": "rdoc",
              "version": "default: 6.1.2.1"
            },
            {
              "name": "rexml",
              "version": "3.2.6, default: 3.1.9.1"
            },
            {
              "name": "rss",
              "version": "default: 0.2.7"
            },
            {
              "name": "ruby-macho",
              "version": "2.5.1"
            },
            {
              "name": "scanf",
              "version": "default: 1.0.0"
            },
            {
              "name": "sdbm",
              "version": "default: 1.0.0"
            },
            {
              "name": "shell",
              "version": "default: 0.7"
            },
            {
              "name": "sqlite3",
              "version": "1.3.13"
            },
            {
              "name": "stringio",
              "version": "default: 0.0.2"
            },
            {
              "name": "strscan",
              "version": "default: 1.0.0"
            },
            {
              "name": "sync",
              "version": "default: 0.5.0"
            },
            {
              "name": "test-unit",
              "version": "3.2.9"
            },
            {
              "name": "thwait",
              "version": "default: 0.1.0"
            },
            {
              "name": "tracer",
              "version": "default: 0.1.0"
            },
            {
              "name": "typhoeus",
              "version": "1.4.0"
            },
            {
              "name": "tzinfo",
              "version": "2.0.6"
            },
            {
              "name": "webrick",
              "version": "default: 1.4.4"
            },
            {
              "name": "xcodeproj",
              "version": "1.22.0"
            },
            {
              "name": "xmlrpc",
              "version": "0.3.0"
            },
            {
              "name": "zlib",
              "version": "default: 1.0.0"
            }
          ],
          "exportedAt": "2025-11-19T01:22:13.114Z",
          "command": "gem list --local > gem-packages.txt",
          "exportPath": "gem-packages.txt"
        },
        {
          "type": "go",
          "enabled": true,
          "packages": [],
          "exportedAt": "2025-11-19T01:22:13.169Z",
          "command": "go list -m all > go-packages.txt",
          "exportPath": "go-packages.txt"
        }
      ],
      "debian": [
        {
          "type": "apt",
          "enabled": true,
          "packages": [
            {
              "name": "7zip",
              "version": "24.09+dfsg-8"
            },
            {
              "name": "accountsservice",
              "version": "23.13.9-7"
            },
            {
              "name": "acl",
              "version": "2.3.2-2+b1"
            },
            {
              "name": "adduser",
              "version": "3.152"
            },
            {
              "name": "adwaita-icon-theme",
              "version": "48.1-1"
            },
            {
              "name": "alacritty",
              "version": "0.15.1-3"
            },
            {
              "name": "alsa-topology-conf",
              "version": "1.2.5.1-3"
            },
            {
              "name": "alsa-ucm-conf",
              "version": "1.2.14-1"
            },
            {
              "name": "alsa-utils",
              "version": "1.2.14-1"
            },
            {
              "name": "anacron",
              "version": "2.3-43"
            },
            {
              "name": "apache2-bin",
              "version": "2.4.65-2"
            },
            {
              "name": "apparmor",
              "version": "4.1.0-1"
            },
            {
              "name": "appstream",
              "version": "1.0.5-1"
            },
            {
              "name": "apt-config-icons",
              "version": "1.0.5-1"
            },
            {
              "name": "apt-listchanges",
              "version": "4.8"
            },
            {
              "name": "apt-transport-https",
              "version": "3.0.3"
            },
            {
              "name": "apt-utils",
              "version": "3.0.3"
            },
            {
              "name": "apt",
              "version": "3.0.3"
            },
            {
              "name": "aspell-en",
              "version": "2020.12.07-0-1"
            },
            {
              "name": "aspell",
              "version": "0.60.8.1-4"
            },
            {
              "name": "at-spi2-common",
              "version": "2.56.2-1"
            },
            {
              "name": "at-spi2-core",
              "version": "2.56.2-1"
            },
            {
              "name": "avahi-daemon",
              "version": "0.8-16"
            },
            {
              "name": "avahi-utils",
              "version": "0.8-16"
            },
            {
              "name": "baobab",
              "version": "48.0-2+b1"
            },
            {
              "name": "base-files",
              "version": "13.8+deb13u1"
            },
            {
              "name": "base-passwd",
              "version": "3.6.7"
            },
            {
              "name": "bash-completion",
              "version": "1:2.16.0-7"
            },
            {
              "name": "bash",
              "version": "5.2.37-2+b5"
            },
            {
              "name": "bc",
              "version": "1.07.1-4"
            },
            {
              "name": "bind9-dnsutils",
              "version": "1:9.20.15-1~deb13u1"
            },
            {
              "name": "bind9-host",
              "version": "1:9.20.15-1~deb13u1"
            },
            {
              "name": "bind9-libs",
              "version": "1:9.20.15-1~deb13u1"
            },
            {
              "name": "binutils-common",
              "version": "2.44-3"
            },
            {
              "name": "binutils-x86-64-linux-gnu",
              "version": "2.44-3"
            },
            {
              "name": "binutils",
              "version": "2.44-3"
            },
            {
              "name": "bluetooth",
              "version": "5.82-1.1"
            },
            {
              "name": "bluez-obexd",
              "version": "5.82-1.1"
            },
            {
              "name": "bluez",
              "version": "5.82-1.1"
            },
            {
              "name": "bogofilter-bdb",
              "version": "1.2.5-1+b4"
            },
            {
              "name": "bogofilter-common",
              "version": "1.2.5-1+b4"
            },
            {
              "name": "bogofilter",
              "version": "1.2.5-1+b4"
            },
            {
              "name": "bolt",
              "version": "0.9.8-1"
            },
            {
              "name": "brave-browser",
              "version": "1.84.139"
            },
            {
              "name": "brave-keyring",
              "version": "1.19"
            },
            {
              "name": "bsdextrautils",
              "version": "2.41-5"
            },
            {
              "name": "bsdutils",
              "version": "1:2.41-5"
            },
            {
              "name": "bubblewrap",
              "version": "0.11.0-2"
            },
            {
              "name": "build-essential",
              "version": "12.12"
            },
            {
              "name": "bun-one",
              "version": "1.3.2-1+trixie"
            },
            {
              "name": "bun",
              "version": "1.3.2-1+trixie"
            },
            {
              "name": "busybox",
              "version": "1:1.37.0-6+b3"
            },
            {
              "name": "bzip2",
              "version": "1.0.8-6"
            },
            {
              "name": "ca-certificates",
              "version": "20250419"
            },
            {
              "name": "chromium-common",
              "version": "142.0.7444.162-1~deb13u1"
            },
            {
              "name": "chromium-sandbox",
              "version": "142.0.7444.162-1~deb13u1"
            },
            {
              "name": "chromium",
              "version": "142.0.7444.162-1~deb13u1"
            },
            {
              "name": "cmake-data",
              "version": "3.31.6-2"
            },
            {
              "name": "cmake",
              "version": "3.31.6-2"
            },
            {
              "name": "code",
              "version": "1.105.1-1760482543"
            },
            {
              "name": "coinor-libcbc3.1",
              "version": "2.10.12+ds-1"
            },
            {
              "name": "coinor-libcgl1",
              "version": "0.60.9+ds-1"
            },
            {
              "name": "coinor-libclp1",
              "version": "1.17.10+ds-1"
            },
            {
              "name": "coinor-libcoinmp0",
              "version": "1.8.4+dfsg-2"
            },
            {
              "name": "coinor-libcoinutils3v5",
              "version": "2.11.11+ds-5"
            },
            {
              "name": "coinor-libosi1v5",
              "version": "0.108.10+ds-2"
            },
            {
              "name": "colord-data",
              "version": "1.4.7-3"
            },
            {
              "name": "colord",
              "version": "1.4.7-3"
            },
            {
              "name": "console-setup-linux",
              "version": "1.240"
            },
            {
              "name": "console-setup",
              "version": "1.240"
            },
            {
              "name": "coreutils",
              "version": "9.7-3"
            },
            {
              "name": "cpio",
              "version": "2.15+dfsg-2"
            },
            {
              "name": "cpp-14-x86-64-linux-gnu",
              "version": "14.2.0-19"
            },
            {
              "name": "cpp-14",
              "version": "14.2.0-19"
            },
            {
              "name": "cpp-x86-64-linux-gnu",
              "version": "4:14.2.0-1"
            },
            {
              "name": "cpp",
              "version": "4:14.2.0-1"
            },
            {
              "name": "cracklib-runtime",
              "version": "2.9.6-5.2+b1"
            },
            {
              "name": "cron-daemon-common",
              "version": "3.0pl1-197"
            },
            {
              "name": "cron",
              "version": "3.0pl1-197"
            },
            {
              "name": "cups-browsed",
              "version": "1.28.17-6"
            },
            {
              "name": "cups-client",
              "version": "2.4.10-3+deb13u1"
            },
            {
              "name": "cups-common",
              "version": "2.4.10-3+deb13u1"
            },
            {
              "name": "cups-core-drivers",
              "version": "2.4.10-3+deb13u1"
            },
            {
              "name": "cups-daemon",
              "version": "2.4.10-3+deb13u1"
            },
            {
              "name": "cups-filters-core-drivers",
              "version": "1.28.17-6"
            },
            {
              "name": "cups-filters",
              "version": "1.28.17-6"
            },
            {
              "name": "cups-ipp-utils",
              "version": "2.4.10-3+deb13u1"
            },
            {
              "name": "cups-pk-helper",
              "version": "0.2.6-2.1"
            },
            {
              "name": "cups-ppdc",
              "version": "2.4.10-3+deb13u1"
            },
            {
              "name": "cups-server-common",
              "version": "2.4.10-3+deb13u1"
            },
            {
              "name": "cups",
              "version": "2.4.10-3+deb13u1"
            },
            {
              "name": "curl",
              "version": "8.14.1-2"
            },
            {
              "name": "dash",
              "version": "0.5.12-12"
            },
            {
              "name": "dbus-bin",
              "version": "1.16.2-2"
            },
            {
              "name": "dbus-daemon",
              "version": "1.16.2-2"
            },
            {
              "name": "dbus-session-bus-common",
              "version": "1.16.2-2"
            },
            {
              "name": "dbus-system-bus-common",
              "version": "1.16.2-2"
            },
            {
              "name": "dbus-user-session",
              "version": "1.16.2-2"
            },
            {
              "name": "dbus",
              "version": "1.16.2-2"
            },
            {
              "name": "dconf-cli",
              "version": "0.40.0-5"
            },
            {
              "name": "dconf-gsettings-backend",
              "version": "0.40.0-5"
            },
            {
              "name": "dconf-service",
              "version": "0.40.0-5"
            },
            {
              "name": "debconf-i18n",
              "version": "1.5.91"
            },
            {
              "name": "debconf",
              "version": "1.5.91"
            },
            {
              "name": "debian-archive-keyring",
              "version": "2025.1"
            },
            {
              "name": "debian-faq",
              "version": "12.2"
            },
            {
              "name": "debianutils",
              "version": "5.23.2"
            },
            {
              "name": "deltarpm",
              "version": "3.6.5+dfsg-1+b1"
            },
            {
              "name": "desktop-base",
              "version": "13.0.4"
            },
            {
              "name": "desktop-file-utils",
              "version": "0.28-1"
            },
            {
              "name": "dhcpcd-base",
              "version": "1:10.1.0-11"
            },
            {
              "name": "dictionaries-common",
              "version": "1.30.10"
            },
            {
              "name": "diffutils",
              "version": "1:3.10-4"
            },
            {
              "name": "dirmngr",
              "version": "2.4.7-21+b3"
            },
            {
              "name": "distro-info-data",
              "version": "0.66"
            },
            {
              "name": "dmidecode",
              "version": "3.6-2"
            },
            {
              "name": "dmsetup",
              "version": "2:1.02.205-2"
            },
            {
              "name": "dnf-data",
              "version": "4.23.0-1"
            },
            {
              "name": "dnf",
              "version": "4.23.0-1"
            },
            {
              "name": "dns-root-data",
              "version": "2024071801"
            },
            {
              "name": "dnsmasq-base",
              "version": "2.91-1"
            },
            {
              "name": "doc-debian",
              "version": "11.3+nmu1"
            },
            {
              "name": "docbook-xml",
              "version": "4.5-13"
            },
            {
              "name": "dosfstools",
              "version": "4.2-1.2"
            },
            {
              "name": "dpkg-dev",
              "version": "1.22.21"
            },
            {
              "name": "dpkg",
              "version": "1.22.21"
            },
            {
              "name": "dracut-install",
              "version": "106-6"
            },
            {
              "name": "e2fsprogs",
              "version": "1.47.2-3+b3"
            },
            {
              "name": "eject",
              "version": "2.41-5"
            },
            {
              "name": "emacsen-common",
              "version": "3.0.8"
            },
            {
              "name": "enchant-2",
              "version": "2.8.2+dfsg1-3"
            },
            {
              "name": "espeak-ng-data",
              "version": "1.52.0+dfsg-5"
            },
            {
              "name": "evince-common",
              "version": "48.1-3"
            },
            {
              "name": "evince",
              "version": "48.1-3"
            },
            {
              "name": "evolution-common",
              "version": "3.56.1-1+deb13u1"
            },
            {
              "name": "evolution-data-server-common",
              "version": "3.56.1-2"
            },
            {
              "name": "evolution-data-server",
              "version": "3.56.1-2"
            },
            {
              "name": "evolution-ews-core",
              "version": "3.56.1-1"
            },
            {
              "name": "evolution-ews",
              "version": "3.56.1-1"
            },
            {
              "name": "evolution-plugin-bogofilter",
              "version": "3.56.1-1+deb13u1"
            },
            {
              "name": "evolution-plugin-pstimport",
              "version": "3.56.1-1+deb13u1"
            },
            {
              "name": "evolution-plugins",
              "version": "3.56.1-1+deb13u1"
            },
            {
              "name": "evolution",
              "version": "3.56.1-1+deb13u1"
            },
            {
              "name": "exfatprogs",
              "version": "1.2.9-1"
            },
            {
              "name": "eza",
              "version": "0.23.4-1+trixie"
            },
            {
              "name": "fakeroot",
              "version": "1.37.1.1-1"
            },
            {
              "name": "fd-find",
              "version": "10.2.0-1+b5"
            },
            {
              "name": "fdisk",
              "version": "2.41-5"
            },
            {
              "name": "ffmpeg",
              "version": "7:7.1.2-0+deb13u1"
            },
            {
              "name": "file-roller",
              "version": "44.5-1"
            },
            {
              "name": "file",
              "version": "1:5.46-5"
            },
            {
              "name": "findutils",
              "version": "4.10.0-3"
            },
            {
              "name": "firefox-esr",
              "version": "140.5.0esr-1~deb13u1"
            },
            {
              "name": "firmware-intel-graphics",
              "version": "20250410-2"
            },
            {
              "name": "firmware-iwlwifi",
              "version": "20250410-2"
            },
            {
              "name": "flameshot",
              "version": "12.1.0+ds-2"
            },
            {
              "name": "fontconfig-config",
              "version": "2.15.0-2.3"
            },
            {
              "name": "fontconfig",
              "version": "2.15.0-2.3"
            },
            {
              "name": "fonts-cantarell",
              "version": "0.303.1-4"
            },
            {
              "name": "fonts-dejavu-core",
              "version": "2.37-8"
            },
            {
              "name": "fonts-dejavu-extra",
              "version": "2.37-8"
            },
            {
              "name": "fonts-dejavu-mono",
              "version": "2.37-8"
            },
            {
              "name": "fonts-dejavu",
              "version": "2.37-8"
            },
            {
              "name": "fonts-droid-fallback",
              "version": "1:8.1.0r7-1~1.gbp36536b"
            },
            {
              "name": "fonts-freefont-ttf",
              "version": "20211204+svn4273-2"
            },
            {
              "name": "fonts-liberation-sans-narrow",
              "version": "1:1.07.6-4"
            },
            {
              "name": "fonts-liberation",
              "version": "1:2.1.5-3"
            },
            {
              "name": "fonts-noto-color-emoji",
              "version": "2.048-1"
            },
            {
              "name": "fonts-noto-mono",
              "version": "20201225-2"
            },
            {
              "name": "fonts-opensymbol",
              "version": "4:102.12+LibO25.2.3-2+deb13u2"
            },
            {
              "name": "fonts-quicksand",
              "version": "0.2016-2.1"
            },
            {
              "name": "fonts-symbola",
              "version": "2.60-2"
            },
            {
              "name": "fonts-urw-base35",
              "version": "20200910-8"
            },
            {
              "name": "fuse3",
              "version": "3.17.2-3"
            },
            {
              "name": "fwupd-amd64-signed",
              "version": "1:1.7+1"
            },
            {
              "name": "fwupd",
              "version": "2.0.8-3"
            },
            {
              "name": "fzf",
              "version": "0.66.1-1+trixie"
            },
            {
              "name": "g++-14-x86-64-linux-gnu",
              "version": "14.2.0-19"
            },
            {
              "name": "g++-14",
              "version": "14.2.0-19"
            },
            {
              "name": "g++-x86-64-linux-gnu",
              "version": "4:14.2.0-1"
            },
            {
              "name": "g++",
              "version": "4:14.2.0-1"
            },
            {
              "name": "gcc-14-base",
              "version": "14.2.0-19"
            },
            {
              "name": "gcc-14-base",
              "version": "14.2.0-19"
            },
            {
              "name": "gcc-14-x86-64-linux-gnu",
              "version": "14.2.0-19"
            },
            {
              "name": "gcc-14",
              "version": "14.2.0-19"
            },
            {
              "name": "gcc-x86-64-linux-gnu",
              "version": "4:14.2.0-1"
            },
            {
              "name": "gcc",
              "version": "4:14.2.0-1"
            },
            {
              "name": "gcr4",
              "version": "4.4.0.1-3"
            },
            {
              "name": "gcr",
              "version": "3.41.2-3"
            },
            {
              "name": "gdm3",
              "version": "48.0-2"
            },
            {
              "name": "geoclue-2.0",
              "version": "2.7.2-2"
            },
            {
              "name": "geocode-glib-common",
              "version": "3.26.4-1"
            },
            {
              "name": "gettext-base",
              "version": "0.23.1-2"
            },
            {
              "name": "ghostscript",
              "version": "10.05.1~dfsg-1+deb13u1"
            },
            {
              "name": "ghostty",
              "version": "1.2.3-1+trixie"
            },
            {
              "name": "gir1.2-accountsservice-1.0",
              "version": "23.13.9-7"
            },
            {
              "name": "gir1.2-adw-1",
              "version": "1.7.6-1~deb13u1"
            },
            {
              "name": "gir1.2-atk-1.0",
              "version": "2.56.2-1"
            },
            {
              "name": "gir1.2-atspi-2.0",
              "version": "2.56.2-1"
            },
            {
              "name": "gir1.2-ayatanaappindicator3-0.1",
              "version": "0.5.94-1"
            },
            {
              "name": "gir1.2-evince-3.0",
              "version": "48.1-3"
            },
            {
              "name": "gir1.2-freedesktop",
              "version": "1.84.0-1"
            },
            {
              "name": "gir1.2-gck-2",
              "version": "4.4.0.1-3"
            },
            {
              "name": "gir1.2-gcr-4",
              "version": "4.4.0.1-3"
            },
            {
              "name": "gir1.2-gdesktopenums-3.0",
              "version": "48.0-1"
            },
            {
              "name": "gir1.2-gdkpixbuf-2.0",
              "version": "2.42.12+dfsg-4"
            },
            {
              "name": "gir1.2-gdm-1.0",
              "version": "48.0-2"
            },
            {
              "name": "gir1.2-geoclue-2.0",
              "version": "2.7.2-2"
            },
            {
              "name": "gir1.2-girepository-2.0",
              "version": "1.84.0-1"
            },
            {
              "name": "gir1.2-glib-2.0",
              "version": "2.84.4-3~deb13u1"
            },
            {
              "name": "gir1.2-gnomebg-4.0",
              "version": "44.3-3"
            },
            {
              "name": "gir1.2-gnomebluetooth-3.0",
              "version": "47.1-1"
            },
            {
              "name": "gir1.2-gnomedesktop-4.0",
              "version": "44.3-3"
            },
            {
              "name": "gir1.2-graphene-1.0",
              "version": "1.10.8-5"
            },
            {
              "name": "gir1.2-gst-plugins-bad-1.0",
              "version": "1.26.2-3"
            },
            {
              "name": "gir1.2-gst-plugins-base-1.0",
              "version": "1.26.2-1"
            },
            {
              "name": "gir1.2-gstreamer-1.0",
              "version": "1.26.2-2"
            },
            {
              "name": "gir1.2-gtk-3.0",
              "version": "3.24.49-3"
            },
            {
              "name": "gir1.2-gtk-4.0",
              "version": "4.18.6+ds-2"
            },
            {
              "name": "gir1.2-gtk4layershell-1.0",
              "version": "1.0.4-2"
            },
            {
              "name": "gir1.2-gtksource-4",
              "version": "4.8.4-6"
            },
            {
              "name": "gir1.2-gudev-1.0",
              "version": "238-6"
            },
            {
              "name": "gir1.2-gweather-4.0",
              "version": "4.4.4-1"
            },
            {
              "name": "gir1.2-handy-1",
              "version": "1.8.3-2"
            },
            {
              "name": "gir1.2-harfbuzz-0.0",
              "version": "10.2.0-1+b1"
            },
            {
              "name": "gir1.2-ibus-1.0",
              "version": "1.5.32-2"
            },
            {
              "name": "gir1.2-javascriptcoregtk-4.1",
              "version": "2.50.1-1~deb13u1"
            },
            {
              "name": "gir1.2-keybinder-3.0",
              "version": "0.3.2-1.1+b3"
            },
            {
              "name": "gir1.2-malcontent-0",
              "version": "0.13.0-2"
            },
            {
              "name": "gir1.2-mutter-16",
              "version": "48.4-2"
            },
            {
              "name": "gir1.2-nm-1.0",
              "version": "1.52.1-1"
            },
            {
              "name": "gir1.2-nma4-1.0",
              "version": "1.10.6-5"
            },
            {
              "name": "gir1.2-notify-0.7",
              "version": "0.8.6-1"
            },
            {
              "name": "gir1.2-packagekitglib-1.0",
              "version": "1.3.1-1"
            },
            {
              "name": "gir1.2-pango-1.0",
              "version": "1.56.3-1"
            },
            {
              "name": "gir1.2-peas-1.0",
              "version": "1.36.0-3+b4"
            },
            {
              "name": "gir1.2-polkit-1.0",
              "version": "126-2"
            },
            {
              "name": "gir1.2-rsvg-2.0",
              "version": "2.60.0+dfsg-1"
            },
            {
              "name": "gir1.2-secret-1",
              "version": "0.21.7-1"
            },
            {
              "name": "gir1.2-soup-3.0",
              "version": "3.6.5-3"
            },
            {
              "name": "gir1.2-totem-1.0",
              "version": "43.2-3"
            },
            {
              "name": "gir1.2-totemplparser-1.0",
              "version": "3.26.6-2"
            },
            {
              "name": "gir1.2-upowerglib-1.0",
              "version": "1.90.9-1"
            },
            {
              "name": "gir1.2-webkit2-4.1",
              "version": "2.50.1-1~deb13u1"
            },
            {
              "name": "gir1.2-wnck-3.0",
              "version": "43.2-1"
            },
            {
              "name": "git-man",
              "version": "1:2.47.3-0+deb13u1"
            },
            {
              "name": "git",
              "version": "1:2.47.3-0+deb13u1"
            },
            {
              "name": "gjs",
              "version": "1.82.3-1"
            },
            {
              "name": "glib-networking-common",
              "version": "2.80.1-1"
            },
            {
              "name": "glib-networking-services",
              "version": "2.80.1-1"
            },
            {
              "name": "glib-networking",
              "version": "2.80.1-1"
            },
            {
              "name": "glycin-loaders",
              "version": "1.2.1+ds-2"
            },
            {
              "name": "gnome-backgrounds",
              "version": "48.2.1-1"
            },
            {
              "name": "gnome-bluetooth-3-common",
              "version": "47.1-1"
            },
            {
              "name": "gnome-bluetooth-sendto",
              "version": "47.1-1"
            },
            {
              "name": "gnome-browser-connector",
              "version": "42.1-6"
            },
            {
              "name": "gnome-calculator",
              "version": "1:48.1-2+b1"
            },
            {
              "name": "gnome-calendar",
              "version": "48.1-2+b1"
            },
            {
              "name": "gnome-characters",
              "version": "48.0-1"
            },
            {
              "name": "gnome-clocks",
              "version": "48.0-2+b1"
            },
            {
              "name": "gnome-control-center-data",
              "version": "1:48.4-1~deb13u1"
            },
            {
              "name": "gnome-control-center",
              "version": "1:48.4-1~deb13u1"
            },
            {
              "name": "gnome-desktop3-data",
              "version": "44.3-3"
            },
            {
              "name": "gnome-disk-utility",
              "version": "46.1-2+b1"
            },
            {
              "name": "gnome-font-viewer",
              "version": "48.0-2+b1"
            },
            {
              "name": "gnome-keyring-pkcs11",
              "version": "48.0-1"
            },
            {
              "name": "gnome-keyring",
              "version": "48.0-1"
            },
            {
              "name": "gnome-logs",
              "version": "45.0-1"
            },
            {
              "name": "gnome-menus",
              "version": "3.36.0-3"
            },
            {
              "name": "gnome-online-accounts",
              "version": "3.54.5-1~deb13u1"
            },
            {
              "name": "gnome-remote-desktop",
              "version": "48.1-4"
            },
            {
              "name": "gnome-screenshot",
              "version": "41.0-3"
            },
            {
              "name": "gnome-session-bin",
              "version": "48.0-1"
            },
            {
              "name": "gnome-session-common",
              "version": "48.0-1"
            },
            {
              "name": "gnome-session-xsession",
              "version": "48.0-1"
            },
            {
              "name": "gnome-session",
              "version": "48.0-1"
            },
            {
              "name": "gnome-settings-daemon-common",
              "version": "48.1-1"
            },
            {
              "name": "gnome-settings-daemon",
              "version": "48.1-1"
            },
            {
              "name": "gnome-shell-common",
              "version": "48.4-1~deb13u1"
            },
            {
              "name": "gnome-shell",
              "version": "48.4-1~deb13u1"
            },
            {
              "name": "gnome-snapshot",
              "version": "48.0.1-1"
            },
            {
              "name": "gnome-software-common",
              "version": "48.3-2"
            },
            {
              "name": "gnome-software-plugin-deb",
              "version": "48.3-2"
            },
            {
              "name": "gnome-software-plugin-fwupd",
              "version": "48.3-2"
            },
            {
              "name": "gnome-software",
              "version": "48.3-2"
            },
            {
              "name": "gnome-sound-recorder",
              "version": "43~beta-4"
            },
            {
              "name": "gnome-sushi",
              "version": "46.0-2"
            },
            {
              "name": "gnome-system-monitor",
              "version": "48.1-2"
            },
            {
              "name": "gnome-terminal-data",
              "version": "3.56.2-2"
            },
            {
              "name": "gnome-terminal",
              "version": "3.56.2-2"
            },
            {
              "name": "gnome-text-editor",
              "version": "48.3-3"
            },
            {
              "name": "gnome-tweaks",
              "version": "46.1-1"
            },
            {
              "name": "gnome-user-docs",
              "version": "48.2-1"
            },
            {
              "name": "gnome-user-share",
              "version": "48.0-1"
            },
            {
              "name": "gnupg-l10n",
              "version": "2.4.7-21"
            },
            {
              "name": "gnupg-utils",
              "version": "2.4.7-21+b3"
            },
            {
              "name": "gnupg",
              "version": "2.4.7-21"
            },
            {
              "name": "gpg-agent",
              "version": "2.4.7-21+b3"
            },
            {
              "name": "gpg-wks-client",
              "version": "2.4.7-21+b3"
            },
            {
              "name": "gpg",
              "version": "2.4.7-21+b3"
            },
            {
              "name": "gpgconf",
              "version": "2.4.7-21+b3"
            },
            {
              "name": "gpgsm",
              "version": "2.4.7-21+b3"
            },
            {
              "name": "gpgv",
              "version": "2.4.7-21+b3"
            },
            {
              "name": "grep",
              "version": "3.11-4"
            },
            {
              "name": "grilo-plugins-0.3",
              "version": "0.3.16-5"
            },
            {
              "name": "grim",
              "version": "1.4.0+ds-2+b1"
            },
            {
              "name": "groff-base",
              "version": "1.23.0-9"
            },
            {
              "name": "grub-common",
              "version": "2.12-9"
            },
            {
              "name": "grub-pc-bin",
              "version": "2.12-9"
            },
            {
              "name": "grub-pc",
              "version": "2.12-9"
            },
            {
              "name": "grub2-common",
              "version": "2.12-9"
            },
            {
              "name": "gsettings-desktop-schemas",
              "version": "48.0-1"
            },
            {
              "name": "gstreamer1.0-gl",
              "version": "1.26.2-1"
            },
            {
              "name": "gstreamer1.0-gtk3",
              "version": "1.26.2-1"
            },
            {
              "name": "gstreamer1.0-gtk4",
              "version": "0.13.5-1"
            },
            {
              "name": "gstreamer1.0-libav",
              "version": "1.26.2-1"
            },
            {
              "name": "gstreamer1.0-libcamera",
              "version": "0.4.0-7"
            },
            {
              "name": "gstreamer1.0-packagekit",
              "version": "1.3.1-1"
            },
            {
              "name": "gstreamer1.0-pipewire",
              "version": "1.4.2-1"
            },
            {
              "name": "gstreamer1.0-plugins-bad",
              "version": "1.26.2-3"
            },
            {
              "name": "gstreamer1.0-plugins-base",
              "version": "1.26.2-1"
            },
            {
              "name": "gstreamer1.0-plugins-good",
              "version": "1.26.2-1"
            },
            {
              "name": "gstreamer1.0-plugins-ugly",
              "version": "1.26.3-4"
            },
            {
              "name": "gstreamer1.0-x",
              "version": "1.26.2-1"
            },
            {
              "name": "gtk-update-icon-cache",
              "version": "4.18.6+ds-2"
            },
            {
              "name": "gvfs-backends",
              "version": "1.57.2-2"
            },
            {
              "name": "gvfs-common",
              "version": "1.57.2-2"
            },
            {
              "name": "gvfs-daemons",
              "version": "1.57.2-2"
            },
            {
              "name": "gvfs-fuse",
              "version": "1.57.2-2"
            },
            {
              "name": "gvfs-libs",
              "version": "1.57.2-2"
            },
            {
              "name": "gvfs",
              "version": "1.57.2-2"
            },
            {
              "name": "gzip",
              "version": "1.13-1"
            },
            {
              "name": "heif-gdk-pixbuf",
              "version": "1.19.8-1"
            },
            {
              "name": "heif-thumbnailer",
              "version": "1.19.8-1"
            },
            {
              "name": "hicolor-icon-theme",
              "version": "0.18-2"
            },
            {
              "name": "hostname",
              "version": "3.25"
            },
            {
              "name": "hunspell-en-us",
              "version": "1:2020.12.07-4"
            },
            {
              "name": "hyphen-en-us",
              "version": "2.8.8-7"
            },
            {
              "name": "i965-va-driver",
              "version": "2.4.1+dfsg1-2"
            },
            {
              "name": "i965-va-driver",
              "version": "2.4.1+dfsg1-2"
            },
            {
              "name": "iamerican",
              "version": "3.4.06-1"
            },
            {
              "name": "ibritish",
              "version": "3.4.06-1"
            },
            {
              "name": "ibus-data",
              "version": "1.5.32-2"
            },
            {
              "name": "ibus-gtk3",
              "version": "1.5.32-2"
            },
            {
              "name": "ibus-gtk4",
              "version": "1.5.32-2"
            },
            {
              "name": "ibus-gtk",
              "version": "1.5.32-2"
            },
            {
              "name": "ibus",
              "version": "1.5.32-2"
            },
            {
              "name": "ienglish-common",
              "version": "3.4.06-1"
            },
            {
              "name": "ifupdown",
              "version": "0.8.44"
            },
            {
              "name": "iio-sensor-proxy",
              "version": "3.7-3"
            },
            {
              "name": "im-config",
              "version": "0.57-2"
            },
            {
              "name": "imagemagick-7-common",
              "version": "8:7.1.1.43+dfsg1-1+deb13u2"
            },
            {
              "name": "imagemagick-7.q16",
              "version": "8:7.1.1.43+dfsg1-1+deb13u2"
            },
            {
              "name": "imagemagick",
              "version": "8:7.1.1.43+dfsg1-1+deb13u2"
            },
            {
              "name": "inetutils-telnet",
              "version": "2:2.6-3"
            },
            {
              "name": "init-system-helpers",
              "version": "1.69~deb13u1"
            },
            {
              "name": "init",
              "version": "1.69~deb13u1"
            },
            {
              "name": "initramfs-tools-bin",
              "version": "0.148.3"
            },
            {
              "name": "initramfs-tools-core",
              "version": "0.148.3"
            },
            {
              "name": "initramfs-tools",
              "version": "0.148.3"
            },
            {
              "name": "installation-report",
              "version": "2.97"
            },
            {
              "name": "intel-media-va-driver",
              "version": "25.2.3+dfsg1-1"
            },
            {
              "name": "intel-media-va-driver",
              "version": "25.2.3+dfsg1-1"
            },
            {
              "name": "intel-microcode",
              "version": "3.20250812.1~deb13u1"
            },
            {
              "name": "ipp-usb",
              "version": "0.9.23-2+b7"
            },
            {
              "name": "iproute2",
              "version": "6.15.0-1"
            },
            {
              "name": "iptables",
              "version": "1.8.11-2"
            },
            {
              "name": "iputils-ping",
              "version": "3:20240905-3"
            },
            {
              "name": "iso-codes",
              "version": "4.18.0-1"
            },
            {
              "name": "ispell",
              "version": "3.4.06-1"
            },
            {
              "name": "iucode-tool",
              "version": "2.3.1-3"
            },
            {
              "name": "iw",
              "version": "6.9-1"
            },
            {
              "name": "javascript-common",
              "version": "12+nmu1"
            },
            {
              "name": "jq",
              "version": "1.7.1-6+deb13u1"
            },
            {
              "name": "kbd",
              "version": "2.7.1-2"
            },
            {
              "name": "keyboard-configuration",
              "version": "1.240"
            },
            {
              "name": "keyd",
              "version": "2.5.0-4"
            },
            {
              "name": "klibc-utils",
              "version": "2.0.14-1"
            },
            {
              "name": "kmod",
              "version": "34.2-2"
            },
            {
              "name": "krb5-locales",
              "version": "1.21.3-5"
            },
            {
              "name": "laptop-detect",
              "version": "0.16+nmu1"
            },
            {
              "name": "lazygit",
              "version": "0.56.0-1+trixie"
            },
            {
              "name": "less",
              "version": "668-1"
            },
            {
              "name": "liba52-0.7.4",
              "version": "0.7.4-20+b3"
            },
            {
              "name": "libaa1",
              "version": "1.4p5-51.1+b1"
            },
            {
              "name": "libaacs0",
              "version": "0.11.1-4+b1"
            },
            {
              "name": "libabsl20240722",
              "version": "20240722.0-4"
            },
            {
              "name": "libabw-0.1-1",
              "version": "0.1.3-1+b2"
            },
            {
              "name": "libaccountsservice0",
              "version": "23.13.9-7"
            },
            {
              "name": "libacl1",
              "version": "2.3.2-2+b1"
            },
            {
              "name": "libadwaita-1-0",
              "version": "1.7.6-1~deb13u1"
            },
            {
              "name": "libalgorithm-diff-perl",
              "version": "1.201-1"
            },
            {
              "name": "libalgorithm-diff-xs-perl",
              "version": "0.04-9"
            },
            {
              "name": "libalgorithm-merge-perl",
              "version": "0.08-5"
            },
            {
              "name": "libao-common",
              "version": "1.2.2+20180113-1.2"
            },
            {
              "name": "libao4",
              "version": "1.2.2+20180113-1.2"
            },
            {
              "name": "libaom3",
              "version": "3.12.1-1"
            },
            {
              "name": "libaom3",
              "version": "3.12.1-1"
            },
            {
              "name": "libapache2-mod-dnssd",
              "version": "0.6-5"
            },
            {
              "name": "libapparmor1",
              "version": "4.1.0-1"
            },
            {
              "name": "libappstream5",
              "version": "1.0.5-1"
            },
            {
              "name": "libapr1t64",
              "version": "1.7.5-1"
            },
            {
              "name": "libaprutil1-dbd-sqlite3",
              "version": "1.6.3-3+b1"
            },
            {
              "name": "libaprutil1-ldap",
              "version": "1.6.3-3+b1"
            },
            {
              "name": "libaprutil1t64",
              "version": "1.6.3-3+b1"
            },
            {
              "name": "libapt-pkg7.0",
              "version": "3.0.3"
            },
            {
              "name": "libarchive13t64",
              "version": "3.7.4-4"
            },
            {
              "name": "libargon2-1",
              "version": "0~20190702+dfsg-4+b2"
            },
            {
              "name": "libaribb24-0t64",
              "version": "1.0.3-2.1+b2"
            },
            {
              "name": "libasan8",
              "version": "14.2.0-19"
            },
            {
              "name": "libasound2-data",
              "version": "1.2.14-1"
            },
            {
              "name": "libasound2-plugins",
              "version": "1.2.12-2+b1"
            },
            {
              "name": "libasound2-plugins",
              "version": "1.2.12-2+b1"
            },
            {
              "name": "libasound2t64",
              "version": "1.2.14-1"
            },
            {
              "name": "libasound2t64",
              "version": "1.2.14-1"
            },
            {
              "name": "libaspell15",
              "version": "0.60.8.1-4"
            },
            {
              "name": "libass9",
              "version": "1:0.17.3-1+b1"
            },
            {
              "name": "libassuan9",
              "version": "3.0.2-2"
            },
            {
              "name": "libasyncns0",
              "version": "0.8-6+b5"
            },
            {
              "name": "libasyncns0",
              "version": "0.8-6+b5"
            },
            {
              "name": "libatasmart4",
              "version": "0.19-5+b2"
            },
            {
              "name": "libatk-adaptor",
              "version": "2.56.2-1"
            },
            {
              "name": "libatk-bridge2.0-0t64",
              "version": "2.56.2-1"
            },
            {
              "name": "libatk1.0-0t64",
              "version": "2.56.2-1"
            },
            {
              "name": "libatomic1",
              "version": "14.2.0-19"
            },
            {
              "name": "libatomic1",
              "version": "14.2.0-19"
            },
            {
              "name": "libatopology2t64",
              "version": "1.2.14-1"
            },
            {
              "name": "libatspi2.0-0t64",
              "version": "2.56.2-1"
            },
            {
              "name": "libattr1",
              "version": "1:2.5.2-3"
            },
            {
              "name": "libaudio2",
              "version": "1.9.4-9"
            },
            {
              "name": "libaudit-common",
              "version": "1:4.0.2-2"
            },
            {
              "name": "libaudit1",
              "version": "1:4.0.2-2+b2"
            },
            {
              "name": "libauthen-sasl-perl",
              "version": "2.1700-1"
            },
            {
              "name": "libavahi-client3",
              "version": "0.8-16"
            },
            {
              "name": "libavahi-common-data",
              "version": "0.8-16"
            },
            {
              "name": "libavahi-common3",
              "version": "0.8-16"
            },
            {
              "name": "libavahi-core7",
              "version": "0.8-16"
            },
            {
              "name": "libavahi-glib1",
              "version": "0.8-16"
            },
            {
              "name": "libavc1394-0",
              "version": "0.5.4-5+b2"
            },
            {
              "name": "libavcodec61",
              "version": "7:7.1.2-0+deb13u1"
            },
            {
              "name": "libavcodec61",
              "version": "7:7.1.2-0+deb13u1"
            },
            {
              "name": "libavdevice61",
              "version": "7:7.1.2-0+deb13u1"
            },
            {
              "name": "libavfilter10",
              "version": "7:7.1.2-0+deb13u1"
            },
            {
              "name": "libavformat61",
              "version": "7:7.1.2-0+deb13u1"
            },
            {
              "name": "libavif-gdk-pixbuf",
              "version": "1.2.1-1.2"
            },
            {
              "name": "libavif16",
              "version": "1.2.1-1.2"
            },
            {
              "name": "libavtp0",
              "version": "0.2.0-2"
            },
            {
              "name": "libavutil59",
              "version": "7:7.1.2-0+deb13u1"
            },
            {
              "name": "libavutil59",
              "version": "7:7.1.2-0+deb13u1"
            },
            {
              "name": "libayatana-appindicator3-1",
              "version": "0.5.94-1"
            },
            {
              "name": "libayatana-ido3-0.4-0",
              "version": "0.10.4-1"
            },
            {
              "name": "libayatana-indicator3-7",
              "version": "0.9.4-1+b1"
            },
            {
              "name": "libbdplus0",
              "version": "0.2.0-4+b1"
            },
            {
              "name": "libbinutils",
              "version": "2.44-3"
            },
            {
              "name": "libblas3",
              "version": "3.12.1-6"
            },
            {
              "name": "libblkid1",
              "version": "2.41-5"
            },
            {
              "name": "libblkid1",
              "version": "2.41-5"
            },
            {
              "name": "libblockdev-crypto3",
              "version": "3.3.0-2.1"
            },
            {
              "name": "libblockdev-fs3",
              "version": "3.3.0-2.1"
            },
            {
              "name": "libblockdev-loop3",
              "version": "3.3.0-2.1"
            },
            {
              "name": "libblockdev-mdraid3",
              "version": "3.3.0-2.1"
            },
            {
              "name": "libblockdev-nvme3",
              "version": "3.3.0-2.1"
            },
            {
              "name": "libblockdev-part3",
              "version": "3.3.0-2.1"
            },
            {
              "name": "libblockdev-swap3",
              "version": "3.3.0-2.1"
            },
            {
              "name": "libblockdev-utils3",
              "version": "3.3.0-2.1"
            },
            {
              "name": "libblockdev3",
              "version": "3.3.0-2.1"
            },
            {
              "name": "libbluetooth3",
              "version": "5.82-1.1"
            },
            {
              "name": "libbluray2",
              "version": "1:1.3.4-1+b2"
            },
            {
              "name": "libboost-iostreams1.83.0",
              "version": "1.83.0-4.2"
            },
            {
              "name": "libboost-locale1.83.0",
              "version": "1.83.0-4.2"
            },
            {
              "name": "libboost-thread1.83.0",
              "version": "1.83.0-4.2"
            },
            {
              "name": "libbpf1",
              "version": "1:1.5.0-3"
            },
            {
              "name": "libbrlapi0.8",
              "version": "6.7-3.1"
            },
            {
              "name": "libbrotli1",
              "version": "1.1.0-2+b7"
            },
            {
              "name": "libbrotli1",
              "version": "1.1.0-2+b7"
            },
            {
              "name": "libbs2b0",
              "version": "3.1.0+dfsg-8+b1"
            },
            {
              "name": "libbsd0",
              "version": "0.12.2-2"
            },
            {
              "name": "libbsd0",
              "version": "0.12.2-2"
            },
            {
              "name": "libbytesize-common",
              "version": "2.11-2"
            },
            {
              "name": "libbytesize1",
              "version": "2.11-2"
            },
            {
              "name": "libbz2-1.0",
              "version": "1.0.8-6"
            },
            {
              "name": "libbz2-1.0",
              "version": "1.0.8-6"
            },
            {
              "name": "libc-bin",
              "version": "2.41-12"
            },
            {
              "name": "libc-dev-bin",
              "version": "2.41-12"
            },
            {
              "name": "libc-l10n",
              "version": "2.41-12"
            },
            {
              "name": "libc6-dev",
              "version": "2.41-12"
            },
            {
              "name": "libc6",
              "version": "2.41-12"
            },
            {
              "name": "libc6",
              "version": "2.41-12"
            },
            {
              "name": "libcaca0",
              "version": "0.99.beta20-5"
            },
            {
              "name": "libcairo-gobject-perl",
              "version": "1.005-4+b4"
            },
            {
              "name": "libcairo-gobject2",
              "version": "1.18.4-1+b1"
            },
            {
              "name": "libcairo-gobject2",
              "version": "1.18.4-1+b1"
            },
            {
              "name": "libcairo-perl",
              "version": "1.109-5+b1"
            },
            {
              "name": "libcairo-script-interpreter2",
              "version": "1.18.4-1+b1"
            },
            {
              "name": "libcairo2",
              "version": "1.18.4-1+b1"
            },
            {
              "name": "libcairo2",
              "version": "1.18.4-1+b1"
            },
            {
              "name": "libcairomm-1.16-1",
              "version": "1.18.0-2"
            },
            {
              "name": "libcamel-1.2-64t64",
              "version": "3.56.1-2"
            },
            {
              "name": "libcamera-ipa",
              "version": "0.4.0-7"
            },
            {
              "name": "libcamera0.4",
              "version": "0.4.0-7"
            },
            {
              "name": "libcanberra-gtk3-0",
              "version": "0.30-18"
            },
            {
              "name": "libcanberra-gtk3-module",
              "version": "0.30-18"
            },
            {
              "name": "libcanberra-pulse",
              "version": "0.30-18"
            },
            {
              "name": "libcanberra0",
              "version": "0.30-18"
            },
            {
              "name": "libcap-ng0",
              "version": "0.8.5-4+b1"
            },
            {
              "name": "libcap2-bin",
              "version": "1:2.75-10+b1"
            },
            {
              "name": "libcap2",
              "version": "1:2.75-10+b1"
            },
            {
              "name": "libcap2",
              "version": "1:2.75-10+b1"
            },
            {
              "name": "libcbor0.10",
              "version": "0.10.2-2"
            },
            {
              "name": "libcc1-0",
              "version": "14.2.0-19"
            },
            {
              "name": "libcddb2",
              "version": "1.3.2-7.1"
            },
            {
              "name": "libcdio-cdda2t64",
              "version": "10.2+2.0.2-1+b1"
            },
            {
              "name": "libcdio-paranoia2t64",
              "version": "10.2+2.0.2-1+b1"
            },
            {
              "name": "libcdio19t64",
              "version": "2.2.0-4"
            },
            {
              "name": "libcdparanoia0",
              "version": "3.10.2+debian-14+b1"
            },
            {
              "name": "libchamplain-0.12-0",
              "version": "0.12.21-2"
            },
            {
              "name": "libchamplain-gtk-0.12-0",
              "version": "0.12.21-2"
            },
            {
              "name": "libchromaprint1",
              "version": "1.5.1-7"
            },
            {
              "name": "libcjson1",
              "version": "1.7.18-3.1+deb13u1"
            },
            {
              "name": "libclone-perl",
              "version": "0.47-1+b1"
            },
            {
              "name": "libcloudproviders0",
              "version": "0.3.6-2"
            },
            {
              "name": "libclucene-contribs1t64",
              "version": "2.3.3.4+dfsg-1.2+b1"
            },
            {
              "name": "libclucene-core1t64",
              "version": "2.3.3.4+dfsg-1.2+b1"
            },
            {
              "name": "libclutter-1.0-0",
              "version": "1.26.4+git2779b932+dfsg-7+b2"
            },
            {
              "name": "libclutter-1.0-common",
              "version": "1.26.4+git2779b932+dfsg-7"
            },
            {
              "name": "libclutter-gtk-1.0-0",
              "version": "1.8.4-6"
            },
            {
              "name": "libcmark0.30.2",
              "version": "0.30.2-6+b2"
            },
            {
              "name": "libcmis-0.6-6t64",
              "version": "0.6.2-2.1+b1"
            },
            {
              "name": "libcodec2-1.2",
              "version": "1.2.0-3"
            },
            {
              "name": "libcodec2-1.2",
              "version": "1.2.0-3"
            },
            {
              "name": "libcogl-common",
              "version": "1.22.8-5"
            },
            {
              "name": "libcogl-pango20",
              "version": "1.22.8-5"
            },
            {
              "name": "libcogl-path20",
              "version": "1.22.8-5"
            },
            {
              "name": "libcogl20",
              "version": "1.22.8-5"
            },
            {
              "name": "libcolamd3",
              "version": "1:7.10.1+dfsg-1"
            },
            {
              "name": "libcolord-gtk4-1t64",
              "version": "0.3.1-1+b1"
            },
            {
              "name": "libcolord2",
              "version": "1.4.7-3"
            },
            {
              "name": "libcolorhug2",
              "version": "1.4.7-3"
            },
            {
              "name": "libcom-err2",
              "version": "1.47.2-3+b3"
            },
            {
              "name": "libcomps0",
              "version": "0.1.21-1+b3"
            },
            {
              "name": "libconfig++11",
              "version": "1.7.3-2"
            },
            {
              "name": "libcpuinfo0",
              "version": "0.0~git20250327.39ea79a-1"
            },
            {
              "name": "libcrack2",
              "version": "2.9.6-5.2+b1"
            },
            {
              "name": "libcrypt-dev",
              "version": "1:4.4.38-1"
            },
            {
              "name": "libcrypt1",
              "version": "1:4.4.38-1"
            },
            {
              "name": "libcrypt1",
              "version": "1:4.4.38-1"
            },
            {
              "name": "libcryptsetup12",
              "version": "2:2.7.5-2"
            },
            {
              "name": "libctf-nobfd0",
              "version": "2.44-3"
            },
            {
              "name": "libctf0",
              "version": "2.44-3"
            },
            {
              "name": "libcue2",
              "version": "2.2.1-4.1+b2"
            },
            {
              "name": "libcups2t64",
              "version": "2.4.10-3+deb13u1"
            },
            {
              "name": "libcupsfilters1t64",
              "version": "1.28.17-6"
            },
            {
              "name": "libcurl3t64-gnutls",
              "version": "8.14.1-2"
            },
            {
              "name": "libcurl4t64",
              "version": "8.14.1-2"
            },
            {
              "name": "libdaemon0",
              "version": "0.14-7.1+b3"
            },
            {
              "name": "libdata-dump-perl",
              "version": "1.25-1"
            },
            {
              "name": "libdatrie1",
              "version": "0.2.13-3+b1"
            },
            {
              "name": "libdatrie1",
              "version": "0.2.13-3+b1"
            },
            {
              "name": "libdav1d7",
              "version": "1.5.1-1"
            },
            {
              "name": "libdav1d7",
              "version": "1.5.1-1"
            },
            {
              "name": "libdb5.3t64",
              "version": "5.3.28+dfsg2-9"
            },
            {
              "name": "libdb5.3t64",
              "version": "5.3.28+dfsg2-9"
            },
            {
              "name": "libdbus-1-3",
              "version": "1.16.2-2"
            },
            {
              "name": "libdbus-1-3",
              "version": "1.16.2-2"
            },
            {
              "name": "libdbus-glib-1-2",
              "version": "0.114-1"
            },
            {
              "name": "libdbusmenu-glib4",
              "version": "18.10.20180917~bzr492+repack1-4"
            },
            {
              "name": "libdbusmenu-gtk3-4",
              "version": "18.10.20180917~bzr492+repack1-4"
            },
            {
              "name": "libdc1394-25",
              "version": "2.2.6-5"
            },
            {
              "name": "libdca0",
              "version": "0.0.7-2+b2"
            },
            {
              "name": "libdconf1",
              "version": "0.40.0-5"
            },
            {
              "name": "libde265-0",
              "version": "1.0.15-1+b3"
            },
            {
              "name": "libdebconfclient0",
              "version": "0.280"
            },
            {
              "name": "libdecor-0-0",
              "version": "0.2.2-2"
            },
            {
              "name": "libdecor-0-plugin-1-gtk",
              "version": "0.2.2-2"
            },
            {
              "name": "libdee-1.0-4",
              "version": "1.2.7+17.10.20170616-7+b6"
            },
            {
              "name": "libdeflate0",
              "version": "1.23-2"
            },
            {
              "name": "libdeflate0",
              "version": "1.23-2"
            },
            {
              "name": "libdevmapper1.02.1",
              "version": "2:1.02.205-2"
            },
            {
              "name": "libdisplay-info2",
              "version": "0.2.0-2"
            },
            {
              "name": "libdjvulibre-text",
              "version": "3.5.28-2.2"
            },
            {
              "name": "libdjvulibre21",
              "version": "3.5.28-2.2"
            },
            {
              "name": "libdmapsharing-4.0-3t64",
              "version": "3.9.13-4"
            },
            {
              "name": "libdnf2-common",
              "version": "0.74.0-1"
            },
            {
              "name": "libdnf2t64",
              "version": "0.74.0-1"
            },
            {
              "name": "libdnnl3.6",
              "version": "3.7.2+ds-2"
            },
            {
              "name": "libdotconf0",
              "version": "1.4.1-1"
            },
            {
              "name": "libdouble-conversion3",
              "version": "3.3.1-1"
            },
            {
              "name": "libdpkg-perl",
              "version": "1.22.21"
            },
            {
              "name": "libdrm-amdgpu1",
              "version": "2.4.124-2"
            },
            {
              "name": "libdrm-amdgpu1",
              "version": "2.4.124-2"
            },
            {
              "name": "libdrm-common",
              "version": "2.4.124-2"
            },
            {
              "name": "libdrm-intel1",
              "version": "2.4.124-2"
            },
            {
              "name": "libdrm-intel1",
              "version": "2.4.124-2"
            },
            {
              "name": "libdrm-nouveau2",
              "version": "2.4.124-2"
            },
            {
              "name": "libdrm-radeon1",
              "version": "2.4.124-2"
            },
            {
              "name": "libdrm2",
              "version": "2.4.124-2"
            },
            {
              "name": "libdrm2",
              "version": "2.4.124-2"
            },
            {
              "name": "libduktape207",
              "version": "2.7.0-2+b2"
            },
            {
              "name": "libdv4t64",
              "version": "1.0.0-17.1+b1"
            },
            {
              "name": "libdvbpsi10",
              "version": "1.3.3-1+b2"
            },
            {
              "name": "libdvdnav4",
              "version": "6.1.1-3+b1"
            },
            {
              "name": "libdvdread8t64",
              "version": "6.1.3-2"
            },
            {
              "name": "libdw1t64",
              "version": "0.192-4"
            },
            {
              "name": "libe-book-0.1-1",
              "version": "0.1.3-2+b4"
            },
            {
              "name": "libebackend-1.2-11t64",
              "version": "3.56.1-2"
            },
            {
              "name": "libebml5",
              "version": "1.4.5-1+b1"
            },
            {
              "name": "libebook-1.2-21t64",
              "version": "3.56.1-2"
            },
            {
              "name": "libebook-contacts-1.2-4t64",
              "version": "3.56.1-2"
            },
            {
              "name": "libebur128-1",
              "version": "1.2.6-1+b2"
            },
            {
              "name": "libecal-2.0-3",
              "version": "3.56.1-2"
            },
            {
              "name": "libedata-book-1.2-27t64",
              "version": "3.56.1-2"
            },
            {
              "name": "libedata-cal-2.0-2t64",
              "version": "3.56.1-2"
            },
            {
              "name": "libedataserver-1.2-27t64",
              "version": "3.56.1-2"
            },
            {
              "name": "libedataserverui-1.2-4t64",
              "version": "3.56.1-2"
            },
            {
              "name": "libedataserverui4-1.0-0t64",
              "version": "3.56.1-2"
            },
            {
              "name": "libedit2",
              "version": "3.1-20250104-1"
            },
            {
              "name": "libedit2",
              "version": "3.1-20250104-1"
            },
            {
              "name": "libeditorconfig0",
              "version": "0.12.9+~0.17.1-1"
            },
            {
              "name": "libefiboot1t64",
              "version": "38-3.1+b1"
            },
            {
              "name": "libefivar1t64",
              "version": "38-3.1+b1"
            },
            {
              "name": "libegl-mesa0",
              "version": "25.0.7-2"
            },
            {
              "name": "libegl-mesa0",
              "version": "25.0.7-2"
            },
            {
              "name": "libegl1",
              "version": "1.7.0-1+b2"
            },
            {
              "name": "libegl1",
              "version": "1.7.0-1+b2"
            },
            {
              "name": "libei1",
              "version": "1.3.901-1"
            },
            {
              "name": "libeis1",
              "version": "1.3.901-1"
            },
            {
              "name": "libelf1t64",
              "version": "0.192-4"
            },
            {
              "name": "libelf1t64",
              "version": "0.192-4"
            },
            {
              "name": "libenchant-2-2",
              "version": "2.8.2+dfsg1-3"
            },
            {
              "name": "libencode-locale-perl",
              "version": "1.05-3"
            },
            {
              "name": "libeot0",
              "version": "0.01-5+b2"
            },
            {
              "name": "libepoxy0",
              "version": "1.5.10-2"
            },
            {
              "name": "libepubgen-0.1-1",
              "version": "0.1.1-1+b2"
            },
            {
              "name": "liberror-perl",
              "version": "0.17030-1"
            },
            {
              "name": "libespeak-ng1",
              "version": "1.52.0+dfsg-5"
            },
            {
              "name": "libetonyek-0.1-1",
              "version": "0.1.12-1"
            },
            {
              "name": "libevdev2",
              "version": "1.13.4+dfsg-1"
            },
            {
              "name": "libevdocument3-4t64",
              "version": "48.1-3"
            },
            {
              "name": "libevent-2.1-7t64",
              "version": "2.1.12-stable-10+b1"
            },
            {
              "name": "libevolution",
              "version": "3.56.1-1+deb13u1"
            },
            {
              "name": "libevview3-3t64",
              "version": "48.1-3"
            },
            {
              "name": "libexempi8",
              "version": "2.6.6-2"
            },
            {
              "name": "libexif12",
              "version": "0.6.25-1"
            },
            {
              "name": "libexiv2-28",
              "version": "0.28.5+dfsg-1"
            },
            {
              "name": "libexiv2-data",
              "version": "0.28.5+dfsg-1"
            },
            {
              "name": "libexpat1",
              "version": "2.7.1-2"
            },
            {
              "name": "libexpat1",
              "version": "2.7.1-2"
            },
            {
              "name": "libext2fs2t64",
              "version": "1.47.2-3+b3"
            },
            {
              "name": "libexttextcat-2.0-0",
              "version": "3.4.7-1+b1"
            },
            {
              "name": "libexttextcat-data",
              "version": "3.4.7-1"
            },
            {
              "name": "libextutils-depends-perl",
              "version": "0.8002-1"
            },
            {
              "name": "libfaad2",
              "version": "2.11.2-1"
            },
            {
              "name": "libfakeroot",
              "version": "1.37.1.1-1"
            },
            {
              "name": "libfdisk1",
              "version": "2.41-5"
            },
            {
              "name": "libffado2",
              "version": "2.4.9-2"
            },
            {
              "name": "libffi8",
              "version": "3.4.8-2"
            },
            {
              "name": "libffi8",
              "version": "3.4.8-2"
            },
            {
              "name": "libfftw3-double3",
              "version": "3.3.10-2+b1"
            },
            {
              "name": "libfftw3-single3",
              "version": "3.3.10-2+b1"
            },
            {
              "name": "libfido2-1",
              "version": "1.15.0-1+b1"
            },
            {
              "name": "libfile-basedir-perl",
              "version": "0.09-2"
            },
            {
              "name": "libfile-desktopentry-perl",
              "version": "0.22-3"
            },
            {
              "name": "libfile-fcntllock-perl",
              "version": "0.22-4+b4"
            },
            {
              "name": "libfile-listing-perl",
              "version": "6.16-1"
            },
            {
              "name": "libfile-mimeinfo-perl",
              "version": "0.35-1"
            },
            {
              "name": "libflac14",
              "version": "1.5.0+ds-2"
            },
            {
              "name": "libflac14",
              "version": "1.5.0+ds-2"
            },
            {
              "name": "libflashrom1",
              "version": "1.4.0-3"
            },
            {
              "name": "libflite1",
              "version": "2.2-7"
            },
            {
              "name": "libfluidsynth3",
              "version": "2.4.4+dfsg-1"
            },
            {
              "name": "libfont-afm-perl",
              "version": "1.20-4"
            },
            {
              "name": "libfontconfig1",
              "version": "2.15.0-2.3"
            },
            {
              "name": "libfontconfig1",
              "version": "2.15.0-2.3"
            },
            {
              "name": "libfontembed1t64",
              "version": "1.28.17-6"
            },
            {
              "name": "libfontenc1",
              "version": "1:1.1.8-1+b2"
            },
            {
              "name": "libfreeaptx0",
              "version": "0.2.2-1"
            },
            {
              "name": "libfreerdp-server3-3",
              "version": "3.15.0+dfsg-2.1"
            },
            {
              "name": "libfreerdp3-3",
              "version": "3.15.0+dfsg-2.1"
            },
            {
              "name": "libfreetype6",
              "version": "2.13.3+dfsg-1"
            },
            {
              "name": "libfreetype6",
              "version": "2.13.3+dfsg-1"
            },
            {
              "name": "libfribidi0",
              "version": "1.0.16-1"
            },
            {
              "name": "libfribidi0",
              "version": "1.0.16-1"
            },
            {
              "name": "libfstrm0",
              "version": "0.6.1-1+b3"
            },
            {
              "name": "libfsverity0",
              "version": "1.6-1.2"
            },
            {
              "name": "libftdi1-2",
              "version": "1.5-10"
            },
            {
              "name": "libfuse3-4",
              "version": "3.17.2-3"
            },
            {
              "name": "libfwupd3",
              "version": "2.0.8-3"
            },
            {
              "name": "libgail-3-0t64",
              "version": "3.24.49-3"
            },
            {
              "name": "libgav1-1",
              "version": "0.19.0-3+b1"
            },
            {
              "name": "libgbm1",
              "version": "25.0.7-2"
            },
            {
              "name": "libgbm1",
              "version": "25.0.7-2"
            },
            {
              "name": "libgcc-14-dev",
              "version": "14.2.0-19"
            },
            {
              "name": "libgcc-s1",
              "version": "14.2.0-19"
            },
            {
              "name": "libgcc-s1",
              "version": "14.2.0-19"
            },
            {
              "name": "libgck-1-0",
              "version": "3.41.2-3"
            },
            {
              "name": "libgck-2-2",
              "version": "4.4.0.1-3"
            },
            {
              "name": "libgcr-4-4",
              "version": "4.4.0.1-3"
            },
            {
              "name": "libgcr-base-3-1",
              "version": "3.41.2-3"
            },
            {
              "name": "libgcr-ui-3-1",
              "version": "3.41.2-3"
            },
            {
              "name": "libgcrypt20",
              "version": "1.11.0-7"
            },
            {
              "name": "libgd3",
              "version": "2.3.3-13"
            },
            {
              "name": "libgdata-common",
              "version": "0.18.1-9"
            },
            {
              "name": "libgdata22",
              "version": "0.18.1-9"
            },
            {
              "name": "libgdbm-compat4t64",
              "version": "1.24-2"
            },
            {
              "name": "libgdbm6t64",
              "version": "1.24-2"
            },
            {
              "name": "libgdk-pixbuf-2.0-0",
              "version": "2.42.12+dfsg-4"
            },
            {
              "name": "libgdk-pixbuf-2.0-0",
              "version": "2.42.12+dfsg-4"
            },
            {
              "name": "libgdk-pixbuf2.0-bin",
              "version": "2.42.12+dfsg-4"
            },
            {
              "name": "libgdk-pixbuf2.0-common",
              "version": "2.42.12+dfsg-4"
            },
            {
              "name": "libgdm1",
              "version": "48.0-2"
            },
            {
              "name": "libgee-0.8-2",
              "version": "0.20.8-1"
            },
            {
              "name": "libgeoclue-2-0",
              "version": "2.7.2-2"
            },
            {
              "name": "libgeocode-glib-2-0",
              "version": "3.26.4-1"
            },
            {
              "name": "libges-1.0-0",
              "version": "1.26.2-1"
            },
            {
              "name": "libgexiv2-2",
              "version": "0.14.3-1+b1"
            },
            {
              "name": "libgfortran5",
              "version": "14.2.0-19"
            },
            {
              "name": "libgif7",
              "version": "5.2.2-1+b1"
            },
            {
              "name": "libgirepository-1.0-1",
              "version": "1.84.0-1"
            },
            {
              "name": "libgjs0g",
              "version": "1.82.3-1"
            },
            {
              "name": "libgl1-mesa-dri",
              "version": "25.0.7-2"
            },
            {
              "name": "libgl1-mesa-dri",
              "version": "25.0.7-2"
            },
            {
              "name": "libgl1",
              "version": "1.7.0-1+b2"
            },
            {
              "name": "libgl1",
              "version": "1.7.0-1+b2"
            },
            {
              "name": "libgles2",
              "version": "1.7.0-1+b2"
            },
            {
              "name": "libglib-object-introspection-perl",
              "version": "0.051-2+b1"
            },
            {
              "name": "libglib-perl",
              "version": "3:1.329.3-3+b3"
            },
            {
              "name": "libglib2.0-0t64",
              "version": "2.84.4-3~deb13u1"
            },
            {
              "name": "libglib2.0-0t64",
              "version": "2.84.4-3~deb13u1"
            },
            {
              "name": "libglib2.0-bin",
              "version": "2.84.4-3~deb13u1"
            },
            {
              "name": "libglib2.0-data",
              "version": "2.84.4-3~deb13u1"
            },
            {
              "name": "libglibmm-2.4-1t64",
              "version": "2.66.8-1"
            },
            {
              "name": "libglibmm-2.68-1t64",
              "version": "2.84.0-1"
            },
            {
              "name": "libglu1-mesa",
              "version": "9.0.2-1.1+b3"
            },
            {
              "name": "libglvnd0",
              "version": "1.7.0-1+b2"
            },
            {
              "name": "libglvnd0",
              "version": "1.7.0-1+b2"
            },
            {
              "name": "libglx-mesa0",
              "version": "25.0.7-2"
            },
            {
              "name": "libglx-mesa0",
              "version": "25.0.7-2"
            },
            {
              "name": "libglx0",
              "version": "1.7.0-1+b2"
            },
            {
              "name": "libglx0",
              "version": "1.7.0-1+b2"
            },
            {
              "name": "libgme0",
              "version": "0.6.3-7+b2"
            },
            {
              "name": "libgmp10",
              "version": "2:6.3.0+dfsg-3"
            },
            {
              "name": "libgmp10",
              "version": "2:6.3.0+dfsg-3"
            },
            {
              "name": "libgnome-autoar-0-0",
              "version": "0.4.5-2"
            },
            {
              "name": "libgnome-autoar-gtk-0-0",
              "version": "0.4.5-2"
            },
            {
              "name": "libgnome-bg-4-2t64",
              "version": "44.3-3"
            },
            {
              "name": "libgnome-bluetooth-3.0-13",
              "version": "47.1-1"
            },
            {
              "name": "libgnome-bluetooth-ui-3.0-13",
              "version": "47.1-1"
            },
            {
              "name": "libgnome-desktop-3-20t64",
              "version": "44.3-3"
            },
            {
              "name": "libgnome-desktop-4-2t64",
              "version": "44.3-3"
            },
            {
              "name": "libgnome-rr-4-2t64",
              "version": "44.3-3"
            },
            {
              "name": "libgnutls30t64",
              "version": "3.8.9-3"
            },
            {
              "name": "libgnutls30t64",
              "version": "3.8.9-3"
            },
            {
              "name": "libgoa-1.0-0b",
              "version": "3.54.5-1~deb13u1"
            },
            {
              "name": "libgoa-1.0-common",
              "version": "3.54.5-1~deb13u1"
            },
            {
              "name": "libgoa-backend-1.0-2",
              "version": "3.54.5-1~deb13u1"
            },
            {
              "name": "libgom-1.0-0t64",
              "version": "0.5.3-1"
            },
            {
              "name": "libgomp1",
              "version": "14.2.0-19"
            },
            {
              "name": "libgomp1",
              "version": "14.2.0-19"
            },
            {
              "name": "libgpg-error-l10n",
              "version": "1.51-4"
            },
            {
              "name": "libgpg-error0",
              "version": "1.51-4"
            },
            {
              "name": "libgpg-error0",
              "version": "1.51-4"
            },
            {
              "name": "libgpgme11t64",
              "version": "1.24.2-3"
            },
            {
              "name": "libgpgmepp6t64",
              "version": "1.24.2-3"
            },
            {
              "name": "libgphoto2-6t64",
              "version": "2.5.31-4"
            },
            {
              "name": "libgphoto2-l10n",
              "version": "2.5.31-4"
            },
            {
              "name": "libgphoto2-port12t64",
              "version": "2.5.31-4"
            },
            {
              "name": "libgpm2",
              "version": "1.20.7-11+b2"
            },
            {
              "name": "libgprofng0",
              "version": "2.44-3"
            },
            {
              "name": "libgraphene-1.0-0",
              "version": "1.10.8-5"
            },
            {
              "name": "libgraphite2-3",
              "version": "1.3.14-2+b1"
            },
            {
              "name": "libgraphite2-3",
              "version": "1.3.14-2+b1"
            },
            {
              "name": "libgrilo-0.3-0",
              "version": "0.3.16-2"
            },
            {
              "name": "libgs-common",
              "version": "10.05.1~dfsg-1+deb13u1"
            },
            {
              "name": "libgs10-common",
              "version": "10.05.1~dfsg-1+deb13u1"
            },
            {
              "name": "libgs10",
              "version": "10.05.1~dfsg-1+deb13u1"
            },
            {
              "name": "libgsf-1-114",
              "version": "1.14.53-1"
            },
            {
              "name": "libgsf-1-common",
              "version": "1.14.53-1"
            },
            {
              "name": "libgsf-bin",
              "version": "1.14.53-1"
            },
            {
              "name": "libgsl28",
              "version": "2.8+dfsg-5"
            },
            {
              "name": "libgslcblas0",
              "version": "2.8+dfsg-5"
            },
            {
              "name": "libgsm1",
              "version": "1.0.22-1+b2"
            },
            {
              "name": "libgsm1",
              "version": "1.0.22-1+b2"
            },
            {
              "name": "libgsound0t64",
              "version": "1.0.3-3.2+b4"
            },
            {
              "name": "libgspell-1-3",
              "version": "1.14.0-2+b1"
            },
            {
              "name": "libgspell-1-common",
              "version": "1.14.0-2"
            },
            {
              "name": "libgssapi-krb5-2",
              "version": "1.21.3-5"
            },
            {
              "name": "libgssdp-1.6-0",
              "version": "1.6.4-1~deb13u1"
            },
            {
              "name": "libgstreamer-gl1.0-0",
              "version": "1.26.2-1"
            },
            {
              "name": "libgstreamer-plugins-bad1.0-0",
              "version": "1.26.2-3"
            },
            {
              "name": "libgstreamer-plugins-base1.0-0",
              "version": "1.26.2-1"
            },
            {
              "name": "libgstreamer1.0-0",
              "version": "1.26.2-2"
            },
            {
              "name": "libgtk-3-0t64",
              "version": "3.24.49-3"
            },
            {
              "name": "libgtk-3-bin",
              "version": "3.24.49-3"
            },
            {
              "name": "libgtk-3-common",
              "version": "3.24.49-3"
            },
            {
              "name": "libgtk-4-1",
              "version": "4.18.6+ds-2"
            },
            {
              "name": "libgtk-4-bin",
              "version": "4.18.6+ds-2"
            },
            {
              "name": "libgtk-4-common",
              "version": "4.18.6+ds-2"
            },
            {
              "name": "libgtk-4-media-gstreamer",
              "version": "4.18.6+ds-2"
            },
            {
              "name": "libgtk3-perl",
              "version": "0.038-3"
            },
            {
              "name": "libgtk4-layer-shell-dev",
              "version": "1.0.4-2"
            },
            {
              "name": "libgtk4-layer-shell0",
              "version": "1.0.4-2"
            },
            {
              "name": "libgtkmm-4.0-0",
              "version": "4.18.0-1"
            },
            {
              "name": "libgtksourceview-4-0",
              "version": "4.8.4-6"
            },
            {
              "name": "libgtksourceview-4-common",
              "version": "4.8.4-6"
            },
            {
              "name": "libgtksourceview-5-0",
              "version": "5.16.0-1"
            },
            {
              "name": "libgtksourceview-5-common",
              "version": "5.16.0-1"
            },
            {
              "name": "libgtop-2.0-11",
              "version": "2.41.3-1+b2"
            },
            {
              "name": "libgtop2-common",
              "version": "2.41.3-1"
            },
            {
              "name": "libgudev-1.0-0",
              "version": "238-6"
            },
            {
              "name": "libgupnp-1.6-0",
              "version": "1.6.8-2"
            },
            {
              "name": "libgupnp-av-1.0-3",
              "version": "0.14.3-1"
            },
            {
              "name": "libgupnp-dlna-2.0-4",
              "version": "0.12.0-4+b2"
            },
            {
              "name": "libgupnp-igd-1.6-0",
              "version": "1.6.0-4+b1"
            },
            {
              "name": "libgusb2",
              "version": "0.4.9-1+b1"
            },
            {
              "name": "libgweather-4-0t64",
              "version": "4.4.4-1"
            },
            {
              "name": "libgweather-4-common",
              "version": "4.4.4-1"
            },
            {
              "name": "libgxps2t64",
              "version": "0.3.2-4+b2"
            },
            {
              "name": "libhandy-1-0",
              "version": "1.8.3-2"
            },
            {
              "name": "libharfbuzz-gobject0",
              "version": "10.2.0-1+b1"
            },
            {
              "name": "libharfbuzz-icu0",
              "version": "10.2.0-1+b1"
            },
            {
              "name": "libharfbuzz-subset0",
              "version": "10.2.0-1+b1"
            },
            {
              "name": "libharfbuzz0b",
              "version": "10.2.0-1+b1"
            },
            {
              "name": "libharfbuzz0b",
              "version": "10.2.0-1+b1"
            },
            {
              "name": "libheif-plugin-aomenc",
              "version": "1.19.8-1"
            },
            {
              "name": "libheif-plugin-dav1d",
              "version": "1.19.8-1"
            },
            {
              "name": "libheif-plugin-libde265",
              "version": "1.19.8-1"
            },
            {
              "name": "libheif-plugin-x265",
              "version": "1.19.8-1"
            },
            {
              "name": "libheif1",
              "version": "1.19.8-1"
            },
            {
              "name": "libhidapi-hidraw0",
              "version": "0.14.0-1+b2"
            },
            {
              "name": "libhogweed6t64",
              "version": "3.10.1-1"
            },
            {
              "name": "libhogweed6t64",
              "version": "3.10.1-1"
            },
            {
              "name": "libhtml-form-perl",
              "version": "6.12-1"
            },
            {
              "name": "libhtml-format-perl",
              "version": "2.16-2"
            },
            {
              "name": "libhtml-parser-perl",
              "version": "3.83-1+b2"
            },
            {
              "name": "libhtml-tagset-perl",
              "version": "3.24-1"
            },
            {
              "name": "libhtml-tree-perl",
              "version": "5.07-3"
            },
            {
              "name": "libhttp-cookies-perl",
              "version": "6.11-1"
            },
            {
              "name": "libhttp-daemon-perl",
              "version": "6.16-1"
            },
            {
              "name": "libhttp-date-perl",
              "version": "6.06-1"
            },
            {
              "name": "libhttp-message-perl",
              "version": "7.00-2"
            },
            {
              "name": "libhttp-negotiate-perl",
              "version": "6.01-2"
            },
            {
              "name": "libhunspell-1.7-0",
              "version": "1.7.2+really1.7.2-10+b4"
            },
            {
              "name": "libhwasan0",
              "version": "14.2.0-19"
            },
            {
              "name": "libhwy1t64",
              "version": "1.2.0-2+b2"
            },
            {
              "name": "libhwy1t64",
              "version": "1.2.0-2+b2"
            },
            {
              "name": "libhyphen0",
              "version": "2.8.8-7+b2"
            },
            {
              "name": "libibus-1.0-5",
              "version": "1.5.32-2"
            },
            {
              "name": "libical3t64",
              "version": "3.0.20-1+b1"
            },
            {
              "name": "libice6",
              "version": "2:1.1.1-1"
            },
            {
              "name": "libicu76",
              "version": "76.1-4"
            },
            {
              "name": "libidn12",
              "version": "1.43-1"
            },
            {
              "name": "libidn2-0",
              "version": "2.3.8-2"
            },
            {
              "name": "libidn2-0",
              "version": "2.3.8-2"
            },
            {
              "name": "libiec61883-0",
              "version": "1.2.0-7"
            },
            {
              "name": "libieee1284-3t64",
              "version": "0.2.11-14.1+b1"
            },
            {
              "name": "libigdgmm12",
              "version": "22.7.2+ds1-1"
            },
            {
              "name": "libigdgmm12",
              "version": "22.7.2+ds1-1"
            },
            {
              "name": "libijs-0.35",
              "version": "0.35-15.2"
            },
            {
              "name": "libimagequant0",
              "version": "2.18.0-1+b2"
            },
            {
              "name": "libimath-3-1-29t64",
              "version": "3.1.12-1+b3"
            },
            {
              "name": "libimobiledevice-1.0-6",
              "version": "1.3.0+git20250228-2"
            },
            {
              "name": "libimobiledevice-glue-1.0-0",
              "version": "1.3.1-1"
            },
            {
              "name": "libinih1",
              "version": "59-1"
            },
            {
              "name": "libinireader0",
              "version": "59-1"
            },
            {
              "name": "libinput-bin",
              "version": "1.28.1-1"
            },
            {
              "name": "libinput10",
              "version": "1.28.1-1"
            },
            {
              "name": "libinstpatch-1.0-2",
              "version": "1.1.6-1+b2"
            },
            {
              "name": "libio-compress-brotli-perl",
              "version": "0.004001-2+b3"
            },
            {
              "name": "libio-html-perl",
              "version": "1.004-3"
            },
            {
              "name": "libio-socket-ssl-perl",
              "version": "2.089-1"
            },
            {
              "name": "libio-stringy-perl",
              "version": "2.113-2"
            },
            {
              "name": "libip4tc2",
              "version": "1.8.11-2"
            },
            {
              "name": "libip6tc2",
              "version": "1.8.11-2"
            },
            {
              "name": "libipc-system-simple-perl",
              "version": "1.30-2"
            },
            {
              "name": "libiptcdata0",
              "version": "1.0.5-2.4"
            },
            {
              "name": "libisl23",
              "version": "0.27-1"
            },
            {
              "name": "libitm1",
              "version": "14.2.0-19"
            },
            {
              "name": "libiw30t64",
              "version": "30~pre9-18+b1"
            },
            {
              "name": "libixml11t64",
              "version": "1:1.14.20-1"
            },
            {
              "name": "libjack-jackd2-0",
              "version": "1.9.22~dfsg-4"
            },
            {
              "name": "libjack-jackd2-0",
              "version": "1.9.22~dfsg-4"
            },
            {
              "name": "libjansson4",
              "version": "2.14-2+b3"
            },
            {
              "name": "libjavascriptcoregtk-4.1-0",
              "version": "2.50.1-1~deb13u1"
            },
            {
              "name": "libjavascriptcoregtk-6.0-1",
              "version": "2.50.1-1~deb13u1"
            },
            {
              "name": "libjaylink0",
              "version": "0.4.0-1"
            },
            {
              "name": "libjbig0",
              "version": "2.1-6.1+b2"
            },
            {
              "name": "libjbig0",
              "version": "2.1-6.1+b2"
            },
            {
              "name": "libjbig2dec0",
              "version": "0.20-1+b3"
            },
            {
              "name": "libjcat1",
              "version": "0.2.3-1"
            },
            {
              "name": "libjemalloc2",
              "version": "5.3.0-3"
            },
            {
              "name": "libjim0.83",
              "version": "0.83-2"
            },
            {
              "name": "libjpeg62-turbo",
              "version": "1:2.1.5-4"
            },
            {
              "name": "libjpeg62-turbo",
              "version": "1:2.1.5-4"
            },
            {
              "name": "libjq1",
              "version": "1.7.1-6+deb13u1"
            },
            {
              "name": "libjson-c5",
              "version": "0.18+ds-1"
            },
            {
              "name": "libjson-glib-1.0-0",
              "version": "1.10.6+ds-2"
            },
            {
              "name": "libjson-glib-1.0-common",
              "version": "1.10.6+ds-2"
            },
            {
              "name": "libjsoncpp26",
              "version": "1.9.6-3"
            },
            {
              "name": "libjxl-gdk-pixbuf",
              "version": "0.11.1-4"
            },
            {
              "name": "libjxl0.11",
              "version": "0.11.1-4"
            },
            {
              "name": "libjxl0.11",
              "version": "0.11.1-4"
            },
            {
              "name": "libjxr-tools",
              "version": "1.2~git20170615.f752187-5.3"
            },
            {
              "name": "libjxr0t64",
              "version": "1.2~git20170615.f752187-5.3"
            },
            {
              "name": "libk5crypto3",
              "version": "1.21.3-5"
            },
            {
              "name": "libkate1",
              "version": "0.4.3-1"
            },
            {
              "name": "libkeybinder-3.0-0",
              "version": "0.3.2-1.1+b3"
            },
            {
              "name": "libkeyutils1",
              "version": "1.6.3-6"
            },
            {
              "name": "libklibc",
              "version": "2.0.14-1"
            },
            {
              "name": "libkmod2",
              "version": "34.2-2"
            },
            {
              "name": "libkpathsea6",
              "version": "2024.20240313.70630+ds-6"
            },
            {
              "name": "libkrb5-3",
              "version": "1.21.3-5"
            },
            {
              "name": "libkrb5support0",
              "version": "1.21.3-5"
            },
            {
              "name": "libksba8",
              "version": "1.6.7-2+b1"
            },
            {
              "name": "liblangtag-common",
              "version": "0.6.7-1"
            },
            {
              "name": "liblangtag1",
              "version": "0.6.7-1+b2"
            },
            {
              "name": "liblapack3",
              "version": "3.12.1-6"
            },
            {
              "name": "liblastlog2-2",
              "version": "2.41-5"
            },
            {
              "name": "liblc3-1",
              "version": "1.1.3+dfsg-1"
            },
            {
              "name": "liblcms2-2",
              "version": "2.16-2"
            },
            {
              "name": "liblcms2-2",
              "version": "2.16-2"
            },
            {
              "name": "libldacbt-abr2",
              "version": "2.0.2.3+git20200429+ed310a0-5"
            },
            {
              "name": "libldacbt-enc2",
              "version": "2.0.2.3+git20200429+ed310a0-5"
            },
            {
              "name": "libldap-common",
              "version": "2.6.10+dfsg-1"
            },
            {
              "name": "libldap2",
              "version": "2.6.10+dfsg-1"
            },
            {
              "name": "libldb2",
              "version": "2:2.11.0+samba4.22.4+dfsg-1~deb13u1"
            },
            {
              "name": "liblerc4",
              "version": "4.0.0+ds-5"
            },
            {
              "name": "liblerc4",
              "version": "4.0.0+ds-5"
            },
            {
              "name": "liblilv-0-0",
              "version": "0.24.26-1"
            },
            {
              "name": "liblirc-client0t64",
              "version": "0.10.2-0.10"
            },
            {
              "name": "libllvm19",
              "version": "1:19.1.7-3+b1"
            },
            {
              "name": "libllvm19",
              "version": "1:19.1.7-3+b1"
            },
            {
              "name": "liblmdb0",
              "version": "0.9.31-1+b2"
            },
            {
              "name": "liblocale-gettext-perl",
              "version": "1.07-7+b1"
            },
            {
              "name": "liblockfile-bin",
              "version": "1.17-2"
            },
            {
              "name": "liblouis-data",
              "version": "3.33.0-1"
            },
            {
              "name": "liblouis20",
              "version": "3.33.0-1"
            },
            {
              "name": "liblouisutdml-bin",
              "version": "2.12.0-7"
            },
            {
              "name": "liblouisutdml-data",
              "version": "2.12.0-7"
            },
            {
              "name": "liblouisutdml9t64",
              "version": "2.12.0-7"
            },
            {
              "name": "liblqr-1-0",
              "version": "0.4.2-2.1+b2"
            },
            {
              "name": "liblrdf0",
              "version": "0.6.1-4+b2"
            },
            {
              "name": "liblsan0",
              "version": "14.2.0-19"
            },
            {
              "name": "liblsof0",
              "version": "4.99.4+dfsg-2"
            },
            {
              "name": "libltc11",
              "version": "1.3.2-1+b2"
            },
            {
              "name": "libltdl7",
              "version": "2.5.4-4"
            },
            {
              "name": "liblttng-ust-common1t64",
              "version": "2.13.9-1"
            },
            {
              "name": "liblttng-ust-ctl5t64",
              "version": "2.13.9-1"
            },
            {
              "name": "liblttng-ust1t64",
              "version": "2.13.9-1"
            },
            {
              "name": "liblua5.2-0",
              "version": "5.2.4-3+b3"
            },
            {
              "name": "liblua5.3-0",
              "version": "5.3.6-2+b4"
            },
            {
              "name": "liblua5.4-0",
              "version": "5.4.7-1+b2"
            },
            {
              "name": "liblwp-mediatypes-perl",
              "version": "6.04-2"
            },
            {
              "name": "liblwp-protocol-https-perl",
              "version": "6.14-1"
            },
            {
              "name": "liblz4-1",
              "version": "1.10.0-4"
            },
            {
              "name": "liblzma5",
              "version": "5.8.1-1"
            },
            {
              "name": "liblzma5",
              "version": "5.8.1-1"
            },
            {
              "name": "liblzo2-2",
              "version": "2.10-3+b1"
            },
            {
              "name": "libmad0",
              "version": "0.15.1b-11+b1"
            },
            {
              "name": "libmagic-mgc",
              "version": "1:5.46-5"
            },
            {
              "name": "libmagic1t64",
              "version": "1:5.46-5"
            },
            {
              "name": "libmagickcore-7.q16-10-extra",
              "version": "8:7.1.1.43+dfsg1-1+deb13u2"
            },
            {
              "name": "libmagickcore-7.q16-10",
              "version": "8:7.1.1.43+dfsg1-1+deb13u2"
            },
            {
              "name": "libmagickwand-7.q16-10",
              "version": "8:7.1.1.43+dfsg1-1+deb13u2"
            },
            {
              "name": "libmailtools-perl",
              "version": "2.22-1"
            },
            {
              "name": "libmalcontent-0-0",
              "version": "0.13.0-2"
            },
            {
              "name": "libmanette-0.2-0",
              "version": "0.2.12-1"
            },
            {
              "name": "libmatroska7",
              "version": "1.7.1-1+b2"
            },
            {
              "name": "libmaxminddb0",
              "version": "1.12.2-1"
            },
            {
              "name": "libmbedcrypto16",
              "version": "3.6.4-2"
            },
            {
              "name": "libmbim-glib4",
              "version": "1.32.0-1"
            },
            {
              "name": "libmbim-proxy",
              "version": "1.32.0-1"
            },
            {
              "name": "libmbim-utils",
              "version": "1.32.0-1"
            },
            {
              "name": "libmd0",
              "version": "1.1.0-2+b1"
            },
            {
              "name": "libmd0",
              "version": "1.1.0-2+b1"
            },
            {
              "name": "libmd4c0",
              "version": "0.5.2-2+b1"
            },
            {
              "name": "libmediaart-2.0-0",
              "version": "1.9.7-1"
            },
            {
              "name": "libmhash2",
              "version": "0.9.9.9-10"
            },
            {
              "name": "libminizip1t64",
              "version": "1:1.3.dfsg+really1.3.1-1+b1"
            },
            {
              "name": "libmjpegutils-2.1-0t64",
              "version": "1:2.1.0+debian-8.1+b1"
            },
            {
              "name": "libmm-glib0",
              "version": "1.24.0-1+deb13u1"
            },
            {
              "name": "libmnl0",
              "version": "1.0.5-3"
            },
            {
              "name": "libmodplug1",
              "version": "1:0.8.9.0-3+b2"
            },
            {
              "name": "libmodulemd2",
              "version": "2.15.0-1"
            },
            {
              "name": "libmount1",
              "version": "2.41-5"
            },
            {
              "name": "libmount1",
              "version": "2.41-5"
            },
            {
              "name": "libmozjs-128-0",
              "version": "128.14.0-1~deb13u1"
            },
            {
              "name": "libmp3lame0",
              "version": "3.100-6+b3"
            },
            {
              "name": "libmp3lame0",
              "version": "3.100-6+b3"
            },
            {
              "name": "libmpc3",
              "version": "1.3.1-1+b3"
            },
            {
              "name": "libmpcdec6",
              "version": "2:0.1~r495-3"
            },
            {
              "name": "libmpeg2-4",
              "version": "0.5.1-9+b3"
            },
            {
              "name": "libmpeg2encpp-2.1-0t64",
              "version": "1:2.1.0+debian-8.1+b1"
            },
            {
              "name": "libmpfr6",
              "version": "4.2.2-1"
            },
            {
              "name": "libmpg123-0t64",
              "version": "1.32.10-1"
            },
            {
              "name": "libmpg123-0t64",
              "version": "1.32.10-1"
            },
            {
              "name": "libmplex2-2.1-0t64",
              "version": "1:2.1.0+debian-8.1+b1"
            },
            {
              "name": "libmsgraph-1-1",
              "version": "0.3.3-3"
            },
            {
              "name": "libmspack0t64",
              "version": "0.11-1.1+b1"
            },
            {
              "name": "libmtdev1t64",
              "version": "1.1.7-1"
            },
            {
              "name": "libmtp-common",
              "version": "1.1.22-1"
            },
            {
              "name": "libmtp-runtime",
              "version": "1.1.22-1"
            },
            {
              "name": "libmtp9t64",
              "version": "1.1.22-1"
            },
            {
              "name": "libmutter-16-0",
              "version": "48.4-2"
            },
            {
              "name": "libmwaw-0.3-3",
              "version": "0.3.22-1+b2"
            },
            {
              "name": "libmysofa1",
              "version": "1.3.3+dfsg-1"
            },
            {
              "name": "libmythes-1.2-0",
              "version": "2:1.2.5-1+b2"
            },
            {
              "name": "libnautilus-extension4",
              "version": "48.3-2"
            },
            {
              "name": "libncurses6",
              "version": "6.5+20250216-2"
            },
            {
              "name": "libncursesw6",
              "version": "6.5+20250216-2"
            },
            {
              "name": "libndp0",
              "version": "1.9-1+b1"
            },
            {
              "name": "libneon27t64",
              "version": "0.34.2-1"
            },
            {
              "name": "libnet-dbus-perl",
              "version": "1.2.0-2+b3"
            },
            {
              "name": "libnet-http-perl",
              "version": "6.23-1"
            },
            {
              "name": "libnet-smtp-ssl-perl",
              "version": "1.04-2"
            },
            {
              "name": "libnet-ssleay-perl",
              "version": "1.94-3"
            },
            {
              "name": "libnetfilter-conntrack3",
              "version": "1.1.0-1"
            },
            {
              "name": "libnetpbm11t64",
              "version": "2:11.10.02-1"
            },
            {
              "name": "libnettle8t64",
              "version": "3.10.1-1"
            },
            {
              "name": "libnettle8t64",
              "version": "3.10.1-1"
            },
            {
              "name": "libnewt0.52",
              "version": "0.52.25-1"
            },
            {
              "name": "libnfnetlink0",
              "version": "1.0.2-3"
            },
            {
              "name": "libnfs14",
              "version": "5.0.2-1+b2"
            },
            {
              "name": "libnftables1",
              "version": "1.1.3-1"
            },
            {
              "name": "libnftnl11",
              "version": "1.2.9-1"
            },
            {
              "name": "libnghttp2-14",
              "version": "1.64.0-1.1"
            },
            {
              "name": "libnghttp3-9",
              "version": "1.8.0-1"
            },
            {
              "name": "libngtcp2-16",
              "version": "1.11.0-1"
            },
            {
              "name": "libngtcp2-crypto-gnutls8",
              "version": "1.11.0-1"
            },
            {
              "name": "libnice10",
              "version": "0.1.22-1"
            },
            {
              "name": "libnl-3-200",
              "version": "3.7.0-2"
            },
            {
              "name": "libnl-genl-3-200",
              "version": "3.7.0-2"
            },
            {
              "name": "libnl-route-3-200",
              "version": "3.7.0-2"
            },
            {
              "name": "libnm0",
              "version": "1.52.1-1"
            },
            {
              "name": "libnm0",
              "version": "1.52.1-1"
            },
            {
              "name": "libnma-common",
              "version": "1.10.6-5"
            },
            {
              "name": "libnma-gtk4-0",
              "version": "1.10.6-5"
            },
            {
              "name": "libnma0",
              "version": "1.10.6-5"
            },
            {
              "name": "libnorm1t64",
              "version": "1.5.9+dfsg-3.1+b2"
            },
            {
              "name": "libnotify4",
              "version": "0.8.6-1"
            },
            {
              "name": "libnpth0t64",
              "version": "1.8-3"
            },
            {
              "name": "libnspr4",
              "version": "2:4.36-1"
            },
            {
              "name": "libnss-mdns",
              "version": "0.15.1-4+b1"
            },
            {
              "name": "libnss-myhostname",
              "version": "257.8-1~deb13u2"
            },
            {
              "name": "libnss-systemd",
              "version": "257.8-1~deb13u2"
            },
            {
              "name": "libnss3",
              "version": "2:3.110-1"
            },
            {
              "name": "libntfs-3g89t64",
              "version": "1:2022.10.3-5"
            },
            {
              "name": "libnuma1",
              "version": "2.0.19-1"
            },
            {
              "name": "libnuma1",
              "version": "2.0.19-1"
            },
            {
              "name": "libnumbertext-1.0-0",
              "version": "1.0.11-4+b2"
            },
            {
              "name": "libnumbertext-data",
              "version": "1.0.11-4"
            },
            {
              "name": "libnvme1t64",
              "version": "1.13-2"
            },
            {
              "name": "liboauth0",
              "version": "1.0.3-5+b2"
            },
            {
              "name": "libodfgen-0.1-1",
              "version": "0.1.8-2+b2"
            },
            {
              "name": "libogg0",
              "version": "1.3.5-3+b2"
            },
            {
              "name": "libogg0",
              "version": "1.3.5-3+b2"
            },
            {
              "name": "libonig5",
              "version": "6.9.9-1+b1"
            },
            {
              "name": "libonnx1t64",
              "version": "1.17.0-3+b1"
            },
            {
              "name": "libonnxruntime1.21",
              "version": "1.21.0+dfsg-1"
            },
            {
              "name": "libopenal-data",
              "version": "1:1.24.2-1"
            },
            {
              "name": "libopenal1",
              "version": "1:1.24.2-1"
            },
            {
              "name": "libopencore-amrnb0",
              "version": "0.1.6-1+b2"
            },
            {
              "name": "libopencore-amrwb0",
              "version": "0.1.6-1+b2"
            },
            {
              "name": "libopenexr-3-1-30",
              "version": "3.1.13-2"
            },
            {
              "name": "libopenfec1",
              "version": "1.4.2.11+dfsg-1"
            },
            {
              "name": "libopengl0",
              "version": "1.7.0-1+b2"
            },
            {
              "name": "libopenh264-8",
              "version": "2.6.0+dfsg-2"
            },
            {
              "name": "libopenjp2-7",
              "version": "2.5.3-2.1~deb13u1"
            },
            {
              "name": "libopenjp2-7",
              "version": "2.5.3-2.1~deb13u1"
            },
            {
              "name": "libopenmpt-modplug1",
              "version": "0.8.9.0-openmpt1-2+b3"
            },
            {
              "name": "libopenmpt0t64",
              "version": "0.7.13-1+b1"
            },
            {
              "name": "libopenni2-0",
              "version": "2.2.0.33+dfsg-18+b2"
            },
            {
              "name": "libopus0",
              "version": "1.5.2-2"
            },
            {
              "name": "libopus0",
              "version": "1.5.2-2"
            },
            {
              "name": "liborc-0.4-0t64",
              "version": "1:0.4.41-1"
            },
            {
              "name": "liborcus-0.18-0",
              "version": "0.19.2-6+b1"
            },
            {
              "name": "liborcus-parser-0.18-0",
              "version": "0.19.2-6+b1"
            },
            {
              "name": "libosinfo-1.0-0",
              "version": "1.12.0-2"
            },
            {
              "name": "libosinfo-l10n",
              "version": "1.12.0-2"
            },
            {
              "name": "libp11-kit0",
              "version": "0.25.5-3"
            },
            {
              "name": "libp11-kit0",
              "version": "0.25.5-3"
            },
            {
              "name": "libpackagekit-glib2-18",
              "version": "1.3.1-1"
            },
            {
              "name": "libpam-gnome-keyring",
              "version": "48.0-1"
            },
            {
              "name": "libpam-modules-bin",
              "version": "1.7.0-5"
            },
            {
              "name": "libpam-modules",
              "version": "1.7.0-5"
            },
            {
              "name": "libpam-runtime",
              "version": "1.7.0-5"
            },
            {
              "name": "libpam-systemd",
              "version": "257.8-1~deb13u2"
            },
            {
              "name": "libpam-wtmpdb",
              "version": "0.73.0-3"
            },
            {
              "name": "libpam0g",
              "version": "1.7.0-5"
            },
            {
              "name": "libpango-1.0-0",
              "version": "1.56.3-1"
            },
            {
              "name": "libpango-1.0-0",
              "version": "1.56.3-1"
            },
            {
              "name": "libpangocairo-1.0-0",
              "version": "1.56.3-1"
            },
            {
              "name": "libpangocairo-1.0-0",
              "version": "1.56.3-1"
            },
            {
              "name": "libpangoft2-1.0-0",
              "version": "1.56.3-1"
            },
            {
              "name": "libpangoft2-1.0-0",
              "version": "1.56.3-1"
            },
            {
              "name": "libpangomm-2.48-1t64",
              "version": "2.56.1-1"
            },
            {
              "name": "libpangoxft-1.0-0",
              "version": "1.56.3-1"
            },
            {
              "name": "libpaper-utils",
              "version": "2.2.5-0.3+b2"
            },
            {
              "name": "libpaper2",
              "version": "2.2.5-0.3+b2"
            },
            {
              "name": "libparted2t64",
              "version": "3.6-5"
            },
            {
              "name": "libpcap0.8t64",
              "version": "1.10.5-2"
            },
            {
              "name": "libpcaudio0",
              "version": "1.3-1"
            },
            {
              "name": "libpci3",
              "version": "1:3.13.0-2"
            },
            {
              "name": "libpciaccess0",
              "version": "0.17-3+b3"
            },
            {
              "name": "libpciaccess0",
              "version": "0.17-3+b3"
            },
            {
              "name": "libpcre2-16-0",
              "version": "10.46-1~deb13u1"
            },
            {
              "name": "libpcre2-8-0",
              "version": "10.46-1~deb13u1"
            },
            {
              "name": "libpcre2-8-0",
              "version": "10.46-1~deb13u1"
            },
            {
              "name": "libpcsclite1",
              "version": "2.3.3-1"
            },
            {
              "name": "libpeas-1.0-0",
              "version": "1.36.0-3+b4"
            },
            {
              "name": "libpeas-common",
              "version": "1.36.0-3"
            },
            {
              "name": "libperl5.40",
              "version": "5.40.1-6"
            },
            {
              "name": "libpgm-5.3-0t64",
              "version": "5.3.128~dfsg-2.1+b1"
            },
            {
              "name": "libphonenumber8",
              "version": "8.13.51+ds-4.2"
            },
            {
              "name": "libpipeline1",
              "version": "1.5.8-1"
            },
            {
              "name": "libpipewire-0.3-0t64",
              "version": "1.4.2-1"
            },
            {
              "name": "libpipewire-0.3-common",
              "version": "1.4.2-1"
            },
            {
              "name": "libpipewire-0.3-modules",
              "version": "1.4.2-1"
            },
            {
              "name": "libpixman-1-0",
              "version": "0.44.0-3"
            },
            {
              "name": "libpixman-1-0",
              "version": "0.44.0-3"
            },
            {
              "name": "libplacebo349",
              "version": "7.349.0-3"
            },
            {
              "name": "libplist-2.0-4",
              "version": "2.6.0-2+b1"
            },
            {
              "name": "libplymouth5",
              "version": "24.004.60-5"
            },
            {
              "name": "libpng16-16t64",
              "version": "1.6.48-1"
            },
            {
              "name": "libpng16-16t64",
              "version": "1.6.48-1"
            },
            {
              "name": "libpocketsphinx3",
              "version": "0.8+5prealpha+1-15+b4"
            },
            {
              "name": "libpolkit-agent-1-0",
              "version": "126-2"
            },
            {
              "name": "libpolkit-gobject-1-0",
              "version": "126-2"
            },
            {
              "name": "libpoppler-cpp2",
              "version": "25.03.0-5"
            },
            {
              "name": "libpoppler-glib8t64",
              "version": "25.03.0-5"
            },
            {
              "name": "libpoppler147",
              "version": "25.03.0-5"
            },
            {
              "name": "libpopt0",
              "version": "1.19+dfsg-2"
            },
            {
              "name": "libportal-gtk3-1",
              "version": "0.9.1-1"
            },
            {
              "name": "libportal-gtk4-1",
              "version": "0.9.1-1"
            },
            {
              "name": "libportal1",
              "version": "0.9.1-1"
            },
            {
              "name": "libpostproc58",
              "version": "7:7.1.2-0+deb13u1"
            },
            {
              "name": "libproc2-0",
              "version": "2:4.0.4-9"
            },
            {
              "name": "libprotobuf-c1",
              "version": "1.5.1-1"
            },
            {
              "name": "libprotobuf-lite32t64",
              "version": "3.21.12-11"
            },
            {
              "name": "libprotobuf32t64",
              "version": "3.21.12-11"
            },
            {
              "name": "libproxy-tools",
              "version": "0.5.9-1"
            },
            {
              "name": "libproxy1v5",
              "version": "0.5.9-1"
            },
            {
              "name": "libpsl5t64",
              "version": "0.21.2-1.1+b1"
            },
            {
              "name": "libpst4t64",
              "version": "0.6.76-1.2"
            },
            {
              "name": "libpthreadpool0",
              "version": "0.0~git20240616.560c60d-1"
            },
            {
              "name": "libpulse-mainloop-glib0",
              "version": "17.0+dfsg1-2+b1"
            },
            {
              "name": "libpulse0",
              "version": "17.0+dfsg1-2+b1"
            },
            {
              "name": "libpulse0",
              "version": "17.0+dfsg1-2+b1"
            },
            {
              "name": "libpwquality-common",
              "version": "1.4.5-5"
            },
            {
              "name": "libpwquality1",
              "version": "1.4.5-5"
            },
            {
              "name": "libpython3-stdlib",
              "version": "3.13.5-1"
            },
            {
              "name": "libpython3.13-minimal",
              "version": "3.13.5-2"
            },
            {
              "name": "libpython3.13-stdlib",
              "version": "3.13.5-2"
            },
            {
              "name": "libpython3.13",
              "version": "3.13.5-2"
            },
            {
              "name": "libqmi-glib5",
              "version": "1.36.0-1"
            },
            {
              "name": "libqmi-proxy",
              "version": "1.36.0-1"
            },
            {
              "name": "libqmi-utils",
              "version": "1.36.0-1"
            },
            {
              "name": "libqpdf30",
              "version": "12.2.0-1"
            },
            {
              "name": "libqrencode4",
              "version": "4.1.1-2"
            },
            {
              "name": "libqrtr-glib0",
              "version": "1.2.2-1+b2"
            },
            {
              "name": "libqt5core5t64",
              "version": "5.15.15+dfsg-6"
            },
            {
              "name": "libqt5dbus5t64",
              "version": "5.15.15+dfsg-6"
            },
            {
              "name": "libqt5designer5",
              "version": "5.15.15-6"
            },
            {
              "name": "libqt5gui5t64",
              "version": "5.15.15+dfsg-6"
            },
            {
              "name": "libqt5help5",
              "version": "5.15.15-6"
            },
            {
              "name": "libqt5network5t64",
              "version": "5.15.15+dfsg-6"
            },
            {
              "name": "libqt5printsupport5t64",
              "version": "5.15.15+dfsg-6"
            },
            {
              "name": "libqt5qml5",
              "version": "5.15.15+dfsg-3"
            },
            {
              "name": "libqt5qmlmodels5",
              "version": "5.15.15+dfsg-3"
            },
            {
              "name": "libqt5quick5",
              "version": "5.15.15+dfsg-3"
            },
            {
              "name": "libqt5sql5-sqlite",
              "version": "5.15.15+dfsg-6"
            },
            {
              "name": "libqt5sql5t64",
              "version": "5.15.15+dfsg-6"
            },
            {
              "name": "libqt5svg5",
              "version": "5.15.15-2"
            },
            {
              "name": "libqt5test5t64",
              "version": "5.15.15+dfsg-6"
            },
            {
              "name": "libqt5waylandclient5",
              "version": "5.15.15-3"
            },
            {
              "name": "libqt5waylandcompositor5",
              "version": "5.15.15-3"
            },
            {
              "name": "libqt5widgets5t64",
              "version": "5.15.15+dfsg-6"
            },
            {
              "name": "libqt5x11extras5",
              "version": "5.15.15-2"
            },
            {
              "name": "libqt5xml5t64",
              "version": "5.15.15+dfsg-6"
            },
            {
              "name": "libquadmath0",
              "version": "14.2.0-19"
            },
            {
              "name": "librabbitmq4",
              "version": "0.15.0-1"
            },
            {
              "name": "libraptor2-0",
              "version": "2.0.16-6"
            },
            {
              "name": "librasqal3t64",
              "version": "0.9.33-2.1+b2"
            },
            {
              "name": "librav1e0.7",
              "version": "0.7.1-9+b2"
            },
            {
              "name": "librav1e0.7",
              "version": "0.7.1-9+b2"
            },
            {
              "name": "libraw1394-11",
              "version": "2.1.2-2+b2"
            },
            {
              "name": "libraw23t64",
              "version": "0.21.4-2"
            },
            {
              "name": "librdf0t64",
              "version": "1.0.17-4+b1"
            },
            {
              "name": "libre2-11",
              "version": "20240702-3+b1"
            },
            {
              "name": "libreadline8t64",
              "version": "8.2-6"
            },
            {
              "name": "libreoffice-base-core",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libreoffice-calc",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libreoffice-common",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libreoffice-core",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libreoffice-gnome",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libreoffice-gtk3",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libreoffice-help-common",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libreoffice-help-en-us",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libreoffice-math",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libreoffice-style-colibre",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libreoffice-style-elementary",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libreoffice-uiconfig-calc",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libreoffice-uiconfig-common",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libreoffice-uiconfig-math",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libreoffice-uiconfig-writer",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libreoffice-writer",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "librepo0",
              "version": "1.20.0-1~deb13u1"
            },
            {
              "name": "libresid-builder0c2a",
              "version": "2.1.1-16"
            },
            {
              "name": "librest-1.0-0",
              "version": "0.9.1-6+b2"
            },
            {
              "name": "librevenge-0.0-0",
              "version": "0.0.5-3+b2"
            },
            {
              "name": "librhash1",
              "version": "1.4.5-1"
            },
            {
              "name": "librist4",
              "version": "0.2.11+dfsg-1"
            },
            {
              "name": "libroc0.4",
              "version": "0.4.0+dfsg-5"
            },
            {
              "name": "librpm-sequoia-1",
              "version": "1.8.0-2"
            },
            {
              "name": "librpm10",
              "version": "4.20.1+dfsg-3"
            },
            {
              "name": "librpmbuild10",
              "version": "4.20.1+dfsg-3"
            },
            {
              "name": "librpmio10",
              "version": "4.20.1+dfsg-3"
            },
            {
              "name": "librpmsign10",
              "version": "4.20.1+dfsg-3"
            },
            {
              "name": "librsvg2-2",
              "version": "2.60.0+dfsg-1"
            },
            {
              "name": "librsvg2-2",
              "version": "2.60.0+dfsg-1"
            },
            {
              "name": "librsvg2-common",
              "version": "2.60.0+dfsg-1"
            },
            {
              "name": "librsvg2-common",
              "version": "2.60.0+dfsg-1"
            },
            {
              "name": "librtmp1",
              "version": "2.4+20151223.gitfa8646d.1-2+b5"
            },
            {
              "name": "librubberband2",
              "version": "3.3.0+dfsg-2+b3"
            },
            {
              "name": "librygel-core-2.8-0",
              "version": "0.44.2-1"
            },
            {
              "name": "librygel-db-2.8-0",
              "version": "0.44.2-1"
            },
            {
              "name": "librygel-renderer-2.8-0",
              "version": "0.44.2-1"
            },
            {
              "name": "librygel-renderer-gst-2.8-0",
              "version": "0.44.2-1"
            },
            {
              "name": "librygel-server-2.8-0",
              "version": "0.44.2-1"
            },
            {
              "name": "libsamplerate0",
              "version": "0.2.2-4+b2"
            },
            {
              "name": "libsamplerate0",
              "version": "0.2.2-4+b2"
            },
            {
              "name": "libsane-common",
              "version": "1.3.1-3"
            },
            {
              "name": "libsane1",
              "version": "1.3.1-3+b1"
            },
            {
              "name": "libsasl2-2",
              "version": "2.1.28+dfsg1-9"
            },
            {
              "name": "libsasl2-modules-db",
              "version": "2.1.28+dfsg1-9"
            },
            {
              "name": "libsasl2-modules",
              "version": "2.1.28+dfsg1-9"
            },
            {
              "name": "libsbc1",
              "version": "2.1-1"
            },
            {
              "name": "libsdl2-2.0-0",
              "version": "2.32.4+dfsg-1"
            },
            {
              "name": "libseccomp2",
              "version": "2.6.0-2"
            },
            {
              "name": "libsecret-1-0",
              "version": "0.21.7-1"
            },
            {
              "name": "libsecret-common",
              "version": "0.21.7-1"
            },
            {
              "name": "libselinux1",
              "version": "3.8.1-1"
            },
            {
              "name": "libselinux1",
              "version": "3.8.1-1"
            },
            {
              "name": "libsemanage-common",
              "version": "3.8.1-1"
            },
            {
              "name": "libsemanage2",
              "version": "3.8.1-1"
            },
            {
              "name": "libsensors-config",
              "version": "1:3.6.2-2"
            },
            {
              "name": "libsensors5",
              "version": "1:3.6.2-2"
            },
            {
              "name": "libsensors5",
              "version": "1:3.6.2-2"
            },
            {
              "name": "libsepol2",
              "version": "3.8.1-1"
            },
            {
              "name": "libserd-0-0",
              "version": "0.32.4-1"
            },
            {
              "name": "libsframe1",
              "version": "2.44-3"
            },
            {
              "name": "libsharpyuv0",
              "version": "1.5.0-0.1"
            },
            {
              "name": "libsharpyuv0",
              "version": "1.5.0-0.1"
            },
            {
              "name": "libshine3",
              "version": "3.1.1-2+b2"
            },
            {
              "name": "libshine3",
              "version": "3.1.1-2+b2"
            },
            {
              "name": "libshout3",
              "version": "2.4.6-1+b3"
            },
            {
              "name": "libsidplay1v5",
              "version": "1.36.60-1+b2"
            },
            {
              "name": "libsidplay2",
              "version": "2.1.1-16"
            },
            {
              "name": "libsigc++-2.0-0v5",
              "version": "2.12.1-3"
            },
            {
              "name": "libsigc++-3.0-0",
              "version": "3.6.0-2+b1"
            },
            {
              "name": "libslang2",
              "version": "2.3.3-5+b2"
            },
            {
              "name": "libsm6",
              "version": "2:1.2.6-1"
            },
            {
              "name": "libsmartcols1",
              "version": "2.41-5"
            },
            {
              "name": "libsmbclient0",
              "version": "2:4.22.4+dfsg-1~deb13u1"
            },
            {
              "name": "libsnappy1v5",
              "version": "1.2.2-1"
            },
            {
              "name": "libsnappy1v5",
              "version": "1.2.2-1"
            },
            {
              "name": "libsndfile1",
              "version": "1.2.2-2+b1"
            },
            {
              "name": "libsndfile1",
              "version": "1.2.2-2+b1"
            },
            {
              "name": "libsnmp-base",
              "version": "5.9.4+dfsg-2"
            },
            {
              "name": "libsnmp40t64",
              "version": "5.9.4+dfsg-2"
            },
            {
              "name": "libsodium23",
              "version": "1.0.18-1+b2"
            },
            {
              "name": "libsolv1",
              "version": "0.7.32-1"
            },
            {
              "name": "libsolvext1",
              "version": "0.7.32-1"
            },
            {
              "name": "libsonic0",
              "version": "0.2.0-13+b1"
            },
            {
              "name": "libsord-0-0",
              "version": "0.16.18-1"
            },
            {
              "name": "libsoundtouch1",
              "version": "2.4.0+ds-1"
            },
            {
              "name": "libsoup-2.4-1",
              "version": "2.74.3-10.1"
            },
            {
              "name": "libsoup-3.0-0",
              "version": "3.6.5-3"
            },
            {
              "name": "libsoup-3.0-common",
              "version": "3.6.5-3"
            },
            {
              "name": "libsoup2.4-common",
              "version": "2.74.3-10.1"
            },
            {
              "name": "libsoxr0",
              "version": "0.1.3-4+b2"
            },
            {
              "name": "libsoxr0",
              "version": "0.1.3-4+b2"
            },
            {
              "name": "libspa-0.2-bluetooth",
              "version": "1.4.2-1"
            },
            {
              "name": "libspa-0.2-libcamera",
              "version": "1.4.2-1"
            },
            {
              "name": "libspa-0.2-modules",
              "version": "1.4.2-1"
            },
            {
              "name": "libspandsp2t64",
              "version": "0.0.6+dfsg-2.2"
            },
            {
              "name": "libspatialaudio0t64",
              "version": "0.3.0+git20180730+dfsg1-2.1+b1"
            },
            {
              "name": "libspectre1",
              "version": "0.2.12-1+b2"
            },
            {
              "name": "libspeechd-module0",
              "version": "0.12.0-5"
            },
            {
              "name": "libspeechd2",
              "version": "0.12.0-5"
            },
            {
              "name": "libspeex1",
              "version": "1.2.1-3"
            },
            {
              "name": "libspeex1",
              "version": "1.2.1-3"
            },
            {
              "name": "libspeexdsp1",
              "version": "1.2.1-3"
            },
            {
              "name": "libspeexdsp1",
              "version": "1.2.1-3"
            },
            {
              "name": "libspelling-1-2",
              "version": "0.4.8-1"
            },
            {
              "name": "libspelling-common",
              "version": "0.4.8-1"
            },
            {
              "name": "libsphinxbase3t64",
              "version": "0.8+5prealpha+1-21+b1"
            },
            {
              "name": "libsqlite3-0",
              "version": "3.46.1-7"
            },
            {
              "name": "libsratom-0-0",
              "version": "0.6.18-1"
            },
            {
              "name": "libsrt1.5-gnutls",
              "version": "1.5.4-1"
            },
            {
              "name": "libsrtp2-1",
              "version": "2.7.0-3"
            },
            {
              "name": "libss2",
              "version": "1.47.2-3+b3"
            },
            {
              "name": "libssh-4",
              "version": "0.11.2-1"
            },
            {
              "name": "libssh2-1t64",
              "version": "1.11.1-1"
            },
            {
              "name": "libssl-dev",
              "version": "3.5.1-1+deb13u1"
            },
            {
              "name": "libssl3t64",
              "version": "3.5.1-1+deb13u1"
            },
            {
              "name": "libstaroffice-0.0-0",
              "version": "0.0.7-1+b2"
            },
            {
              "name": "libstartup-notification0",
              "version": "0.12-8"
            },
            {
              "name": "libstdc++-14-dev",
              "version": "14.2.0-19"
            },
            {
              "name": "libstdc++6",
              "version": "14.2.0-19"
            },
            {
              "name": "libstdc++6",
              "version": "14.2.0-19"
            },
            {
              "name": "libstemmer0d",
              "version": "2.2.0-4+b2"
            },
            {
              "name": "libsuitesparseconfig7",
              "version": "1:7.10.1+dfsg-1"
            },
            {
              "name": "libsvtav1enc2",
              "version": "2.3.0+dfsg-1"
            },
            {
              "name": "libsvtav1enc2",
              "version": "2.3.0+dfsg-1"
            },
            {
              "name": "libswresample5",
              "version": "7:7.1.2-0+deb13u1"
            },
            {
              "name": "libswresample5",
              "version": "7:7.1.2-0+deb13u1"
            },
            {
              "name": "libswscale8",
              "version": "7:7.1.2-0+deb13u1"
            },
            {
              "name": "libsynctex2",
              "version": "2024.20240313.70630+ds-6"
            },
            {
              "name": "libsystemd-shared",
              "version": "257.8-1~deb13u2"
            },
            {
              "name": "libsystemd0",
              "version": "257.8-1~deb13u2"
            },
            {
              "name": "libsystemd0",
              "version": "257.8-1~deb13u2"
            },
            {
              "name": "libtag2",
              "version": "2.0.2-2"
            },
            {
              "name": "libtalloc2",
              "version": "2:2.4.3+samba4.22.4+dfsg-1~deb13u1"
            },
            {
              "name": "libtasn1-6",
              "version": "4.20.0-2"
            },
            {
              "name": "libtasn1-6",
              "version": "4.20.0-2"
            },
            {
              "name": "libtdb1",
              "version": "2:1.4.13+samba4.22.4+dfsg-1~deb13u1"
            },
            {
              "name": "libteamdctl0",
              "version": "1.31-1+b2"
            },
            {
              "name": "libtevent0t64",
              "version": "2:0.16.2+samba4.22.4+dfsg-1~deb13u1"
            },
            {
              "name": "libtext-charwidth-perl",
              "version": "0.04-11+b4"
            },
            {
              "name": "libtext-iconv-perl",
              "version": "1.7-8+b4"
            },
            {
              "name": "libtext-wrapi18n-perl",
              "version": "0.06-10"
            },
            {
              "name": "libthai-data",
              "version": "0.1.29-2"
            },
            {
              "name": "libthai0",
              "version": "0.1.29-2+b1"
            },
            {
              "name": "libthai0",
              "version": "0.1.29-2+b1"
            },
            {
              "name": "libtheora0",
              "version": "1.2.0~alpha1+dfsg-6"
            },
            {
              "name": "libtheoradec1",
              "version": "1.2.0~alpha1+dfsg-6"
            },
            {
              "name": "libtheoradec1",
              "version": "1.2.0~alpha1+dfsg-6"
            },
            {
              "name": "libtheoraenc1",
              "version": "1.2.0~alpha1+dfsg-6"
            },
            {
              "name": "libtheoraenc1",
              "version": "1.2.0~alpha1+dfsg-6"
            },
            {
              "name": "libtie-ixhash-perl",
              "version": "1.23-4"
            },
            {
              "name": "libtiff6",
              "version": "4.7.0-3+deb13u1"
            },
            {
              "name": "libtiff6",
              "version": "4.7.0-3+deb13u1"
            },
            {
              "name": "libtimedate-perl",
              "version": "2.3300-2"
            },
            {
              "name": "libtinfo6",
              "version": "6.5+20250216-2"
            },
            {
              "name": "libtinfo6",
              "version": "6.5+20250216-2"
            },
            {
              "name": "libtinysparql-3.0-0",
              "version": "3.8.2-7"
            },
            {
              "name": "libtirpc-common",
              "version": "1.3.6+ds-1"
            },
            {
              "name": "libtirpc3t64",
              "version": "1.3.6+ds-1"
            },
            {
              "name": "libtorsocks",
              "version": "2.5.0-1"
            },
            {
              "name": "libtotem-plparser-common",
              "version": "3.26.6-2"
            },
            {
              "name": "libtotem-plparser18",
              "version": "3.26.6-2"
            },
            {
              "name": "libtotem0",
              "version": "43.2-3"
            },
            {
              "name": "libtry-tiny-perl",
              "version": "0.32-1"
            },
            {
              "name": "libtsan2",
              "version": "14.2.0-19"
            },
            {
              "name": "libtss2-esys-3.0.2-0t64",
              "version": "4.1.3-1.2"
            },
            {
              "name": "libtss2-mu-4.0.1-0t64",
              "version": "4.1.3-1.2"
            },
            {
              "name": "libtss2-rc0t64",
              "version": "4.1.3-1.2"
            },
            {
              "name": "libtss2-sys1t64",
              "version": "4.1.3-1.2"
            },
            {
              "name": "libtss2-tcti-cmd0t64",
              "version": "4.1.3-1.2"
            },
            {
              "name": "libtss2-tcti-device0t64",
              "version": "4.1.3-1.2"
            },
            {
              "name": "libtss2-tcti-libtpms0t64",
              "version": "4.1.3-1.2"
            },
            {
              "name": "libtss2-tcti-mssim0t64",
              "version": "4.1.3-1.2"
            },
            {
              "name": "libtss2-tcti-spi-helper0t64",
              "version": "4.1.3-1.2"
            },
            {
              "name": "libtss2-tcti-swtpm0t64",
              "version": "4.1.3-1.2"
            },
            {
              "name": "libtss2-tctildr0t64",
              "version": "4.1.3-1.2"
            },
            {
              "name": "libtwolame0",
              "version": "0.4.0-2+b2"
            },
            {
              "name": "libtwolame0",
              "version": "0.4.0-2+b2"
            },
            {
              "name": "libubsan1",
              "version": "14.2.0-19"
            },
            {
              "name": "libuchardet0",
              "version": "0.0.8-1+b2"
            },
            {
              "name": "libudev1",
              "version": "257.8-1~deb13u2"
            },
            {
              "name": "libudev1",
              "version": "257.8-1~deb13u2"
            },
            {
              "name": "libudfread0",
              "version": "1.1.2-1+b2"
            },
            {
              "name": "libudisks2-0",
              "version": "2.10.1-12.1+deb13u1"
            },
            {
              "name": "libunbound8",
              "version": "1.22.0-2"
            },
            {
              "name": "libunibreak6",
              "version": "6.1-3"
            },
            {
              "name": "libunistring5",
              "version": "1.3-2"
            },
            {
              "name": "libunistring5",
              "version": "1.3-2"
            },
            {
              "name": "libunity-protocol-private0",
              "version": "7.1.4+19.04.20190319-6.1+b1"
            },
            {
              "name": "libunity-scopes-json-def-desktop",
              "version": "7.1.4+19.04.20190319-6.1"
            },
            {
              "name": "libunity9",
              "version": "7.1.4+19.04.20190319-6.1+b1"
            },
            {
              "name": "libuno-cppu3t64",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libuno-cppuhelpergcc3-3t64",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libuno-purpenvhelpergcc3-3t64",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libuno-sal3t64",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libuno-salhelpergcc3-3t64",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "libunwind8",
              "version": "1.8.1-0.1"
            },
            {
              "name": "libupnp17t64",
              "version": "1:1.14.20-1"
            },
            {
              "name": "libupower-glib3",
              "version": "1.90.9-1"
            },
            {
              "name": "liburcu8t64",
              "version": "0.15.2-2"
            },
            {
              "name": "liburi-perl",
              "version": "5.30-1"
            },
            {
              "name": "liburiparser1",
              "version": "0.9.8+dfsg-2"
            },
            {
              "name": "libusb-1.0-0",
              "version": "2:1.0.28-1"
            },
            {
              "name": "libusbmuxd-2.0-7",
              "version": "2.1.0-1+b1"
            },
            {
              "name": "libutempter0",
              "version": "1.2.1-4"
            },
            {
              "name": "libuuid1",
              "version": "2.41-5"
            },
            {
              "name": "libuv1t64",
              "version": "1.50.0-2"
            },
            {
              "name": "libv4l-0t64",
              "version": "1.30.1-1"
            },
            {
              "name": "libv4lconvert0t64",
              "version": "1.30.1-1"
            },
            {
              "name": "libva-drm2",
              "version": "2.22.0-3"
            },
            {
              "name": "libva-drm2",
              "version": "2.22.0-3"
            },
            {
              "name": "libva-glx2",
              "version": "2.22.0-3"
            },
            {
              "name": "libva-glx2",
              "version": "2.22.0-3"
            },
            {
              "name": "libva-wayland2",
              "version": "2.22.0-3"
            },
            {
              "name": "libva-x11-2",
              "version": "2.22.0-3"
            },
            {
              "name": "libva-x11-2",
              "version": "2.22.0-3"
            },
            {
              "name": "libva2",
              "version": "2.22.0-3"
            },
            {
              "name": "libva2",
              "version": "2.22.0-3"
            },
            {
              "name": "libvdpau-va-gl1",
              "version": "0.4.2-2"
            },
            {
              "name": "libvdpau-va-gl1",
              "version": "0.4.2-2"
            },
            {
              "name": "libvdpau1",
              "version": "1.5-3+b1"
            },
            {
              "name": "libvdpau1",
              "version": "1.5-3+b1"
            },
            {
              "name": "libvidstab1.1",
              "version": "1.1.0-2+b2"
            },
            {
              "name": "libvisual-0.4-0",
              "version": "0.4.2-2+b2"
            },
            {
              "name": "libvlc-bin",
              "version": "3.0.21-10"
            },
            {
              "name": "libvlc5",
              "version": "3.0.21-10"
            },
            {
              "name": "libvlccore9",
              "version": "3.0.21-10"
            },
            {
              "name": "libvncclient1",
              "version": "0.9.15+dfsg-1"
            },
            {
              "name": "libvo-aacenc0",
              "version": "0.1.3-3"
            },
            {
              "name": "libvo-amrwbenc0",
              "version": "0.1.3-2+b2"
            },
            {
              "name": "libvolume-key1",
              "version": "0.3.12-9"
            },
            {
              "name": "libvorbis0a",
              "version": "1.3.7-3"
            },
            {
              "name": "libvorbis0a",
              "version": "1.3.7-3"
            },
            {
              "name": "libvorbisenc2",
              "version": "1.3.7-3"
            },
            {
              "name": "libvorbisenc2",
              "version": "1.3.7-3"
            },
            {
              "name": "libvorbisfile3",
              "version": "1.3.7-3"
            },
            {
              "name": "libvpl2",
              "version": "1:2.14.0-1+b1"
            },
            {
              "name": "libvpx9",
              "version": "1.15.0-2.1"
            },
            {
              "name": "libvpx9",
              "version": "1.15.0-2.1"
            },
            {
              "name": "libvte-2.91-0",
              "version": "0.80.1-1"
            },
            {
              "name": "libvte-2.91-common",
              "version": "0.80.1-1"
            },
            {
              "name": "libvulkan1",
              "version": "1.4.309.0-1"
            },
            {
              "name": "libvulkan1",
              "version": "1.4.309.0-1"
            },
            {
              "name": "libwacom-common",
              "version": "2.14.0-1"
            },
            {
              "name": "libwacom9",
              "version": "2.14.0-1"
            },
            {
              "name": "libwavpack1",
              "version": "5.8.1-1"
            },
            {
              "name": "libwayland-client0",
              "version": "1.23.1-3"
            },
            {
              "name": "libwayland-client0",
              "version": "1.23.1-3"
            },
            {
              "name": "libwayland-cursor0",
              "version": "1.23.1-3"
            },
            {
              "name": "libwayland-egl1",
              "version": "1.23.1-3"
            },
            {
              "name": "libwayland-server0",
              "version": "1.23.1-3"
            },
            {
              "name": "libwayland-server0",
              "version": "1.23.1-3"
            },
            {
              "name": "libwbclient0",
              "version": "2:4.22.4+dfsg-1~deb13u1"
            },
            {
              "name": "libwebkit2gtk-4.1-0",
              "version": "2.50.1-1~deb13u1"
            },
            {
              "name": "libwebkitgtk-6.0-4",
              "version": "2.50.1-1~deb13u1"
            },
            {
              "name": "libwebp7",
              "version": "1.5.0-0.1"
            },
            {
              "name": "libwebp7",
              "version": "1.5.0-0.1"
            },
            {
              "name": "libwebpdemux2",
              "version": "1.5.0-0.1"
            },
            {
              "name": "libwebpmux3",
              "version": "1.5.0-0.1"
            },
            {
              "name": "libwebpmux3",
              "version": "1.5.0-0.1"
            },
            {
              "name": "libwebrtc-audio-processing-1-3",
              "version": "1.3-3+b1"
            },
            {
              "name": "libwildmidi2",
              "version": "0.4.3-1+b3"
            },
            {
              "name": "libwinpr3-3",
              "version": "3.15.0+dfsg-2.1"
            },
            {
              "name": "libwireplumber-0.5-0",
              "version": "0.5.8-2"
            },
            {
              "name": "libwmflite-0.2-7",
              "version": "0.2.13-1.1+b3"
            },
            {
              "name": "libwnck-3-0",
              "version": "43.2-1"
            },
            {
              "name": "libwnck-3-common",
              "version": "43.2-1"
            },
            {
              "name": "libwoff1",
              "version": "1.0.2-2+b2"
            },
            {
              "name": "libwpd-0.10-10",
              "version": "0.10.3-2+b2"
            },
            {
              "name": "libwpg-0.3-3",
              "version": "0.3.4-3+b2"
            },
            {
              "name": "libwps-0.4-4",
              "version": "0.4.14-2+b2"
            },
            {
              "name": "libwrap0",
              "version": "7.6.q-36"
            },
            {
              "name": "libwtmpdb0",
              "version": "0.73.0-3"
            },
            {
              "name": "libwww-perl",
              "version": "6.78-1"
            },
            {
              "name": "libwww-robotrules-perl",
              "version": "6.02-1"
            },
            {
              "name": "libx11-6",
              "version": "2:1.8.12-1"
            },
            {
              "name": "libx11-6",
              "version": "2:1.8.12-1"
            },
            {
              "name": "libx11-data",
              "version": "2:1.8.12-1"
            },
            {
              "name": "libx11-protocol-perl",
              "version": "0.56-9"
            },
            {
              "name": "libx11-xcb1",
              "version": "2:1.8.12-1"
            },
            {
              "name": "libx11-xcb1",
              "version": "2:1.8.12-1"
            },
            {
              "name": "libx264-164",
              "version": "2:0.164.3108+git31e19f9-2+b1"
            },
            {
              "name": "libx264-164",
              "version": "2:0.164.3108+git31e19f9-2+b1"
            },
            {
              "name": "libx265-215",
              "version": "4.1-2"
            },
            {
              "name": "libx265-215",
              "version": "4.1-2"
            },
            {
              "name": "libxatracker2",
              "version": "25.0.7-2"
            },
            {
              "name": "libxau6",
              "version": "1:1.0.11-1"
            },
            {
              "name": "libxau6",
              "version": "1:1.0.11-1"
            },
            {
              "name": "libxaw7",
              "version": "2:1.0.16-1"
            },
            {
              "name": "libxcb-composite0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-damage0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-dri2-0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-dri3-0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-dri3-0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-glx0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-glx0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-icccm4",
              "version": "0.4.2-1"
            },
            {
              "name": "libxcb-image0",
              "version": "0.4.0-2+b2"
            },
            {
              "name": "libxcb-keysyms1",
              "version": "0.4.1-1"
            },
            {
              "name": "libxcb-present0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-present0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-randr0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-randr0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-render-util0",
              "version": "0.3.10-1"
            },
            {
              "name": "libxcb-render0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-render0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-res0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-shape0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-shm0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-shm0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-sync1",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-sync1",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-util1",
              "version": "0.4.1-1"
            },
            {
              "name": "libxcb-xfixes0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-xfixes0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-xinerama0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-xinput0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-xkb1",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-xkb1",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb-xv0",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb1",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcb1",
              "version": "1.17.0-2+b1"
            },
            {
              "name": "libxcomposite1",
              "version": "1:0.4.6-1"
            },
            {
              "name": "libxcursor1",
              "version": "1:1.2.3-1"
            },
            {
              "name": "libxcvt0",
              "version": "0.1.3-1"
            },
            {
              "name": "libxdamage1",
              "version": "1:1.1.6-1+b2"
            },
            {
              "name": "libxdmcp6",
              "version": "1:1.1.5-1"
            },
            {
              "name": "libxdmcp6",
              "version": "1:1.1.5-1"
            },
            {
              "name": "libxdo3",
              "version": "1:3.20160805.1-5.1"
            },
            {
              "name": "libxext6",
              "version": "2:1.3.4-1+b3"
            },
            {
              "name": "libxext6",
              "version": "2:1.3.4-1+b3"
            },
            {
              "name": "libxfixes3",
              "version": "1:6.0.0-2+b4"
            },
            {
              "name": "libxfixes3",
              "version": "1:6.0.0-2+b4"
            },
            {
              "name": "libxfont2",
              "version": "1:2.0.6-1+b3"
            },
            {
              "name": "libxft2",
              "version": "2.3.6-1+b4"
            },
            {
              "name": "libxi6",
              "version": "2:1.8.2-1"
            },
            {
              "name": "libxinerama1",
              "version": "2:1.1.4-3+b4"
            },
            {
              "name": "libxinerama1",
              "version": "2:1.1.4-3+b4"
            },
            {
              "name": "libxkbcommon-x11-0",
              "version": "1.7.0-2"
            },
            {
              "name": "libxkbcommon-x11-0",
              "version": "1.7.0-2"
            },
            {
              "name": "libxkbcommon0",
              "version": "1.7.0-2"
            },
            {
              "name": "libxkbcommon0",
              "version": "1.7.0-2"
            },
            {
              "name": "libxkbfile1",
              "version": "1:1.1.0-1+b4"
            },
            {
              "name": "libxkbregistry0",
              "version": "1.7.0-2"
            },
            {
              "name": "libxml++2.6-2v5",
              "version": "2.42.3-2"
            },
            {
              "name": "libxml-parser-perl",
              "version": "2.47-1+b3"
            },
            {
              "name": "libxml-twig-perl",
              "version": "1:3.52-3"
            },
            {
              "name": "libxml-xpathengine-perl",
              "version": "0.14-2"
            },
            {
              "name": "libxml2-utils",
              "version": "2.12.7+dfsg+really2.9.14-2.1+deb13u1"
            },
            {
              "name": "libxml2",
              "version": "2.12.7+dfsg+really2.9.14-2.1+deb13u1"
            },
            {
              "name": "libxml2",
              "version": "2.12.7+dfsg+really2.9.14-2.1+deb13u1"
            },
            {
              "name": "libxmlb2",
              "version": "0.3.22-1"
            },
            {
              "name": "libxmlsec1t64-nss",
              "version": "1.2.41-1+b1"
            },
            {
              "name": "libxmlsec1t64",
              "version": "1.2.41-1+b1"
            },
            {
              "name": "libxmu6",
              "version": "2:1.1.3-3+b4"
            },
            {
              "name": "libxmuu1",
              "version": "2:1.1.3-3+b4"
            },
            {
              "name": "libxnnpack0.20241108",
              "version": "0.0~git20241108.4ea82e5-2"
            },
            {
              "name": "libxnvctrl0",
              "version": "535.171.04-1+b2"
            },
            {
              "name": "libxpm4",
              "version": "1:3.5.17-1+b3"
            },
            {
              "name": "libxrandr2",
              "version": "2:1.5.4-1+b3"
            },
            {
              "name": "libxrender1",
              "version": "1:0.9.12-1"
            },
            {
              "name": "libxrender1",
              "version": "1:0.9.12-1"
            },
            {
              "name": "libxres1",
              "version": "2:1.2.1-1+b2"
            },
            {
              "name": "libxshmfence1",
              "version": "1.3.3-1"
            },
            {
              "name": "libxshmfence1",
              "version": "1.3.3-1"
            },
            {
              "name": "libxslt1.1",
              "version": "1.1.35-1.2+deb13u2"
            },
            {
              "name": "libxss1",
              "version": "1:1.2.3-1+b3"
            },
            {
              "name": "libxss1",
              "version": "1:1.2.3-1+b3"
            },
            {
              "name": "libxt6t64",
              "version": "1:1.2.1-1.2+b2"
            },
            {
              "name": "libxtables12",
              "version": "1.8.11-2"
            },
            {
              "name": "libxtst6",
              "version": "2:1.2.5-1"
            },
            {
              "name": "libxv1",
              "version": "2:1.0.11-1.1+b3"
            },
            {
              "name": "libxvidcore4",
              "version": "2:1.3.7-1+b2"
            },
            {
              "name": "libxvidcore4",
              "version": "2:1.3.7-1+b2"
            },
            {
              "name": "libxvmc1",
              "version": "2:1.0.12-2+b3"
            },
            {
              "name": "libxxf86dga1",
              "version": "2:1.1.5-1+b3"
            },
            {
              "name": "libxxf86vm1",
              "version": "1:1.1.4-1+b4"
            },
            {
              "name": "libxxf86vm1",
              "version": "1:1.1.4-1+b4"
            },
            {
              "name": "libxxhash0",
              "version": "0.8.3-2"
            },
            {
              "name": "libyajl2",
              "version": "2.1.0-5+b2"
            },
            {
              "name": "libyaml-0-2",
              "version": "0.2.5-2"
            },
            {
              "name": "libyelp0",
              "version": "42.2-4"
            },
            {
              "name": "libytnef0",
              "version": "2.1.2-1+b2"
            },
            {
              "name": "libyuv0",
              "version": "0.0.1904.20250204-1"
            },
            {
              "name": "libz3-4",
              "version": "4.13.3-1"
            },
            {
              "name": "libz3-4",
              "version": "4.13.3-1"
            },
            {
              "name": "libzbar0t64",
              "version": "0.23.93-8"
            },
            {
              "name": "libzimg2",
              "version": "3.0.5+ds1-1+b2"
            },
            {
              "name": "libzix-0-0",
              "version": "0.6.2-1"
            },
            {
              "name": "libzmq5",
              "version": "4.3.5-1+b3"
            },
            {
              "name": "libzstd1",
              "version": "1.5.7+dfsg-1"
            },
            {
              "name": "libzstd1",
              "version": "1.5.7+dfsg-1"
            },
            {
              "name": "libzvbi-common",
              "version": "0.2.44-1"
            },
            {
              "name": "libzvbi0t64",
              "version": "0.2.44-1"
            },
            {
              "name": "libzvbi0t64",
              "version": "0.2.44-1"
            },
            {
              "name": "libzxcvbn0",
              "version": "2.5+dfsg-2+b2"
            },
            {
              "name": "libzxing3",
              "version": "2.3.0-4"
            },
            {
              "name": "linux-base",
              "version": "4.12"
            },
            {
              "name": "linux-image-6.12.43+deb13-amd64",
              "version": "6.12.43-1"
            },
            {
              "name": "linux-image-6.12.48+deb13-amd64",
              "version": "6.12.48-1"
            },
            {
              "name": "linux-image-amd64",
              "version": "6.12.48-1"
            },
            {
              "name": "linux-libc-dev",
              "version": "6.12.48-1"
            },
            {
              "name": "linux-sysctl-defaults",
              "version": "4.12"
            },
            {
              "name": "locales-all",
              "version": "2.41-12"
            },
            {
              "name": "locales",
              "version": "2.41-12"
            },
            {
              "name": "login.defs",
              "version": "1:4.17.4-2"
            },
            {
              "name": "login",
              "version": "1:4.16.0-2+really2.41-5"
            },
            {
              "name": "logrotate",
              "version": "3.22.0-1"
            },
            {
              "name": "logsave",
              "version": "1.47.2-3+b3"
            },
            {
              "name": "loupe",
              "version": "48.1-3"
            },
            {
              "name": "low-memory-monitor",
              "version": "2.1-2+b1"
            },
            {
              "name": "lsb-release",
              "version": "12.1-1"
            },
            {
              "name": "lsof",
              "version": "4.99.4+dfsg-2"
            },
            {
              "name": "luit",
              "version": "2.0.20240910-1"
            },
            {
              "name": "lynx-common",
              "version": "2.9.2-1"
            },
            {
              "name": "lynx",
              "version": "2.9.2-1"
            },
            {
              "name": "mailcap",
              "version": "3.74"
            },
            {
              "name": "make",
              "version": "4.4.1-2"
            },
            {
              "name": "man-db",
              "version": "2.13.1-1"
            },
            {
              "name": "manpages-dev",
              "version": "6.9.1-1"
            },
            {
              "name": "manpages",
              "version": "6.9.1-1"
            },
            {
              "name": "mawk",
              "version": "1.3.4.20250131-1"
            },
            {
              "name": "media-types",
              "version": "13.0.0"
            },
            {
              "name": "mesa-libgallium",
              "version": "25.0.7-2"
            },
            {
              "name": "mesa-libgallium",
              "version": "25.0.7-2"
            },
            {
              "name": "mesa-va-drivers",
              "version": "25.0.7-2"
            },
            {
              "name": "mesa-va-drivers",
              "version": "25.0.7-2"
            },
            {
              "name": "mesa-vdpau-drivers",
              "version": "25.0.7-2"
            },
            {
              "name": "mesa-vdpau-drivers",
              "version": "25.0.7-2"
            },
            {
              "name": "mesa-vulkan-drivers",
              "version": "25.0.7-2"
            },
            {
              "name": "mesa-vulkan-drivers",
              "version": "25.0.7-2"
            },
            {
              "name": "micro",
              "version": "2.0.14-1+b6"
            },
            {
              "name": "mobile-broadband-provider-info",
              "version": "20250613-2"
            },
            {
              "name": "modemmanager",
              "version": "1.24.0-1+deb13u1"
            },
            {
              "name": "mount",
              "version": "2.41-5"
            },
            {
              "name": "mutter-common-bin",
              "version": "48.4-2"
            },
            {
              "name": "mutter-common",
              "version": "48.4-2"
            },
            {
              "name": "mythes-en-us",
              "version": "1:25.2.3-1"
            },
            {
              "name": "nano",
              "version": "8.4-1"
            },
            {
              "name": "nautilus-data",
              "version": "48.3-2"
            },
            {
              "name": "nautilus-extension-gnome-terminal",
              "version": "3.56.2-2"
            },
            {
              "name": "nautilus",
              "version": "48.3-2"
            },
            {
              "name": "ncurses-base",
              "version": "6.5+20250216-2"
            },
            {
              "name": "ncurses-bin",
              "version": "6.5+20250216-2"
            },
            {
              "name": "ncurses-term",
              "version": "6.5+20250216-2"
            },
            {
              "name": "netbase",
              "version": "6.5"
            },
            {
              "name": "netcat-traditional",
              "version": "1.10-50"
            },
            {
              "name": "netpbm",
              "version": "2:11.10.02-1"
            },
            {
              "name": "network-manager-l10n",
              "version": "1.52.1-1"
            },
            {
              "name": "network-manager",
              "version": "1.52.1-1"
            },
            {
              "name": "nftables",
              "version": "1.1.3-1"
            },
            {
              "name": "nm-connection-editor",
              "version": "1.36.0-3+b1"
            },
            {
              "name": "node-clipboard",
              "version": "2.0.11+ds+~cs9.6.11-1"
            },
            {
              "name": "node-normalize.css",
              "version": "8.0.1-5"
            },
            {
              "name": "node-prismjs",
              "version": "1.29.0+dfsg+~1.26.0-1"
            },
            {
              "name": "nordvpn-gui",
              "version": "4.2.2"
            },
            {
              "name": "nordvpn",
              "version": "4.2.2"
            },
            {
              "name": "ntfs-3g",
              "version": "1:2022.10.3-5"
            },
            {
              "name": "ocl-icd-libopencl1",
              "version": "2.3.3-1"
            },
            {
              "name": "ocl-icd-libopencl1",
              "version": "2.3.3-1"
            },
            {
              "name": "openssh-client",
              "version": "1:10.0p1-7"
            },
            {
              "name": "openssl-provider-legacy",
              "version": "3.5.1-1+deb13u1"
            },
            {
              "name": "openssl",
              "version": "3.5.1-1+deb13u1"
            },
            {
              "name": "orca",
              "version": "48.1-1+deb13u1"
            },
            {
              "name": "os-prober",
              "version": "1.83"
            },
            {
              "name": "osinfo-db",
              "version": "0.20250606-1"
            },
            {
              "name": "p11-kit-modules",
              "version": "0.25.5-3"
            },
            {
              "name": "p11-kit",
              "version": "0.25.5-3"
            },
            {
              "name": "packagekit-tools",
              "version": "1.3.1-1"
            },
            {
              "name": "packagekit",
              "version": "1.3.1-1"
            },
            {
              "name": "parted",
              "version": "3.6-5"
            },
            {
              "name": "passwd",
              "version": "1:4.17.4-2"
            },
            {
              "name": "patch",
              "version": "2.8-2"
            },
            {
              "name": "pci.ids",
              "version": "0.0~2025.06.09-1"
            },
            {
              "name": "pciutils",
              "version": "1:3.13.0-2"
            },
            {
              "name": "perl-base",
              "version": "5.40.1-6"
            },
            {
              "name": "perl-modules-5.40",
              "version": "5.40.1-6"
            },
            {
              "name": "perl-openssl-defaults",
              "version": "7+b2"
            },
            {
              "name": "perl-tk",
              "version": "1:804.036+dfsg1-5"
            },
            {
              "name": "perl",
              "version": "5.40.1-6"
            },
            {
              "name": "pinentry-curses",
              "version": "1.3.1-2"
            },
            {
              "name": "pinentry-gnome3",
              "version": "1.3.1-2"
            },
            {
              "name": "pipewire-alsa",
              "version": "1.4.2-1"
            },
            {
              "name": "pipewire-audio",
              "version": "1.4.2-1"
            },
            {
              "name": "pipewire-bin",
              "version": "1.4.2-1"
            },
            {
              "name": "pipewire-pulse",
              "version": "1.4.2-1"
            },
            {
              "name": "pipewire",
              "version": "1.4.2-1"
            },
            {
              "name": "pkexec",
              "version": "126-2"
            },
            {
              "name": "plymouth-label",
              "version": "24.004.60-5"
            },
            {
              "name": "plymouth",
              "version": "24.004.60-5"
            },
            {
              "name": "pocketsphinx-en-us",
              "version": "0.8+5prealpha+1-15"
            },
            {
              "name": "polkitd",
              "version": "126-2"
            },
            {
              "name": "poppler-data",
              "version": "0.4.12-1"
            },
            {
              "name": "poppler-utils",
              "version": "25.03.0-5"
            },
            {
              "name": "power-profiles-daemon",
              "version": "0.30-1.1"
            },
            {
              "name": "powertop",
              "version": "2.15-4"
            },
            {
              "name": "ppp",
              "version": "2.5.2-1+1"
            },
            {
              "name": "procps",
              "version": "2:4.0.4-9"
            },
            {
              "name": "psmisc",
              "version": "23.7-2"
            },
            {
              "name": "publicsuffix",
              "version": "20250328.1952-0.1"
            },
            {
              "name": "python-apt-common",
              "version": "3.0.0"
            },
            {
              "name": "python3-apt",
              "version": "3.0.0"
            },
            {
              "name": "python3-brlapi",
              "version": "6.7-3.1"
            },
            {
              "name": "python3-cairo",
              "version": "1.27.0-2"
            },
            {
              "name": "python3-certifi",
              "version": "2025.1.31+ds-1"
            },
            {
              "name": "python3-chardet",
              "version": "5.2.0+dfsg-2"
            },
            {
              "name": "python3-charset-normalizer",
              "version": "3.4.2-1"
            },
            {
              "name": "python3-cups",
              "version": "2.0.4-2+b2"
            },
            {
              "name": "python3-cupshelpers",
              "version": "1.5.18-4"
            },
            {
              "name": "python3-dbus",
              "version": "1.4.0-1"
            },
            {
              "name": "python3-debconf",
              "version": "1.5.91"
            },
            {
              "name": "python3-debian",
              "version": "1.0.1"
            },
            {
              "name": "python3-debianbts",
              "version": "4.1.1"
            },
            {
              "name": "python3-distro",
              "version": "1.9.0-1"
            },
            {
              "name": "python3-dnf",
              "version": "4.23.0-1"
            },
            {
              "name": "python3-gi-cairo",
              "version": "3.50.0-4+b1"
            },
            {
              "name": "python3-gi",
              "version": "3.50.0-4+b1"
            },
            {
              "name": "python3-gpg",
              "version": "1.24.2-3"
            },
            {
              "name": "python3-hawkey",
              "version": "0.74.0-1"
            },
            {
              "name": "python3-ibus-1.0",
              "version": "1.5.32-2"
            },
            {
              "name": "python3-idna",
              "version": "3.10-1"
            },
            {
              "name": "python3-levenshtein",
              "version": "0.27.1-2"
            },
            {
              "name": "python3-libcomps",
              "version": "0.1.21-1+b3"
            },
            {
              "name": "python3-libdnf",
              "version": "0.74.0-1"
            },
            {
              "name": "python3-louis",
              "version": "3.33.0-1"
            },
            {
              "name": "python3-minimal",
              "version": "3.13.5-1"
            },
            {
              "name": "python3-numpy-dev",
              "version": "1:2.2.4+ds-1"
            },
            {
              "name": "python3-numpy",
              "version": "1:2.2.4+ds-1"
            },
            {
              "name": "python3-packaging",
              "version": "25.0-1"
            },
            {
              "name": "python3-psutil",
              "version": "7.0.0-2"
            },
            {
              "name": "python3-pyasyncore",
              "version": "1.0.2-3"
            },
            {
              "name": "python3-pyinotify",
              "version": "0.9.6-5"
            },
            {
              "name": "python3-pyqt5.sip",
              "version": "12.17.0-1+b1"
            },
            {
              "name": "python3-pyqt5",
              "version": "5.15.11+dfsg-2"
            },
            {
              "name": "python3-rapidfuzz",
              "version": "3.12.2+ds-1"
            },
            {
              "name": "python3-reportbug",
              "version": "13.2.0"
            },
            {
              "name": "python3-requests",
              "version": "2.32.3+dfsg-5"
            },
            {
              "name": "python3-rpm",
              "version": "4.20.1+dfsg-3"
            },
            {
              "name": "python3-setproctitle",
              "version": "1.3.6-2"
            },
            {
              "name": "python3-smbc",
              "version": "1.0.25.1-1+b4"
            },
            {
              "name": "python3-socks",
              "version": "1.7.1+dfsg-1"
            },
            {
              "name": "python3-speechd",
              "version": "0.12.0-5"
            },
            {
              "name": "python3-unbound",
              "version": "1.22.0-2"
            },
            {
              "name": "python3-uno",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "python3-urllib3",
              "version": "2.3.0-3"
            },
            {
              "name": "python3-websocket",
              "version": "1.8.0-2"
            },
            {
              "name": "python3-xdg",
              "version": "0.28-2"
            },
            {
              "name": "python3.13-minimal",
              "version": "3.13.5-2"
            },
            {
              "name": "python3.13",
              "version": "3.13.5-2"
            },
            {
              "name": "python3",
              "version": "3.13.5-1"
            },
            {
              "name": "qt5-gtk-platformtheme",
              "version": "5.15.15+dfsg-6"
            },
            {
              "name": "qttranslations5-l10n",
              "version": "5.15.15-2"
            },
            {
              "name": "qtwayland5",
              "version": "5.15.15-3"
            },
            {
              "name": "readline-common",
              "version": "8.2-6"
            },
            {
              "name": "realmd",
              "version": "0.17.1-3+b2"
            },
            {
              "name": "reportbug",
              "version": "13.2.0"
            },
            {
              "name": "ripgrep",
              "version": "14.1.1-1+b4"
            },
            {
              "name": "rpcsvc-proto",
              "version": "1.4.3-1"
            },
            {
              "name": "rpm-common",
              "version": "4.20.1+dfsg-3"
            },
            {
              "name": "rtkit",
              "version": "0.13-5.1"
            },
            {
              "name": "runit-helper",
              "version": "2.16.4"
            },
            {
              "name": "rygel-playbin",
              "version": "0.44.2-1"
            },
            {
              "name": "rygel-tracker",
              "version": "0.44.2-1"
            },
            {
              "name": "rygel",
              "version": "0.44.2-1"
            },
            {
              "name": "samba-libs",
              "version": "2:4.22.4+dfsg-1~deb13u1"
            },
            {
              "name": "sane-airscan",
              "version": "0.99.35-1"
            },
            {
              "name": "sane-utils",
              "version": "1.3.1-3+b1"
            },
            {
              "name": "seahorse",
              "version": "47.0.1-2"
            },
            {
              "name": "sed",
              "version": "4.9-2"
            },
            {
              "name": "sensible-utils",
              "version": "0.0.25"
            },
            {
              "name": "sgml-base",
              "version": "1.31+nmu1"
            },
            {
              "name": "sgml-data",
              "version": "2.0.11+nmu1"
            },
            {
              "name": "shared-mime-info",
              "version": "2.4-5+b2"
            },
            {
              "name": "shotwell-common",
              "version": "0.32.10-1"
            },
            {
              "name": "shotwell",
              "version": "0.32.10-1"
            },
            {
              "name": "sound-icons",
              "version": "0.1-8"
            },
            {
              "name": "sound-theme-freedesktop",
              "version": "0.8-6~deb13u1"
            },
            {
              "name": "speech-dispatcher-audio-plugins",
              "version": "0.12.0-5"
            },
            {
              "name": "speech-dispatcher-espeak-ng",
              "version": "0.12.0-5"
            },
            {
              "name": "speech-dispatcher",
              "version": "0.12.0-5"
            },
            {
              "name": "sqlite3",
              "version": "3.46.1-7"
            },
            {
              "name": "sqv",
              "version": "1.3.0-3"
            },
            {
              "name": "ssl-cert",
              "version": "1.1.3"
            },
            {
              "name": "steam-launcher",
              "version": "1:1.0.0.85"
            },
            {
              "name": "steam-libs-amd64",
              "version": "1:1.0.0.85"
            },
            {
              "name": "steam-libs-i386",
              "version": "1:1.0.0.85"
            },
            {
              "name": "steam-libs",
              "version": "1:1.0.0.83~ds-3"
            },
            {
              "name": "sudo",
              "version": "1.9.16p2-3"
            },
            {
              "name": "switcheroo-control",
              "version": "2.6-3"
            },
            {
              "name": "system-config-printer-common",
              "version": "1.5.18-4"
            },
            {
              "name": "system-config-printer-udev",
              "version": "1.5.18-4"
            },
            {
              "name": "system-config-printer",
              "version": "1.5.18-4"
            },
            {
              "name": "systemd-sysv",
              "version": "257.8-1~deb13u2"
            },
            {
              "name": "systemd-timesyncd",
              "version": "257.8-1~deb13u2"
            },
            {
              "name": "systemd",
              "version": "257.8-1~deb13u2"
            },
            {
              "name": "sysvinit-utils",
              "version": "3.14-4"
            },
            {
              "name": "tabby-terminal",
              "version": "1.0.228"
            },
            {
              "name": "tar",
              "version": "1.35+dfsg-3.1"
            },
            {
              "name": "task-desktop",
              "version": "3.81"
            },
            {
              "name": "task-english",
              "version": "3.81"
            },
            {
              "name": "task-laptop",
              "version": "3.81"
            },
            {
              "name": "tasksel-data",
              "version": "3.81"
            },
            {
              "name": "tasksel",
              "version": "3.81"
            },
            {
              "name": "tecla",
              "version": "48.0.2-1"
            },
            {
              "name": "tigerbeetle",
              "version": "0.16.64-1+trixie"
            },
            {
              "name": "timgm6mb-soundfont",
              "version": "1.3-5"
            },
            {
              "name": "tinysparql",
              "version": "3.8.2-7"
            },
            {
              "name": "tor-geoipdb",
              "version": "0.4.8.16-1"
            },
            {
              "name": "tor",
              "version": "0.4.8.16-1"
            },
            {
              "name": "torbrowser-launcher",
              "version": "0.3.7-3"
            },
            {
              "name": "torsocks",
              "version": "2.5.0-1"
            },
            {
              "name": "totem-common",
              "version": "43.2-3"
            },
            {
              "name": "totem-plugins",
              "version": "43.2-3"
            },
            {
              "name": "totem",
              "version": "43.2-3"
            },
            {
              "name": "tpm-udev",
              "version": "0.6+nmu1"
            },
            {
              "name": "traceroute",
              "version": "1:2.1.6-1"
            },
            {
              "name": "tracker-extract",
              "version": "3.8.2-4+b1"
            },
            {
              "name": "tzdata",
              "version": "2025b-4+deb13u1"
            },
            {
              "name": "ucf",
              "version": "3.0052"
            },
            {
              "name": "udev",
              "version": "257.8-1~deb13u2"
            },
            {
              "name": "udisks2",
              "version": "2.10.1-12.1+deb13u1"
            },
            {
              "name": "ulauncher",
              "version": "5.15.8"
            },
            {
              "name": "uno-libs-private",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "unzip",
              "version": "6.0-29"
            },
            {
              "name": "update-inetd",
              "version": "4.53"
            },
            {
              "name": "upower",
              "version": "1.90.9-1"
            },
            {
              "name": "ure",
              "version": "4:25.2.3-2+deb13u2"
            },
            {
              "name": "usb-modeswitch-data",
              "version": "20191128-7"
            },
            {
              "name": "usb-modeswitch",
              "version": "2.6.1-4+b2"
            },
            {
              "name": "usb.ids",
              "version": "2025.07.26-1"
            },
            {
              "name": "usbmuxd",
              "version": "1.1.1-6"
            },
            {
              "name": "usbutils",
              "version": "1:018-2"
            },
            {
              "name": "user-session-migration",
              "version": "0.4.3+nmu1"
            },
            {
              "name": "util-linux-extra",
              "version": "2.41-5"
            },
            {
              "name": "util-linux-locales",
              "version": "2.41-5"
            },
            {
              "name": "util-linux",
              "version": "2.41-5"
            },
            {
              "name": "uv",
              "version": "0.9.9-1+trixie"
            },
            {
              "name": "va-driver-all",
              "version": "2.22.0-3"
            },
            {
              "name": "va-driver-all",
              "version": "2.22.0-3"
            },
            {
              "name": "vdpau-driver-all",
              "version": "1.5-3+b1"
            },
            {
              "name": "vdpau-driver-all",
              "version": "1.5-3+b1"
            },
            {
              "name": "vim-common",
              "version": "2:9.1.1230-2"
            },
            {
              "name": "vim-tiny",
              "version": "2:9.1.1230-2"
            },
            {
              "name": "vlc-bin",
              "version": "3.0.21-10"
            },
            {
              "name": "vlc-data",
              "version": "3.0.21-10"
            },
            {
              "name": "vlc-l10n",
              "version": "3.0.21-10"
            },
            {
              "name": "vlc-plugin-access-extra",
              "version": "3.0.21-10"
            },
            {
              "name": "vlc-plugin-base",
              "version": "3.0.21-10"
            },
            {
              "name": "vlc-plugin-notify",
              "version": "3.0.21-10"
            },
            {
              "name": "vlc-plugin-qt",
              "version": "3.0.21-10"
            },
            {
              "name": "vlc-plugin-samba",
              "version": "3.0.21-10"
            },
            {
              "name": "vlc-plugin-skins2",
              "version": "3.0.21-10"
            },
            {
              "name": "vlc-plugin-video-output",
              "version": "3.0.21-10"
            },
            {
              "name": "vlc-plugin-video-splitter",
              "version": "3.0.21-10"
            },
            {
              "name": "vlc-plugin-visualization",
              "version": "3.0.21-10"
            },
            {
              "name": "vlc",
              "version": "3.0.21-10"
            },
            {
              "name": "wamerican",
              "version": "2020.12.07-4"
            },
            {
              "name": "webp-pixbuf-loader",
              "version": "0.2.7-1+b1"
            },
            {
              "name": "wget",
              "version": "1.25.0-2"
            },
            {
              "name": "whiptail",
              "version": "0.52.25-1"
            },
            {
              "name": "windsurf",
              "version": "1.12.32-1763085475"
            },
            {
              "name": "wireless-regdb",
              "version": "2025.07.10-1"
            },
            {
              "name": "wireless-tools",
              "version": "30~pre9-18+b1"
            },
            {
              "name": "wireplumber",
              "version": "0.5.8-2"
            },
            {
              "name": "wmctrl",
              "version": "1.07+git20240228.1105759-1"
            },
            {
              "name": "wpasupplicant",
              "version": "2:2.10-24"
            },
            {
              "name": "wtmpdb",
              "version": "0.73.0-3"
            },
            {
              "name": "x11-apps",
              "version": "7.7+11+b1"
            },
            {
              "name": "x11-common",
              "version": "1:7.7+24"
            },
            {
              "name": "x11-session-utils",
              "version": "7.7+6+b1"
            },
            {
              "name": "x11-utils",
              "version": "7.7+7"
            },
            {
              "name": "x11-xkb-utils",
              "version": "7.7+9"
            },
            {
              "name": "x11-xserver-utils",
              "version": "7.7+11"
            },
            {
              "name": "xauth",
              "version": "1:1.1.2-1.1"
            },
            {
              "name": "xbitmaps",
              "version": "1.1.1-2.2"
            },
            {
              "name": "xbrlapi",
              "version": "6.7-3.1"
            },
            {
              "name": "xclip",
              "version": "0.13-4"
            },
            {
              "name": "xcvt",
              "version": "0.1.3-1"
            },
            {
              "name": "xdg-dbus-proxy",
              "version": "0.1.6-1"
            },
            {
              "name": "xdg-desktop-portal-gnome",
              "version": "48.0-2"
            },
            {
              "name": "xdg-desktop-portal-gtk",
              "version": "1.15.3-1"
            },
            {
              "name": "xdg-desktop-portal",
              "version": "1.20.3+ds-1"
            },
            {
              "name": "xdg-user-dirs-gtk",
              "version": "0.14-1"
            },
            {
              "name": "xdg-user-dirs",
              "version": "0.18-2"
            },
            {
              "name": "xdg-utils",
              "version": "1.2.1-2"
            },
            {
              "name": "xdotool",
              "version": "1:3.20160805.1-5.1"
            },
            {
              "name": "xfonts-100dpi",
              "version": "1:1.0.5"
            },
            {
              "name": "xfonts-75dpi",
              "version": "1:1.0.5"
            },
            {
              "name": "xfonts-base",
              "version": "1:1.0.5+nmu1"
            },
            {
              "name": "xfonts-encodings",
              "version": "1:1.0.4-2.2"
            },
            {
              "name": "xfonts-scalable",
              "version": "1:1.0.3-1.3"
            },
            {
              "name": "xfonts-utils",
              "version": "1:7.7+7"
            },
            {
              "name": "xinit",
              "version": "1.4.2-1"
            },
            {
              "name": "xkb-data",
              "version": "2.42-1"
            },
            {
              "name": "xkbset",
              "version": "0.8-1"
            },
            {
              "name": "xml-core",
              "version": "0.19"
            },
            {
              "name": "xorg-docs-core",
              "version": "1:1.7.3-1"
            },
            {
              "name": "xorg",
              "version": "1:7.7+24"
            },
            {
              "name": "xserver-common",
              "version": "2:21.1.16-1.3+deb13u1"
            },
            {
              "name": "xserver-xephyr",
              "version": "2:21.1.16-1.3+deb13u1"
            },
            {
              "name": "xserver-xorg-core",
              "version": "2:21.1.16-1.3+deb13u1"
            },
            {
              "name": "xserver-xorg-input-all",
              "version": "1:7.7+24"
            },
            {
              "name": "xserver-xorg-input-libinput",
              "version": "1.5.0-1"
            },
            {
              "name": "xserver-xorg-input-wacom",
              "version": "1.2.3-1"
            },
            {
              "name": "xserver-xorg-legacy",
              "version": "2:21.1.16-1.3+deb13u1"
            },
            {
              "name": "xserver-xorg-video-all",
              "version": "1:7.7+24"
            },
            {
              "name": "xserver-xorg-video-amdgpu",
              "version": "23.0.0-1"
            },
            {
              "name": "xserver-xorg-video-ati",
              "version": "1:22.0.0-1"
            },
            {
              "name": "xserver-xorg-video-fbdev",
              "version": "1:0.5.0-2"
            },
            {
              "name": "xserver-xorg-video-intel",
              "version": "2:2.99.917+git20210115-1"
            },
            {
              "name": "xserver-xorg-video-nouveau",
              "version": "1:1.0.18-1"
            },
            {
              "name": "xserver-xorg-video-qxl",
              "version": "0.1.6-1.1"
            },
            {
              "name": "xserver-xorg-video-radeon",
              "version": "1:22.0.0-1"
            },
            {
              "name": "xserver-xorg-video-vesa",
              "version": "1:2.6.0-2"
            },
            {
              "name": "xserver-xorg-video-vmware",
              "version": "1:13.4.0-1"
            },
            {
              "name": "xserver-xorg",
              "version": "1:7.7+24"
            },
            {
              "name": "xsltproc",
              "version": "1.1.35-1.2+deb13u2"
            },
            {
              "name": "xterm",
              "version": "398-1"
            },
            {
              "name": "xwayland",
              "version": "2:24.1.6-1"
            },
            {
              "name": "xz-utils",
              "version": "5.8.1-1"
            },
            {
              "name": "yazi",
              "version": "25.5.31-2+trixie"
            },
            {
              "name": "yelp-xsl",
              "version": "42.1-4"
            },
            {
              "name": "yelp",
              "version": "42.2-4"
            },
            {
              "name": "zenity-common",
              "version": "4.1.90-1"
            },
            {
              "name": "zenity",
              "version": "4.1.90-1"
            },
            {
              "name": "zig-0",
              "version": "0.15.2-1+trixie"
            },
            {
              "name": "zig",
              "version": "0.15.2-1+trixie"
            },
            {
              "name": "zlib1g",
              "version": "1:1.3.dfsg+really1.3.1-1+b1"
            },
            {
              "name": "zlib1g",
              "version": "1:1.3.dfsg+really1.3.1-1+b1"
            },
            {
              "name": "zoxide",
              "version": "0.9.8-1+trixie"
            },
            {
              "name": "zsh-common",
              "version": "5.9-8"
            },
            {
              "name": "zsh",
              "version": "5.9-8+b14"
            },
            {
              "name": "zstd",
              "version": "1.5.7+dfsg-1"
            }
          ],
          "exportedAt": "2025-11-18T08:35:02.950Z",
          "command": "dpkg --get-selections > apt-packages.txt",
          "restoreCommand": "sudo dpkg --set-selections < apt-packages.txt && sudo apt-get dselect-upgrade",
          "exportPath": "apt-packages.txt"
        },
        {
          "type": "dnf",
          "enabled": true,
          "packages": [],
          "exportedAt": "2025-11-18T08:35:03.166Z",
          "command": "dnf list installed > dnf-packages.txt",
          "exportPath": "dnf-packages.txt"
        },
        {
          "type": "npm",
          "enabled": true,
          "packages": [
            {
              "name": "@anthropic-ai/claude-code",
              "version": "2.0.42"
            },
            {
              "name": "corepack",
              "version": "0.34.2"
            },
            {
              "name": "npm",
              "version": "11.6.2"
            }
          ],
          "exportedAt": "2025-11-18T08:35:03.635Z",
          "command": "npm list -g --depth=0 --json > npm-global.json",
          "exportPath": "npm-global.json"
        },
        {
          "type": "pnpm",
          "enabled": true,
          "packages": [
            {
              "name": "@anthropic-ai/claude-code",
              "version": "2.0.33"
            },
            {
              "name": "vercel",
              "version": "48.8.2"
            }
          ],
          "exportedAt": "2025-11-18T08:35:03.898Z",
          "command": "pnpm list -g --depth=0 --json > pnpm-global.json",
          "exportPath": "pnpm-global.json"
        }
      ]
    }
  },
  "applications": {
    "enabled": false,
    "applications": {}
  },
  "extensions": {
    "enabled": true,
    "editors": {
      "macos": [
        {
          "editor": "vscode",
          "enabled": true,
          "configPath": "~/Library/Application Support/Code/User",
          "extensions": [
            {
              "id": "1yib.rust-bundle",
              "version": "1.0.0",
              "publisher": "1yib",
              "name": "rust-bundle",
              "enabled": true
            },
            {
              "id": "aaron-bond.better-comments",
              "version": "3.0.2",
              "publisher": "aaron-bond",
              "name": "better-comments",
              "enabled": true
            },
            {
              "id": "anthropic.claude-code",
              "version": "2.0.42",
              "publisher": "anthropic",
              "name": "claude-code",
              "enabled": true
            },
            {
              "id": "bradlc.vscode-tailwindcss",
              "version": "0.14.29",
              "publisher": "bradlc",
              "name": "vscode-tailwindcss",
              "enabled": true
            },
            {
              "id": "dbaeumer.vscode-eslint",
              "version": "3.0.16",
              "publisher": "dbaeumer",
              "name": "vscode-eslint",
              "enabled": true
            },
            {
              "id": "eamodio.gitlens",
              "version": "17.7.1",
              "publisher": "eamodio",
              "name": "gitlens",
              "enabled": true
            },
            {
              "id": "esbenp.prettier-vscode",
              "version": "11.0.0",
              "publisher": "esbenp",
              "name": "prettier-vscode",
              "enabled": true
            },
            {
              "id": "github.codespaces",
              "version": "1.18.0",
              "publisher": "github",
              "name": "codespaces",
              "enabled": true
            },
            {
              "id": "github.copilot",
              "version": "1.388.0",
              "publisher": "github",
              "name": "copilot",
              "enabled": true
            },
            {
              "id": "github.copilot-chat",
              "version": "0.33.1",
              "publisher": "github",
              "name": "copilot-chat",
              "enabled": true
            },
            {
              "id": "golang.go",
              "version": "0.50.0",
              "publisher": "golang",
              "name": "go",
              "enabled": true
            },
            {
              "id": "johnpapa.winteriscoming",
              "version": "1.4.4",
              "publisher": "johnpapa",
              "name": "winteriscoming",
              "enabled": true
            },
            {
              "id": "mariusalchimavicius.json-to-ts",
              "version": "1.8.0",
              "publisher": "mariusalchimavicius",
              "name": "json-to-ts",
              "enabled": true
            },
            {
              "id": "meganrogge.template-string-converter",
              "version": "0.6.1",
              "publisher": "meganrogge",
              "name": "template-string-converter",
              "enabled": true
            },
            {
              "id": "ms-playwright.playwright",
              "version": "1.1.16",
              "publisher": "ms-playwright",
              "name": "playwright",
              "enabled": true
            },
            {
              "id": "ms-python.black-formatter",
              "version": "2025.2.0",
              "publisher": "ms-python",
              "name": "black-formatter",
              "enabled": true
            },
            {
              "id": "ms-python.python",
              "version": "2025.18.0",
              "publisher": "ms-python",
              "name": "python",
              "enabled": true
            },
            {
              "id": "ms-vsliveshare.vsliveshare",
              "version": "1.0.5959",
              "publisher": "ms-vsliveshare",
              "name": "vsliveshare",
              "enabled": true
            },
            {
              "id": "qwtel.sqlite-viewer",
              "version": "0.10.6",
              "publisher": "qwtel",
              "name": "sqlite-viewer",
              "enabled": true
            },
            {
              "id": "ritwickdey.liveserver",
              "version": "5.7.9",
              "publisher": "ritwickdey",
              "name": "liveserver",
              "enabled": true
            },
            {
              "id": "rust-lang.rust-analyzer",
              "version": "0.3.2683",
              "publisher": "rust-lang",
              "name": "rust-analyzer",
              "enabled": true
            },
            {
              "id": "shd101wyy.markdown-preview-enhanced",
              "version": "0.8.20",
              "publisher": "shd101wyy",
              "name": "markdown-preview-enhanced",
              "enabled": true
            },
            {
              "id": "simonsiefke.svg-preview",
              "version": "2.8.3",
              "publisher": "simonsiefke",
              "name": "svg-preview",
              "enabled": true
            },
            {
              "id": "tal7aouy.icons",
              "version": "3.8.0",
              "publisher": "tal7aouy",
              "name": "icons",
              "enabled": true
            },
            {
              "id": "tomoki1207.pdf",
              "version": "1.2.2",
              "publisher": "tomoki1207",
              "name": "pdf",
              "enabled": true
            },
            {
              "id": "vscode-icons-team.vscode-icons",
              "version": "12.15.0",
              "publisher": "vscode-icons-team",
              "name": "vscode-icons",
              "enabled": true
            },
            {
              "id": "vue.volar",
              "version": "3.1.4",
              "publisher": "vue",
              "name": "volar",
              "enabled": true
            },
            {
              "id": "yoavbls.pretty-ts-errors",
              "version": "0.6.1",
              "publisher": "yoavbls",
              "name": "pretty-ts-errors",
              "enabled": true
            }
          ],
          "exportedAt": "2025-11-19T01:22:15.754Z",
          "exportPath": ".config/vscode-extensions.json",
          "keybindingsPath": "macos/.config/keybindings.json",
          "keybindingsBackedUp": true,
          "settingsBackedUp": false,
          "snippetsPath": "macos/.config/snippets",
          "snippetsBackedUp": true
        },
        {
          "editor": "vscode-insiders",
          "enabled": true,
          "configPath": "~/Library/Application Support/Code - Insiders/User",
          "extensions": [
            {
              "id": "aaron-bond.better-comments",
              "version": "3.0.2",
              "publisher": "aaron-bond",
              "name": "better-comments",
              "enabled": true
            },
            {
              "id": "bradlc.vscode-tailwindcss",
              "version": "0.12.16",
              "publisher": "bradlc",
              "name": "vscode-tailwindcss",
              "enabled": true
            },
            {
              "id": "christian-kohler.npm-intellisense",
              "version": "1.4.5",
              "publisher": "christian-kohler",
              "name": "npm-intellisense",
              "enabled": true
            },
            {
              "id": "christian-kohler.path-intellisense",
              "version": "2.10.0",
              "publisher": "christian-kohler",
              "name": "path-intellisense",
              "enabled": true
            },
            {
              "id": "eamodio.gitlens",
              "version": "16.0.5",
              "publisher": "eamodio",
              "name": "gitlens",
              "enabled": true
            },
            {
              "id": "esbenp.prettier-vscode",
              "version": "11.0.0",
              "publisher": "esbenp",
              "name": "prettier-vscode",
              "enabled": true
            },
            {
              "id": "formulahendry.auto-rename-tag",
              "version": "0.1.10",
              "publisher": "formulahendry",
              "name": "auto-rename-tag",
              "enabled": true
            },
            {
              "id": "frigus02.vscode-sql-tagged-template-literals",
              "version": "0.0.19",
              "publisher": "frigus02",
              "name": "vscode-sql-tagged-template-literals",
              "enabled": true
            },
            {
              "id": "frigus02.vscode-sql-tagged-template-literals-syntax-only",
              "version": "0.0.19",
              "publisher": "frigus02",
              "name": "vscode-sql-tagged-template-literals-syntax-only",
              "enabled": true
            },
            {
              "id": "github.copilot",
              "version": "1.253.0",
              "publisher": "github",
              "name": "copilot",
              "enabled": true
            },
            {
              "id": "github.copilot-chat",
              "version": "0.23.2",
              "publisher": "github",
              "name": "copilot-chat",
              "enabled": true
            },
            {
              "id": "golang.go",
              "version": "0.44.0",
              "publisher": "golang",
              "name": "go",
              "enabled": true
            },
            {
              "id": "gruntfuggly.todo-tree",
              "version": "0.0.226",
              "publisher": "gruntfuggly",
              "name": "todo-tree",
              "enabled": true
            },
            {
              "id": "johnpapa.winteriscoming",
              "version": "1.4.4",
              "publisher": "johnpapa",
              "name": "winteriscoming",
              "enabled": true
            },
            {
              "id": "mariusalchimavicius.json-to-ts",
              "version": "1.8.0",
              "publisher": "mariusalchimavicius",
              "name": "json-to-ts",
              "enabled": true
            },
            {
              "id": "meganrogge.template-string-converter",
              "version": "0.6.1",
              "publisher": "meganrogge",
              "name": "template-string-converter",
              "enabled": true
            },
            {
              "id": "mikestead.dotenv",
              "version": "1.0.1",
              "publisher": "mikestead",
              "name": "dotenv",
              "enabled": true
            },
            {
              "id": "ms-azuretools.vscode-docker",
              "version": "1.29.3",
              "publisher": "ms-azuretools",
              "name": "vscode-docker",
              "enabled": true
            },
            {
              "id": "ms-dotnettools.csdevkit",
              "version": "1.14.14",
              "publisher": "ms-dotnettools",
              "name": "csdevkit",
              "enabled": true
            },
            {
              "id": "ms-dotnettools.csharp",
              "version": "2.39.29",
              "publisher": "ms-dotnettools",
              "name": "csharp",
              "enabled": true
            },
            {
              "id": "ms-dotnettools.vscode-dotnet-runtime",
              "version": "2.2.3",
              "publisher": "ms-dotnettools",
              "name": "vscode-dotnet-runtime",
              "enabled": true
            },
            {
              "id": "ms-dotnettools.vscodeintellicode-csharp",
              "version": "2.1.11",
              "publisher": "ms-dotnettools",
              "name": "vscodeintellicode-csharp",
              "enabled": true
            },
            {
              "id": "ms-python.debugpy",
              "version": "2024.14.0",
              "publisher": "ms-python",
              "name": "debugpy",
              "enabled": true
            },
            {
              "id": "ms-python.isort",
              "version": "2023.10.1",
              "publisher": "ms-python",
              "name": "isort",
              "enabled": true
            },
            {
              "id": "ms-python.python",
              "version": "2024.22.0",
              "publisher": "ms-python",
              "name": "python",
              "enabled": true
            },
            {
              "id": "ms-python.vscode-pylance",
              "version": "2024.12.1",
              "publisher": "ms-python",
              "name": "vscode-pylance",
              "enabled": true
            },
            {
              "id": "ms-toolsai.jupyter",
              "version": "2024.11.0",
              "publisher": "ms-toolsai",
              "name": "jupyter",
              "enabled": true
            },
            {
              "id": "ms-toolsai.jupyter-keymap",
              "version": "1.1.2",
              "publisher": "ms-toolsai",
              "name": "jupyter-keymap",
              "enabled": true
            },
            {
              "id": "ms-toolsai.jupyter-renderers",
              "version": "1.0.21",
              "publisher": "ms-toolsai",
              "name": "jupyter-renderers",
              "enabled": true
            },
            {
              "id": "ms-toolsai.vscode-jupyter-cell-tags",
              "version": "0.1.9",
              "publisher": "ms-toolsai",
              "name": "vscode-jupyter-cell-tags",
              "enabled": true
            },
            {
              "id": "ms-toolsai.vscode-jupyter-slideshow",
              "version": "0.1.6",
              "publisher": "ms-toolsai",
              "name": "vscode-jupyter-slideshow",
              "enabled": true
            },
            {
              "id": "ms-vscode-remote.remote-containers",
              "version": "0.395.0",
              "publisher": "ms-vscode-remote",
              "name": "remote-containers",
              "enabled": true
            },
            {
              "id": "ms-vscode.cmake-tools",
              "version": "1.19.52",
              "publisher": "ms-vscode",
              "name": "cmake-tools",
              "enabled": true
            },
            {
              "id": "ms-vscode.cpptools",
              "version": "1.22.11",
              "publisher": "ms-vscode",
              "name": "cpptools",
              "enabled": true
            },
            {
              "id": "ms-vscode.cpptools-extension-pack",
              "version": "1.3.0",
              "publisher": "ms-vscode",
              "name": "cpptools-extension-pack",
              "enabled": true
            },
            {
              "id": "ms-vscode.cpptools-themes",
              "version": "2.0.0",
              "publisher": "ms-vscode",
              "name": "cpptools-themes",
              "enabled": true
            },
            {
              "id": "pmndrs.pmndrs",
              "version": "0.3.7",
              "publisher": "pmndrs",
              "name": "pmndrs",
              "enabled": true
            },
            {
              "id": "rust-lang.rust-analyzer",
              "version": "0.3.2220",
              "publisher": "rust-lang",
              "name": "rust-analyzer",
              "enabled": true
            },
            {
              "id": "sdras.vue-vscode-snippets",
              "version": "3.2.0",
              "publisher": "sdras",
              "name": "vue-vscode-snippets",
              "enabled": true
            },
            {
              "id": "tal7aouy.icons",
              "version": "3.8.0",
              "publisher": "tal7aouy",
              "name": "icons",
              "enabled": true
            },
            {
              "id": "thiscodeworks.savecode",
              "version": "0.1.4",
              "publisher": "thiscodeworks",
              "name": "savecode",
              "enabled": true
            },
            {
              "id": "twxs.cmake",
              "version": "0.0.17",
              "publisher": "twxs",
              "name": "cmake",
              "enabled": true
            },
            {
              "id": "visualstudiotoolsforunity.vstuc",
              "version": "1.0.5",
              "publisher": "visualstudiotoolsforunity",
              "name": "vstuc",
              "enabled": true
            },
            {
              "id": "vscode-icons-team.vscode-icons",
              "version": "12.10.0",
              "publisher": "vscode-icons-team",
              "name": "vscode-icons",
              "enabled": true
            },
            {
              "id": "vue.volar",
              "version": "2.1.10",
              "publisher": "vue",
              "name": "volar",
              "enabled": true
            },
            {
              "id": "wakatime.vscode-wakatime",
              "version": "24.9.2",
              "publisher": "wakatime",
              "name": "vscode-wakatime",
              "enabled": true
            }
          ],
          "exportedAt": "2025-11-19T01:22:16.107Z",
          "exportPath": ".config/vscode-insiders-extensions.json",
          "keybindingsBackedUp": false,
          "settingsPath": "macos/.config/settings.json",
          "settingsBackedUp": true,
          "snippetsPath": "macos/.config/snippets",
          "snippetsBackedUp": true
        },
        {
          "editor": "windsurf",
          "enabled": true,
          "configPath": "~/Library/Application Support/Windsurf/User",
          "extensions": [
            {
              "id": "aaron-bond.better-comments",
              "version": "3.0.2",
              "publisher": "aaron-bond",
              "name": "better-comments",
              "enabled": true
            },
            {
              "id": "anthropic.claude-code",
              "version": "2.0.45",
              "publisher": "anthropic",
              "name": "claude-code",
              "enabled": true
            },
            {
              "id": "bradlc.vscode-tailwindcss",
              "version": "0.14.28",
              "publisher": "bradlc",
              "name": "vscode-tailwindcss",
              "enabled": true
            },
            {
              "id": "codeium.windsurfpyright",
              "version": "1.29.5",
              "publisher": "codeium",
              "name": "windsurfpyright",
              "enabled": true
            },
            {
              "id": "coderabbit.coderabbit-vscode",
              "version": "0.15.2",
              "publisher": "coderabbit",
              "name": "coderabbit-vscode",
              "enabled": true
            },
            {
              "id": "dbaeumer.vscode-eslint",
              "version": "3.0.16",
              "publisher": "dbaeumer",
              "name": "vscode-eslint",
              "enabled": true
            },
            {
              "id": "eamodio.gitlens",
              "version": "17.7.1",
              "publisher": "eamodio",
              "name": "gitlens",
              "enabled": true
            },
            {
              "id": "esbenp.prettier-vscode",
              "version": "11.0.0",
              "publisher": "esbenp",
              "name": "prettier-vscode",
              "enabled": true
            },
            {
              "id": "firsttris.vscode-jest-runner",
              "version": "0.4.84",
              "publisher": "firsttris",
              "name": "vscode-jest-runner",
              "enabled": true
            },
            {
              "id": "github.vscode-github-actions",
              "version": "0.28.0",
              "publisher": "github",
              "name": "vscode-github-actions",
              "enabled": true
            },
            {
              "id": "golang.go",
              "version": "0.50.0",
              "publisher": "golang",
              "name": "go",
              "enabled": true
            },
            {
              "id": "humao.rest-client",
              "version": "0.26.0",
              "publisher": "humao",
              "name": "rest-client",
              "enabled": true
            },
            {
              "id": "johnpapa.winteriscoming",
              "version": "1.4.4",
              "publisher": "johnpapa",
              "name": "winteriscoming",
              "enabled": true
            },
            {
              "id": "mechatroner.rainbow-csv",
              "version": "3.3.0",
              "publisher": "mechatroner",
              "name": "rainbow-csv",
              "enabled": true
            },
            {
              "id": "meganrogge.template-string-converter",
              "version": "0.6.1",
              "publisher": "meganrogge",
              "name": "template-string-converter",
              "enabled": true
            },
            {
              "id": "ms-playwright.playwright",
              "version": "1.1.15",
              "publisher": "ms-playwright",
              "name": "playwright",
              "enabled": true
            },
            {
              "id": "ms-python.black-formatter",
              "version": "2025.2.0",
              "publisher": "ms-python",
              "name": "black-formatter",
              "enabled": true
            },
            {
              "id": "ms-python.debugpy",
              "version": "2025.14.1",
              "publisher": "ms-python",
              "name": "debugpy",
              "enabled": true
            },
            {
              "id": "ms-python.mypy-type-checker",
              "version": "2025.2.0",
              "publisher": "ms-python",
              "name": "mypy-type-checker",
              "enabled": true
            },
            {
              "id": "ms-python.python",
              "version": "2025.16.0",
              "publisher": "ms-python",
              "name": "python",
              "enabled": true
            },
            {
              "id": "ms-python.vscode-python-envs",
              "version": "1.10.0",
              "publisher": "ms-python",
              "name": "vscode-python-envs",
              "enabled": true
            },
            {
              "id": "ritwickdey.liveserver",
              "version": "5.7.9",
              "publisher": "ritwickdey",
              "name": "liveserver",
              "enabled": true
            },
            {
              "id": "vitest.explorer",
              "version": "1.32.1",
              "publisher": "vitest",
              "name": "explorer",
              "enabled": true
            },
            {
              "id": "vscode-icons-team.vscode-icons",
              "version": "12.15.0",
              "publisher": "vscode-icons-team",
              "name": "vscode-icons",
              "enabled": true
            },
            {
              "id": "vue.volar",
              "version": "3.1.4",
              "publisher": "vue",
              "name": "volar",
              "enabled": true
            },
            {
              "id": "yoavbls.pretty-ts-errors",
              "version": "0.6.3",
              "publisher": "yoavbls",
              "name": "pretty-ts-errors",
              "enabled": true
            }
          ],
          "exportedAt": "2025-11-19T01:22:16.322Z",
          "exportPath": ".config/windsurf-extensions.json",
          "keybindingsPath": "macos/.config/keybindings.json",
          "keybindingsBackedUp": true,
          "settingsPath": "macos/.config/settings.json",
          "settingsBackedUp": true,
          "snippetsPath": "macos/.config/snippets",
          "snippetsBackedUp": true
        }
      ],
      "debian": [
        {
          "editor": "vscode",
          "enabled": true,
          "configPath": "~/.config/Code/User",
          "extensions": [
            {
              "id": "1yib.rust-bundle",
              "version": "1.0.0",
              "publisher": "1yib",
              "name": "rust-bundle",
              "enabled": true
            },
            {
              "id": "aaron-bond.better-comments",
              "version": "3.0.2",
              "publisher": "aaron-bond",
              "name": "better-comments",
              "enabled": true
            },
            {
              "id": "anthropic.claude-code",
              "version": "2.0.43",
              "publisher": "anthropic",
              "name": "claude-code",
              "enabled": true
            },
            {
              "id": "bradlc.vscode-tailwindcss",
              "version": "0.14.29",
              "publisher": "bradlc",
              "name": "vscode-tailwindcss",
              "enabled": true
            },
            {
              "id": "dbaeumer.vscode-eslint",
              "version": "3.0.16",
              "publisher": "dbaeumer",
              "name": "vscode-eslint",
              "enabled": true
            },
            {
              "id": "eamodio.gitlens",
              "version": "17.7.1",
              "publisher": "eamodio",
              "name": "gitlens",
              "enabled": true
            },
            {
              "id": "esbenp.prettier-vscode",
              "version": "11.0.0",
              "publisher": "esbenp",
              "name": "prettier-vscode",
              "enabled": true
            },
            {
              "id": "github.codespaces",
              "version": "1.18.0",
              "publisher": "github",
              "name": "codespaces",
              "enabled": true
            },
            {
              "id": "github.copilot",
              "version": "1.388.0",
              "publisher": "github",
              "name": "copilot",
              "enabled": true
            },
            {
              "id": "github.copilot-chat",
              "version": "0.32.5",
              "publisher": "github",
              "name": "copilot-chat",
              "enabled": true
            },
            {
              "id": "golang.go",
              "version": "0.50.0",
              "publisher": "golang",
              "name": "go",
              "enabled": true
            },
            {
              "id": "johnpapa.winteriscoming",
              "version": "1.4.4",
              "publisher": "johnpapa",
              "name": "winteriscoming",
              "enabled": true
            },
            {
              "id": "mariusalchimavicius.json-to-ts",
              "version": "1.8.0",
              "publisher": "mariusalchimavicius",
              "name": "json-to-ts",
              "enabled": true
            },
            {
              "id": "meganrogge.template-string-converter",
              "version": "0.6.1",
              "publisher": "meganrogge",
              "name": "template-string-converter",
              "enabled": true
            },
            {
              "id": "ms-playwright.playwright",
              "version": "1.1.16",
              "publisher": "ms-playwright",
              "name": "playwright",
              "enabled": true
            },
            {
              "id": "ms-python.black-formatter",
              "version": "2025.2.0",
              "publisher": "ms-python",
              "name": "black-formatter",
              "enabled": true
            },
            {
              "id": "ms-python.python",
              "version": "2025.18.0",
              "publisher": "ms-python",
              "name": "python",
              "enabled": true
            },
            {
              "id": "ms-vsliveshare.vsliveshare",
              "version": "1.0.5959",
              "publisher": "ms-vsliveshare",
              "name": "vsliveshare",
              "enabled": true
            },
            {
              "id": "qwtel.sqlite-viewer",
              "version": "0.10.6",
              "publisher": "qwtel",
              "name": "sqlite-viewer",
              "enabled": true
            },
            {
              "id": "ritwickdey.liveserver",
              "version": "5.7.9",
              "publisher": "ritwickdey",
              "name": "liveserver",
              "enabled": true
            },
            {
              "id": "rust-lang.rust-analyzer",
              "version": "0.3.2683",
              "publisher": "rust-lang",
              "name": "rust-analyzer",
              "enabled": true
            },
            {
              "id": "shd101wyy.markdown-preview-enhanced",
              "version": "0.8.20",
              "publisher": "shd101wyy",
              "name": "markdown-preview-enhanced",
              "enabled": true
            },
            {
              "id": "simonsiefke.svg-preview",
              "version": "2.8.3",
              "publisher": "simonsiefke",
              "name": "svg-preview",
              "enabled": true
            },
            {
              "id": "tal7aouy.icons",
              "version": "3.8.0",
              "publisher": "tal7aouy",
              "name": "icons",
              "enabled": true
            },
            {
              "id": "tomoki1207.pdf",
              "version": "1.2.2",
              "publisher": "tomoki1207",
              "name": "pdf",
              "enabled": true
            },
            {
              "id": "vscode-icons-team.vscode-icons",
              "version": "12.15.0",
              "publisher": "vscode-icons-team",
              "name": "vscode-icons",
              "enabled": true
            },
            {
              "id": "vue.volar",
              "version": "3.1.4",
              "publisher": "vue",
              "name": "volar",
              "enabled": true
            },
            {
              "id": "yoavbls.pretty-ts-errors",
              "version": "0.6.1",
              "publisher": "yoavbls",
              "name": "pretty-ts-errors",
              "enabled": true
            }
          ],
          "exportedAt": "2025-11-18T08:35:06.304Z",
          "exportPath": "debian/.config/vscode-extensions.json",
          "keybindingsPath": "debian/.config/keybindings.json",
          "keybindingsBackedUp": true,
          "settingsPath": "debian/.config/settings.json",
          "settingsBackedUp": true,
          "snippetsPath": "debian/.config/snippets",
          "snippetsBackedUp": true
        },
        {
          "editor": "windsurf",
          "enabled": true,
          "configPath": "~/.config/Windsurf/User",
          "extensions": [],
          "exportedAt": "2025-11-18T08:35:06.666Z",
          "exportPath": "debian/.config/windsurf-extensions.json",
          "keybindingsBackedUp": false,
          "settingsPath": "debian/.config/settings.json",
          "settingsBackedUp": true,
          "snippetsPath": "debian/.config/snippets",
          "snippetsBackedUp": true
        }
      ]
    }
  },
  "services": {
    "enabled": false,
    "services": {}
  },
  "settings": {
    "enabled": false,
    "settings": {}
  },
  "runtimes": {
    "enabled": true,
    "runtimes": {
      "macos": [
        {
          "type": "node",
          "manager": "fnm",
          "versions": ["22.21.1", "24.11.1"],
          "defaultVersion": "24.11.1",
          "installCommand": "fnm install 24.11.1 && fnm default 24.11.1",
          "exportedAt": "2025-11-19T01:22:16.341Z"
        },
        {
          "type": "python",
          "manager": "system",
          "versions": ["3.14.0"],
          "defaultVersion": "3.14.0",
          "exportedAt": "2025-11-19T01:22:16.362Z"
        },
        {
          "type": "ruby",
          "manager": "system",
          "versions": ["2.6.10"],
          "defaultVersion": "2.6.10",
          "exportedAt": "2025-11-19T01:22:16.382Z"
        },
        {
          "type": "go",
          "manager": "system",
          "versions": ["1.19.3"],
          "defaultVersion": "1.19.3",
          "exportedAt": "2025-11-19T01:22:16.404Z"
        },
        {
          "type": "rust",
          "manager": "rustup",
          "versions": ["1.75.0"],
          "defaultVersion": "1.75.0",
          "exportedAt": "2025-11-19T01:22:16.517Z"
        },
        {
          "type": "deno",
          "manager": "system",
          "versions": ["1.45.2"],
          "defaultVersion": "1.45.2",
          "exportedAt": "2025-11-19T01:22:16.570Z"
        }
      ],
      "debian": [
        {
          "type": "node",
          "manager": "fnm",
          "versions": ["24.11.1"],
          "defaultVersion": "24.11.1",
          "installCommand": "fnm install 24.11.1 && fnm default 24.11.1",
          "exportedAt": "2025-11-18T08:35:06.684Z"
        },
        {
          "type": "python",
          "manager": "system",
          "versions": ["3.13.5"],
          "defaultVersion": "3.13.5",
          "exportedAt": "2025-11-18T08:35:06.710Z"
        }
      ]
    }
  },
  "system": {
    "primary": "macos",
    "shell": "zsh",
    "shellConfigFile": ".zshrc"
  },
  "metadata": {
    "createdAt": "2025-11-18T06:58:56.107Z",
    "updatedAt": "2025-11-19T01:22:25.655Z"
  }
}
```

## IMPORTANT:

Keep in mind the following:

The backup and restore scripts need to still have the same functionality as before, but with the new schema structure.

The tests must pass

The generated schema gets saved in the dotfiles repo which is a separate repo, but make sure it matches the new structure, or a structure HIGHLY similar to the new proposed structure in spirit

The schema should be saved in the dotfiles repo in the as `schema.json` in the root directory instead of `schema/backup-config.json`

The backup and restore scripts must also be updated to use the new schema structure and location accordingly
