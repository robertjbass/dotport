# Outline for Simplification Refactor

✅ COMPLETE

## Part 1 - User System File Structure

### Current File Structure (user's system)

#### The following is the current file structure on the user's filesystem:

```sh
~/.dev-machine-backup-restore # root folder located in user's home directory
├── 📄 backup-config.json
├── 📁 cache # seems to be empty currently
└── 📄 github-auth.json
```

#### `github-auth.json` contains the following structure, (this is an example)

```json
{
  "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "username": "robertjbass"
}
```

#### `backup-config.json` contains the following structure, (this is an example)

```json
{
  "os": "macOS",
  "configFiles": {
    "versionControl": true,
    "service": "github",
    "gitRepoUrl": "https://github.com/robertjbass/dotfiles.git",
    "repoExists": true,
    "repoName": "dotfiles",
    "repoVisibility": "private",
    "cloneLocation": "/Users/bob/dev/dotfiles",
    "multiOS": true,
    "supportedDistros": ["darwin"],
    "machineDistro": "darwin",
    "machineNickname": "macbook-air-m2"
  },
  "secrets": {
    "enabled": true,
    "storageType": "local-file",
    "details": {
      "localType": "Shell script with exports (e.g., .env.sh - export KEY=\"VALUE\" per line) [recommended]",
      "secretFileName": ".env.sh",
      "secretFileLocation": "~",
      "secretFileExists": "yes"
    }
  },
  "shell": "zsh"
}
```

### New File Structure (user's system)

#### Before changing the file structure...

- we need to create a constants file that will contain the values for the new file structure. We will also need to update the `script-session.ts` file to use the constants file for the new file structure.

We need to create the following a file: `/constants/index.ts`

with the following values:

```ts
// only export them as they are needed in scripts
const appName = 'DotPort' // this is subject to change based on user feedback or package availability
const appNameNormalized = appName.toLowerCase()
const systemRootFolderName = `.${appNameNormalized}`
const systemConfigFolderName = `${systemRootFolderName}/config`
const systemBackupsFolderName = `${systemRootFolderName}/backups`
const systemLogsFolderName = `${systemRootFolderName}/logs`
const systemTempFolderName = `${systemRootFolderName}/temp`
const appVersion = '1.0.0' // TODO - can we dynamically import/parse this from package.json?
```

When the script runs and the script session is initialized, we need the script session to have a timestamp for when the session started that will serve as a unique session ID that will be used to name folders denoted as <timestamp> in the new file structure when creating backups and logs

#### The new file structure for the user's system will be as follows:

```sh
~/.dotport  # root folder (name is the value of systemRootFolderName var)
├── 📁 config
│   ├── 📄 github-auth.json
│   └── 📄 user-system.json
├── 📁 backups
│   ├── 📁 generated-backups
│   └── 📁 destructed-files
│       └── 📄 log.json
├── 📁 logs
└── 📁 temp
```

#### Explanation:

**config**

- `~.<appNameNormalized>/config/`
  - folder used for config or cache files related to the current user's system and/or selections

- `~.<appNameNormalized>/config/user-system.json` **(example below)**
  - new version of the old `backup-config.json` file from before

- `~.<appNameNormalized>/config/github-auth.json` **(example above - same as old system)**
  - new version of the old `github-auth.json` file from before

**backups**

- `~.<appNameNormalized>/backups/generated-backups/<timestamp>/*`
  - folder used for when backups are created, this folder will be identical to the repo that we are creating for the user

- `~.<appNameNormalized>/backups/destructed-files/<timestamp>/*`
  - folder used for when files are deleted or overwritten to ensure that no important files are ever destroyed and lost. This folder will store the destructed files/folders but the `log.json` file in this folder will contain the metadata needed for restoration in the event of a mistake

- `~.<appNameNormalized>/backups/destructed-files/log.json` **(example below)**
  - log file used to store the full history and original locations of all destructed files/folders in the event that the user wants to restore them

**logs**

- `~.<appNameNormalized>/logs/`
  - folder used for when logs are created, this folder will store the logs for the user's system, especially for debugging. For now this folder will exist but not be used because logging is a todo reserved for a future date, however you should use this filestructure information to update the `TODOS.md` file

- `~.<appNameNormalized>/logs/<timestamp>.log` **(example below)**
  - A log file will log the console output of a session for historical records. We are not doing this now now because it is a todo reserved for a future date, however you should use this filestructure information to update the `TODOS.md` file

**temp**

- `~.<appNameNormalized>/temp/`
  - folder used for when temporary files/folders need to be created or git cloned before being moved to their final destination

##### Example Files:

~.<appNameNormalized>/config/user-system.json

- Currently the old `backup-config.json` file from before looks like this:

```json
{
  "os": "macOS",
  "configFiles": {
    "versionControl": true,
    "service": "github",
    "gitRepoUrl": "https://github.com/robertjbass/dotfiles.git",
    "repoExists": true,
    "repoName": "dotfiles",
    "repoVisibility": "private",
    "cloneLocation": "/Users/bob/dev/dotfiles",
    "multiOS": true,
    "supportedDistros": ["darwin"],
    "machineDistro": "darwin",
    "machineNickname": "macbook-air-m2"
  },
  "secrets": {
    "enabled": true,
    "storageType": "local-file",
    "details": {
      "localType": "Shell script with exports (e.g., .env.sh - export KEY=\"VALUE\" per line) [recommended]",
      "secretFileName": ".env.sh",
      "secretFileLocation": "~",
      "secretFileExists": "yes"
    }
  },
  "shell": "zsh"
}
```

We now use this format for the dotfiles repo's `schema.json` file (example):

```json
{
  "version": "1.0.0",
  "metadata": {
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "repo": {
    "repoType": "github",
    "repoName": "dotfiles",
    "repoUrl": "https://github.com/username/dotfiles",
    "repoOwner": "username",
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
    }
  ],
  "dotfiles": {
    "macos-darwin-macbook-air-m2": {
      "tracked-files": { ... },
      "secrets": { ... },
      "symlinks": { ... },
      "packages": { ... },
      "applications": { ... },
      "extensions": { ... },
      "services": { ... },
      "settings": { ... },
      "runtimes": { ... }
    }
  }
}
```

We will use a very similar format for the user's system's config file (example):

```json
{
  "version": "1.0.0",
  "metadata": {
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "repo": {
    "repoType": "github",
    "repoName": "dotfiles",
    "repoUrl": "https://github.com/username/dotfiles",
    "repoOwner": "username",
    "branch": "main",
    "visibility": "private"
  },
  //! Instead of using systems object, we will use a single system object
  // "systems": [
  //   {
  //     "os": "macos",
  //     "distro": "darwin",
  //     "nickname": "macbook-air-m2",
  //     "repoPath": "macos-darwin-macbook-air-m2",
  //     "shell": "zsh",
  //     "shellConfigFile": ".zshrc"
  //   }
  // ],
  "system": {
    "os": "macos",
    "distro": "darwin",
    "nickname": "macbook-air-m2",
    "repoPath": "macos-darwin-macbook-air-m2",
    "shell": "zsh",
    "shellConfigFile": ".zshrc",

    //* NEW
    // While we are in here, we should add a few more properties to the system object for both the user's system config file and the dotfiles repo's schema.json file
    "homeDirectory": "/Users/bob",
    "localRepoPath": "/Users/bob/dev/dotfiles",
    // The runtime data can now be accessed from the ScriptSessionClient
    //* NEW
    "runtimeData": {
      "node": {
        "packageManager": "pnpm",
        "versionManager": "fnm",
        "version": "24.11.1"
      }
    }
  }

  //! Remove Dotfiles Object From User System Config File
  //! Don't need this for the user's system config file
  // "dotfiles": {
  //   "macos-darwin-macbook-air-m2": {
  //     "tracked-files": { ... },
  //     "secrets": { ... },
  //     "symlinks": { ... },
  //     "packages": { ... },
  //     "applications": { ... },
  //     "extensions": { ... },
  //     "services": { ... },
  //     "settings": { ... },
  //     "runtimes": { ... }
  //   }
  // }
}
```

###### actual user-system.json (example)

```json
{
  "version": "1.0.0",
  "metadata": {
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "repo": {
    "repoType": "github",
    "repoName": "dotfiles",
    "repoUrl": "https://github.com/username/dotfiles",
    "repoOwner": "username",
    "branch": "main",
    "visibility": "private"
  },
  "system": {
    "os": "macos",
    "distro": "darwin",
    "nickname": "macbook-air-m2",
    "repoPath": "macos-darwin-macbook-air-m2",
    "shell": "zsh",
    "shellConfigFile": ".zshrc",
    "homeDirectory": "/Users/bob",
    "localRepoPath": "/Users/bob/dev/dotfiles",
    "runtimeData": {
      "node": {
        "packageManager": "pnpm",
        "versionManager": "fnm",
        "version": "24.11.1"
      }
    }
  }
}
```

This means that there can be some overlapping in the type system for the types that represent the dotfiles repo's schema.json file and the user's system's config file. We will need to be careful to not use the same type names for different purposes.

The runtime data in the user-system.json tells us about the environment they used to run the script in the first place. All of this data can be obtained from the ScriptSessionClient and the scripts (backup, restore, etc.) may need to be updated to populate this data.

---

# Part 2 - Update Current Flow

## Backup Script

### Step 1

Detect Operating System

### Current

It only detects the operating system and asks the user to confirm

#### Problem

It only detects the operating system, not the distro. If we are on macOS, we should detect the distro as "darwin". If on linux it needs a way to detect the distro

There is a missing step 2.5 to detect and confirm the current runtime/package manager and version manager which can be found in the ScriptSessionClient now

#### Solution

Step 1, 2, and 2,5 should all be combined into the the same step, step 1

##### Simplified

Step 1 should now detect the following:

- Operating System
- Distro
- Shell
- Home Directory
- Runtime
- Package Manager
- Version Manager
- Runtime Version

Much of this is in the ScriptSessionClient now, we just need to update the backup script to use it. The prompt should be like this:

```bash
Detected Operating System: macOS
Detected Distro: darwin
Detected Shell: zsh
Detected Home Directory: /Users/bob
Detected Runtime: node
Detected Package Manager: pnpm
Detected Version Manager: fnm
Detected Runtime Version: 24.11.1

Is this correct?
> Yes
- Update Operating System
- Update Distro
- Update Shell
- Update Home Directory
- Update Runtime
- Update Package Manager
- Update Version Manager
- Update Runtime Version
```

Later in step 3, we ask the for a nickname for this machine. We are instead going to move this to step 1 at the end of the step.

```bash
Please select a nickname for this system:
> # make the default nickname <my-{os}-environment>
```

---

## Step 2 (old)

Detect Shell

### Current

Detects the shell, asks the user to confirm it

#### Problem

This should now be part of step 1

#### Solution

Move to step 1 as described above

#### Simplified

This should now be part of step 1

---

## Step 2 (new)

Authenticate GitHub - now that the original step 2 has been moved to part of step 1, we will use step to in order to get them to authenticate with GitHub.

```bash
This application uses GitHub to store your config files in a private repository as well as for other advanced features in future steps. GitHub authentication is optional, but highly recommended.

# check if they have already provided a token in the following file:
~/.<normalized-app-name>/config/github-auth.json

# If it exists, we should check if it is valid and notify the user if it is not with a message like:
The GitHub token provided is not valid or expired. Please try again. # or use the actual error type to give them better insight into why it failed if you have it

# If it does not exist or if there is a problem, we should prompt the user to authenticate

In order to authenticate, you will need to provide your GitHub username and personal access token. You can generate a personal access token at this URL: https://github.com/settings/tokens/new

> Create a new token (open link in browser)
- Continue with only local backup (limited functionality)

```

## Step 3

Learn About Config File Storage

### Current

Do you store config files in version control?

#### Problem

The question is unclear, we want to find out if the user already backed up their config files with our system

#### Solution

There are 2 main scenarios with 8 total possible permutations of current states:

##### Scenario 1

1. The user HAS used our system to create backups
   ├── 1A — The user HAS COMMITTED our backup folder (with our schema) to a remote GitHub repository
   │ ├── 1Ai — The remote repository IS CURRENTLY CLONED on the user's local filesystem
   │ └── 1Aii — The remote repository IS NOT CURRENTLY CLONED on the user's local filesystem
   └── 1B — The user HAS NOT COMMITTED our backup folder (with our schema) to a remote GitHub repository
   ├── 1Bi — The local folder IS A GIT REPOSITORY
   └── 1Bii — The local folder IS NOT A GIT REPOSITORY

##### Scenario 2

2. The user HAS NOT used our system to create backups
   ├── 2A — The user HAS NO BACKUP FILES
   │ ├── 2Ai — The user wants to create a local backup AND commit it to GitHub as a remote repository
   │ └── 2Aii — The user wants to create a local backup AND NOT commit it to GitHub
   └── 2B — The user HAS BACKUP FILES that are NOT using our schema
   ├── 2Bi — The user wants to create a local backup AND commit it to GitHub as a remote repository
   └── 2Bii — The user wants to create a local backup AND NOT commit it to GitHub

## ✅ Scenario 1 — User has used our system before

### Core framing

They already have our backup folder.
The goal: locate their existing dotfiles repo and understand whether it’s local, remote, committed, and/or git-initialized.

---

### Scenario 1 Process (cleaned up)

#### (1Ai, 1Aii) — Backup is committed to GitHub

**Goal:** Help the user identify the local location of the repo (or clone it), and identify the branch to work on.

**Process:**

1. Ask for the path to their dotfiles repo (suggest `~/dev/dotfiles` as the default).
2. If it exists locally: continue.
3. If it doesn’t exist:
   - Ask if they want to clone the GitHub repo to the default location.
   - If yes: clone it there.
   - If no: ask for an alternative clone path.
4. Ask which branch they want to use for committing backups.
   (We will still confirm before committing anything later.)

---

#### (1Bi, 1Bii) — Backup folder exists locally but is not committed to GitHub

**Goal:** Determine whether the local folder is a git repo and whether the user wants to push it remotely.

**Process:**

1. Ask for the path to the local backup repository (suggest `~/dev/dotfiles`).
2. If the folder does not exist:
   - Ask if they want to create it at the default path or specify a new one.
3. If the folder exists:
   - Detect if it is a git repository.
     - If yes: ask if they want to connect it to a remote GitHub repository and push the initial commit.
       - If yes: ask which branch they want to use.
     - If no: ask if they want to initialize it as a git repository.
       - If yes: ask if they want to create a remote GitHub repo and push to it.
         - If yes: ask which branch they want to use.
4. Confirm that actual commits will occur at a later step.

---

## ✅ Scenario 2 — User has not used our system before

### Core framing

They haven't created backups with our system yet.
We need to:

- Create a local backup repo
- Let them choose whether they want a remote backup on GitHub
- For users with pre-existing non-schema backup files, guide them through scanning and migration

---

### Scenario 2 Process (cleaned up)

#### Intro (applies to all of Scenario 2)

Before branching, show this:

> “You haven’t used our backup system before.
> We’ll create a local backup repository.
> You’ll have the option to connect it to GitHub as a remote repository if you want.”

---

#### (2A) — User has no backup files

**Goal:** Create a new repository and optionally push it to GitHub.

**Process (2Ai, 2Aii):**

1. Ask for the desired path of the new dotfiles repo (default: `~/dev/dotfiles`).
2. If it doesn’t exist:
   - Ask if they want to create it there, or choose a different location.
3. Initialize it as a git repo.
4. Ask if they want to commit it to GitHub as a remote repository.
   - If yes: ask which branch they want to use.
5. Continue to file selection later.

_(2Ai = wants GitHub. 2Aii = does not.)_

---

#### (2B) — User has old backup files, but not in our schema

**Goal:** Migrate their old backup situation into our new system.

**Process (2Bi, 2Bii):**

1. Explain:
   > “This application will scan your system for configuration files.
   > You’ll have an opportunity to manually add additional files/folders later, including any files from your previous backup system.”
2. Ask for the desired path of the new dotfiles repo (default: `~/dev/dotfiles`).
3. If it doesn’t exist:
   - Ask if they want to create it there or choose a different location.
4. Initialize it as a git repo.
5. Ask if they want to commit it to GitHub as a remote repository.
   - If yes: ask which branch they want to use.
6. Proceed to scanning/migration.

_(2Bi = wants GitHub. 2Bii = does not.)_

**NOTE 1** If at any time, the user chooses an option that requires being connected to GitHub and they are not authenticated, we should notify them that they need to authenticate before proceeding and return them back to the authentication step.

**NOTE 2** We currently check for a repo named dotfiles by default. We should instead ask the user what the name of the repo is so

#### Simplified

This will make this step a lot less ambiguous and easier to understand.

- We are removing the option to select "Other Git Service" and instead just helping them connect to GitHub, or create a local folder that can be committed to a remote repository with a different service later.
- We are removing the question about first time backup files because we assertain this information through other means
- We no longer need to ask them for a nickname

---

## Step 4

Secret Management

### Current

#### Problem

This is very confusing and unclear

#### Solution

Ask the user if they have a file that contains environment variables or secrets. Tell them that this will not be committed to the dotfiles repo but we will provide options to encrypt it, or help restore them after a backup if they provide it. We can disregard all of the stuff about cloud services for now.

If a file is provided, we need to know which format is uses:

- .sh file with export MY_SECRET="my-secret"
- .env file with MY_SECRET="my-secret"

#### Simplified

The flow should be more like this:

1. Ask if they have a file that contains environment variables or secrets.
2. If yes: ask for the file path and name.
3. If no: ask them if they want to create one (default `~/.env.sh`) in which case we will create a file like this:

```bash
# ~/.env.sh
export MY_SECRET="my-secret"
```

and now we know the format as using exports 4. Ask if they want to encrypt it. 5. If yes: we will inform them that encryption isn't support in this version but will be in an upcoming release and then continue. 6. If no: continue.

---

## Step 5

Configuration Summary

### Current

asks user to confirm their choices, then is says:

? Your repository already exists. What would
you like to do?
❯ Add/update files in the repository
Skip file backup (repository is already
set up)

#### Problem

This is confusing, we should just say "continue" and then we can save the config info both in the `user-system.json` file and in the repository or whatever this step usually does but skip the prompt about it.

#### Solution

They just need to confirm the config info and continue

#### Simplified

No need to ask for permission to write to the repo or skip it. Just confirm the config info and continue.

---

## Step 6

### Current

This works well

#### Problem

#### Solution

Keep as is

#### Simplified

We can update the UI from this:

Select files to back up .bashrc (28B) -
~/.bashrc, .zshrc (3.5KB) - ~/.zshrc,
.zprofile (333B) - ~/.zprofile, .zshenv
(21B) - ~/.zshenv, .p10k.zsh (84.8KB) -
~/.p10k.zsh, .profile (21B) - ~/.profile,
.gitconfig (106B) - ~/.gitconfig, Git global
ignore (XDG) (31B) - ~/.config/git/ignore,
SSH config (548B) - ~/.ssh/config, VS Code
keybindings (macOS) (560B) -
~/Library/Application
Support/Code/User/keybindings.json, VS Code
snippets (macOS) (dir) -
~/Library/Application
Support/Code/User/snippets, Windsurf
settings (macOS) (3.7KB) -
~/Library/Application
Support/Windsurf/User/settings.json,
Windsurf keybindings (macOS) (720B) -
~/Library/Application
Support/Windsurf/User/keybindings.json,
Windsurf snippets (macOS) (dir) -
~/Library/Application
Support/Windsurf/User/snippets, Ghostty
config (dir) - ~/.config/ghostty

📋 Selected 15 file(s):
• .bashrc
• .zshrc
• .zprofile
• .zshenv
• .p10k.zsh
• .profile
• .gitconfig
• Git global ignore (XDG)
• SSH config
• VS Code keybindings (macOS)
• VS Code snippets (macOS)
• Windsurf settings (macOS)
• Windsurf keybindings (macOS)
• Windsurf snippets (macOS)
• Ghostty config

to this:

Select files to back up (15 files)

📋 Selected:
• .bashrc
• .zshrc
• .zprofile
• .zshenv
• .p10k.zsh
• .profile
• .gitconfig
• Git global ignore (XDG)
• SSH config
• VS Code keybindings (macOS)
• VS Code snippets (macOS)
• Windsurf settings (macOS)
• Windsurf keybindings (macOS)
• Windsurf snippets (macOS)
• Ghostty config

# and keep this:

? Add more files manually?
❯ No, continue with the currently selected
files only
Yes, add more files manually

---

## Step 7

Detect Packages

### Current

Step 7 is perfect but consider that we now have the node version manager in the session and/or config info

#### Problem

#### Solution

#### Simplified

---

## Step 8

Preview

### Current

Almost perfect

#### Problem

Slightly unclear when it says "Proceed with backing up these files"

#### Solution

Change to "Backup these files to <local repo path>"

#### Simplified

## Better language

## Step 9

Push to GitHub

### Current

Nearly perfect

#### Problem

It says this:

┌──────────────────────────────────────┐
│ Step 9 of 9: Git Commit & Push │
│ Progress: ████████████████████ 100% │
└──────────────────────────────────────┘

? Would you like to commit and push the
changes to your dotfiles repository?
❯ No, I will do it manually later
Yes, commit and push now

#### Solution

There should be 3 possibilities here:

1 - GitHub is integrated - keep as is

--
2 - Local repo is created but not connected to GitHub ,
Change Step 9 of 9: Git Commit & Push to "Stage Commits"

change the options to:

> No, I will do it manually later

- Stage Commits

--
3 - Local folder is not a git repo and user is not integrated with GH
Change Step 9 of 9: Git Commit & Push to "Backup Complete"

Just notify the user, don't prompt them

#### Simplified

---

## BUGS

Fix this:

┌──────────────────────────────────────┐
│ Step 10 of 9: Create Symlinks │
│ Progress: ██████████████████████ 111% │
└──────────────────────────────────────┘

Symlinks allow files to be stored in your dotfiles repository
while still being accessible from their expected locations.
If you are unsure, select no.

? Would you like to create symlinks for your
backed up files?
❯ No, I will create them manually later
Yes, let me select which files to symlink

---

# Updated - This

---

# DotPort Interactive Backup Simplification Plan

## Executive Summary

This document proposes a comprehensive simplification of the DotPort interactive backup process. The current implementation has grown to **2,930 lines** in `scripts/backup.ts` with 9+ steps (actually displays "Step 10 of 9" due to a bug), complex nested prompts, and ambiguous user flows.

**Key Goals:**

1. **Reduce complexity**: Consolidate the 9+ step process into 6 clear steps
2. **Improve user experience**: Remove ambiguous questions and confusing branching logic
3. **Standardize data structures**: Align local config with repository schema format
4. **Streamline file structure**: Reorganize `~/.dev-machine-backup-restore/` into logical folders
5. **Leverage existing data**: Use `ScriptSession` runtime detection capabilities

**Expected Outcomes:**

- 40-50% reduction in backup script lines of code
- Clearer user journey with less cognitive load
- Consistent data structures between local config and repo schema
- Better separation of concerns (config, backups, temp files, logs)

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Proposed System Architecture](#proposed-system-architecture)
3. [Step-by-Step Simplification](#step-by-step-simplification)
4. [Data Structure Changes](#data-structure-changes)
5. [Implementation Plan](#implementation-plan)
6. [Migration Strategy](#migration-strategy)
7. [Testing & Validation](#testing--validation)

---

## Current State Analysis

### Current Backup Flow (9+ Steps)

| Step | Title                      | Issues                                                           |
| ---- | -------------------------- | ---------------------------------------------------------------- |
| 1    | Operating System Detection | Only detects OS, not distro; requires confirmation               |
| 2    | Default Shell Detection    | Should be combined with Step 1                                   |
| 3    | GitHub Repository Setup    | Complex branching logic; "version control" question is ambiguous |
| -    | Machine Configuration      | Nested within Step 3; asks for nickname and distro               |
| -    | Clone Location             | Nested within Step 3; complex validation                         |
| 4    | Secret Management          | Overwhelming options (8 storage types); most unused              |
| 5    | Configuration Summary      | Asks redundant "add/update files" question                       |
| 6    | System Detection           | Detects packages, runtimes, editors - works well                 |
| 7    | File Selection             | Works well but UI could be cleaner                               |
| 8    | Backup Preview             | Says "Proceed with backing up" - unclear wording                 |
| 9    | Git Commit & Push          | Doesn't account for local-only or non-git scenarios              |
| 10   | Create Symlinks            | **Bug: Shows "Step 10 of 9" with 111% progress**                 |

### Current File Structure Issues

```
~/.dev-machine-backup-restore/
├── backup-config.json     # Flat structure, inconsistent with repo schema
├── github-auth.json       # Sensitive file in root
└── cache/                 # Empty, unused
```

**Problems:**

- No separation between config, secrets, backups, and temp files
- Local config structure (`backup-config.json`) doesn't match repo schema
- No backup location for destructed files (when overwriting)
- No logging infrastructure
- Sensitive auth tokens mixed with config

### Schema Inconsistency

**Current Local Config (`backup-config.json`):**

```json
{
  "os": "macOS",
  "shell": "zsh",
  "configFiles": { ... },  // Flat, unstructured
  "secrets": { ... }
}
```

**Repository Schema (`schema.json`):**

```json
{
  "version": "1.0.0",
  "metadata": { "createdAt": "...", "updatedAt": "..." },
  "repo": { "repoType": "github", ... },
  "systems": [{ "os": "macos", "distro": "darwin", ... }],
  "dotfiles": { "macos-darwin-mbp": { ... } }
}
```

**Problem:** The local config and repo schema have completely different structures, making data mapping complex and error-prone.

---

## Proposed System Architecture

### New File Structure

```
~/.dotport/                      # Renamed from .dev-machine-backup-restore
├── config/
│   ├── user-system.json         # Local system config (NEW FORMAT)
│   └── github-auth.json         # GitHub token (moved from root)
├── backups/
│   ├── generated-backups/       # Timestamped backup snapshots
│   │   └── <timestamp>/         # Each backup session
│   └── destructed-files/        # Safety net for overwritten files
│       ├── <timestamp>/         # Timestamped destruction events
│       └── log.json             # History of all destructions
├── logs/
│   └── <timestamp>.log          # Session logs (future feature)
└── temp/                        # Temporary git clones, processing
```

### Constants Definition

**New file:** `/src/constants/app-config.ts`

```typescript
export const APP_NAME = 'DotPort'
export const APP_VERSION = '1.0.0' // TODO: Import from package.json
export const APP_NAME_NORMALIZED = APP_NAME.toLowerCase()

// System directories
export const SYSTEM_ROOT_FOLDER = `.${APP_NAME_NORMALIZED}`
export const CONFIG_FOLDER = `${SYSTEM_ROOT_FOLDER}/config`
export const BACKUPS_FOLDER = `${SYSTEM_ROOT_FOLDER}/backups`
export const GENERATED_BACKUPS_FOLDER = `${BACKUPS_FOLDER}/generated-backups`
export const DESTRUCTED_FILES_FOLDER = `${BACKUPS_FOLDER}/destructed-files`
export const LOGS_FOLDER = `${SYSTEM_ROOT_FOLDER}/logs`
export const TEMP_FOLDER = `${SYSTEM_ROOT_FOLDER}/temp`

// Config files
export const USER_SYSTEM_CONFIG_FILE = `${CONFIG_FOLDER}/user-system.json`
export const GITHUB_AUTH_FILE = `${CONFIG_FOLDER}/github-auth.json`
export const DESTRUCTED_FILES_LOG = `${DESTRUCTED_FILES_FOLDER}/log.json`
```

### Unified Data Structure

**New Local Config (`user-system.json`):**

```typescript
type UserSystemConfig = {
  version: string // "1.0.0"
  metadata: {
    createdAt: string // ISO 8601
    updatedAt: string // ISO 8601
  }
  repo: {
    repoType: RepoType // "github" | "none"
    repoName: string // "dotfiles"
    repoUrl: string // Full GitHub URL
    repoOwner: string // GitHub username
    branch: string // "main"
    visibility: RepoVisibility // "private" | "public"
  }
  system: SystemMetadata & {
    homeDirectory: string // "/Users/bob"
    localRepoPath: string // "/Users/bob/dev/dotfiles"
    runtimeData: {
      // From ScriptSession
      node: {
        packageManager: string // "pnpm"
        versionManager: string // "fnm"
        version: string // "24.11.1"
      }
    }
  }
}
```

**Benefits:**

- ✅ Consistent structure with repository `schema.json`
- ✅ Single source of truth for system metadata
- ✅ Easy to extend with additional runtime data
- ✅ Clear separation of concerns (repo vs system)

---

## Step-by-Step Simplification

### Proposed Flow (6 Steps)

```
Step 1: System Detection & Confirmation
   ↓
Step 2: GitHub Authentication (Optional)
   ↓
Step 3: Repository Setup
   ↓
Step 4: Secret File Configuration
   ↓
Step 5: File Selection & System Detection
   ↓
Step 6: Backup Execution & Finalization
```

---

### **Step 1: System Detection & Confirmation**

**Consolidates:** Old Steps 1, 2, and machine nickname prompt

**What it does:**

- Auto-detects all system information using `ScriptSession`
- Displays everything in a single confirmation screen
- Allows granular updates if needed

**Prompt:**

```
┌──────────────────────────────────────────┐
│ Step 1 of 6: System Detection           │
│ Progress: ███░░░░░░░░░░░░░░░░░░░ 17%    │
└──────────────────────────────────────────┘

We've detected the following system information:

  Operating System:    macOS
  Distribution:        darwin
  Shell:               zsh
  Home Directory:      /Users/bob

  Runtime:             node
  Package Manager:     pnpm
  Version Manager:     fnm
  Runtime Version:     24.11.1

? Is this information correct?
  ❯ Yes, continue
    Update Operating System
    Update Distribution
    Update Shell
    Update Runtime Information

───────────────────────────────────────────

? Enter a nickname for this machine:
  [my-macos-environment]

  This will create a backup directory named: macos-darwin-my-macos-environment
```

**Detection Logic:**

```typescript
async function detectSystemInfo(): Promise<SystemInfo> {
  const session = ScriptSession

  return {
    os: detectOS(), // 'macos' | 'linux'
    distro: detectDistro(), // 'darwin' | 'ubuntu' | 'arch' etc.
    shell: detectShell(), // from $SHELL
    homeDirectory: session.homeDirectory,
    runtime: {
      node: {
        packageManager: session.packageManager, // from ScriptSession
        versionManager: session.nodeVersionManager, // from ScriptSession
        version: session.nodeVersion, // from ScriptSession
      },
    },
  }
}
```

**Benefits:**

- ✅ Single confirmation screen reduces cognitive load
- ✅ Leverages existing `ScriptSession` detection
- ✅ Nickname prompt moved here (was buried in Step 3)
- ✅ Clear visual formatting

---

### **Step 2: GitHub Authentication (Optional)**

**Consolidates:** Authentication scattered across old Step 3

**What it does:**

- Checks for existing valid GitHub token
- Explains why GitHub is useful
- Provides clear "skip" option for local-only users

**Prompt:**

```
┌──────────────────────────────────────────┐
│ Step 2 of 6: GitHub Authentication      │
│ Progress: ██████░░░░░░░░░░░░░░░░ 33%    │
└──────────────────────────────────────────┘

This application uses GitHub to store your config files in a
private repository and enables advanced features like multi-machine
sync.

GitHub authentication is optional but recommended.

? How would you like to proceed?
  ❯ Authenticate with GitHub
    Continue with local backup only (limited functionality)
    I already have a token configured
```

**If "Authenticate with GitHub" selected:**

```
To authenticate, we'll use GitHub's Device Flow:

  1. We'll open GitHub authorization page in your browser
  2. Enter the code displayed below
  3. Authorize DotPort to access your repositories

Press Enter to open GitHub in your browser...

Your code: XXXX-XXXX

Waiting for authorization...
```

**Token Validation:**

```typescript
async function validateGitHubToken(token: string): Promise<ValidationResult> {
  try {
    const octokit = new Octokit({ auth: token })
    const { data } = await octokit.users.getAuthenticated()
    return { valid: true, username: data.login }
  } catch (error) {
    return {
      valid: false,
      error: 'Token is invalid or expired. Please authenticate again.',
    }
  }
}
```

**Benefits:**

- ✅ Clear explanation of why GitHub is useful
- ✅ Validates existing tokens automatically
- ✅ Provides escape hatch for local-only users
- ✅ Device Flow is user-friendly (no manual token creation)

---

### **Step 3: Repository Setup**

**Consolidates:** Old Step 3's complex branching logic

**What it does:**

- Determines if user has existing DotPort backup
- Handles 4 scenarios simply and clearly

**Scenario Detection:**

```typescript
type RepoScenario =
  | 'first-time' // No backup exists
  | 'existing-local-git' // Local git repo exists
  | 'existing-local-no-git' // Local folder exists, not git
  | 'existing-remote' // Remote GitHub repo exists
```

#### **Scenario 1: First-Time User**

```
? Is this your first time backing up with DotPort?
  ❯ Yes, this is my first backup
    No, I have an existing DotPort repository

[If Yes selected]

? Where should we create your dotfiles repository?
  [~/dev/dotfiles]

? Would you like to connect this to GitHub?
  ❯ Yes, create a private GitHub repository
    No, keep it local only (you can add GitHub later)
```

#### **Scenario 2: Existing Remote Repository**

```
[If "No, I have existing" selected]

? Where is your dotfiles repository?
  ❯ On GitHub (I'll provide the repo name)
    Local directory (I'll provide the path)

[If GitHub selected]

? What is your repository name?
  [dotfiles]

? Where should we clone it?
  [~/dev/dotfiles]

[Check if already cloned at that location]

✓ Repository found at ~/dev/dotfiles

? Which branch should we use for backups?
  ❯ main
    develop
    [other branches detected...]
```

#### **Scenario 3: Existing Local Repository**

```
[If "Local directory" selected]

? Enter the path to your dotfiles repository:
  [~/dev/dotfiles]

[Validate: path exists, is directory, contains schema.json]

✓ Valid DotPort repository found

[If is git repo]
? This is a git repository. Push to GitHub?
  ❯ Yes, create/connect to remote repository
    No, keep local only

[If not git repo]
⚠️  This directory is not a git repository.

? Would you like to initialize it as a git repository?
  ❯ Yes, initialize and optionally push to GitHub
    No, continue without version control
```

**Benefits:**

- ✅ Clear decision tree based on actual user scenarios
- ✅ Automatic detection reduces manual input
- ✅ Graceful handling of edge cases
- ✅ No more "Do you store config files in version control?" confusion

---

### **Step 4: Secret File Configuration**

**Consolidates:** Old Step 4's overwhelming 8 storage options

**What it does:**

- Simplifies to 2 questions: Do you have secrets? What format?
- Focuses on file-based secrets (cloud/vault postponed)

**Prompt:**

```
┌──────────────────────────────────────────┐
│ Step 4 of 6: Secret File Configuration  │
│ Progress: ████████░░░░░░░░░░░░░ 50%     │
└──────────────────────────────────────────┘

Environment variables and secrets will NOT be committed to your
dotfiles repository. We can help you manage them separately.

? Do you have a file containing environment variables or secrets?
  ❯ Yes, I have a secret file
    No, but I want to create one
    Skip secret management

[If "Yes" selected]

? Enter the path to your secret file:
  [~/.env.sh]

? What format does this file use?
  ❯ Shell exports (export MY_VAR="value")
    .env format (MY_VAR="value")

[If "No, create one" selected]

? Where should we create your secret file?
  [~/.env.sh]

We'll create a file like this:

  # ~/.env.sh
  export MY_SECRET="your-secret-here"

✓ Secret file created at ~/.env.sh

[If "Skip" selected]

⚠️  No secret management configured. You can add this later by
   editing your user-system.json config file.
```

**Encryption Handling:**

```
? Would you like to encrypt your secrets?
  ❯ Not now (continue without encryption)
    Tell me more about encryption

[If "Tell me more" selected]

Secret encryption is not yet available in this version but will
be supported in an upcoming release using age/sops encryption.

For now, ensure your secret file is:
  • Never committed to git (automatically added to .gitignore)
  • Stored securely on your local machine
  • Backed up separately if needed

Press Enter to continue...
```

**Benefits:**

- ✅ Reduces 8 options to 3 clear choices
- ✅ Focuses on the 90% use case (local file)
- ✅ Honest about encryption limitations
- ✅ Clear guidance on secret file formats

---

### **Step 5: File Selection & System Detection**

**Consolidates:** Old Steps 6 & 7

**What it does:**

- Auto-detects packages, runtimes, editors (keep current logic)
- Cleaner file selection UI
- Combined "review and confirm" screen

**Prompt:**

```
┌──────────────────────────────────────────┐
│ Step 5 of 6: File & System Detection    │
│ Progress: ███████████████░░░░░ 83%      │
└──────────────────────────────────────────┘

🔍 Scanning your system...

✓ Detected 15 config files
✓ Detected 3 package managers (homebrew, npm, pnpm)
✓ Detected 2 editors (VS Code, Windsurf)
✓ Detected 3 runtimes (node, python, ruby)

? Select files to back up (use ↑/↓ arrows, space to toggle, enter to confirm)

  ✓ .bashrc (28B)
  ✓ .zshrc (3.5KB)
  ✓ .gitconfig (106B)
  ✓ .ssh/config (548B)
  ✓ VS Code settings (macOS)
  ✓ VS Code keybindings (macOS)
  ✓ Windsurf settings (macOS)
  [ ... 8 more files ... ]

───────────────────────────────────────────

Selected: 15 files, 3 package managers, 2 editors, 3 runtimes

? Add more files manually?
  ❯ No, continue with selected files
    Yes, add custom file paths
```

**Manual File Addition (if selected):**

```
? Enter file path (or press Enter to finish):
  [~/]

? Track this file in git?
  ❯ Yes, add to repository
    No, keep as untracked secret

✓ Added: ~/custom-config.conf

? Enter another file path (or press Enter to finish):
  [leave empty to continue]
```

**Benefits:**

- ✅ Clean, scannable file list
- ✅ Combined detection step reduces back-and-forth
- ✅ Clear summary of selections
- ✅ Simple manual addition flow

---

### **Step 6: Backup Execution & Finalization**

**Consolidates:** Old Steps 8, 9, and 10 (symlinks)

**What it does:**

- Shows preview of what will happen
- Executes backup with progress indicator
- Handles git operations based on setup
- Optional symlink creation

**Preview:**

```
┌──────────────────────────────────────────┐
│ Step 6 of 6: Backup & Finalize          │
│ Progress: ████████████████████ 100%     │
└──────────────────────────────────────────┘

📋 Backup Preview

Repository: ~/dev/dotfiles
Target directory: macos-darwin-my-macos-environment/

Files to backup:
  • .bashrc → macos-darwin-my-macos-environment/.bashrc
  • .zshrc → macos-darwin-my-macos-environment/.zshrc
  • .gitconfig → macos-darwin-my-macos-environment/.gitconfig
  [ ... 12 more files ... ]

Packages to export:
  • homebrew (142 packages)
  • npm (8 global packages)
  • pnpm (3 global packages)

Editor extensions:
  • VS Code (23 extensions)
  • Windsurf (18 extensions)

? Proceed with backup?
  ❯ Yes, backup to ~/dev/dotfiles
    No, go back to modify selections
```

**Execution:**

```
🔄 Backing up files...

  [████████████████░░░░] 80% - Copying .gitconfig

✓ Backup complete!

  • 15 files backed up
  • 3 package lists exported
  • 2 editor extension lists exported
  • Schema updated
```

**Git Operations (Adaptive):**

**If GitHub connected:**

```
? Commit and push changes to GitHub?
  ❯ Yes, commit and push now
    No, I'll commit manually later

[If Yes]

📤 Committing to git...

  ✓ Changes staged
  ✓ Committed: "Backup from macos-darwin-my-macos-environment"
  ✓ Pushed to origin/main

✅ Backup committed and pushed to GitHub!
```

**If local git (no remote):**

```
? Stage changes for commit?
  ❯ Yes, stage changes now
    No, I'll handle git manually

[If Yes]

📝 Staging changes...

  ✓ All changes staged

ℹ️  Changes are staged but not committed.
   Run these commands when ready:

   cd ~/dev/dotfiles
   git commit -m "Backup from macos-darwin-my-macos-environment"
```

**If not git repo:**

```
✅ Backup complete!

Your files are saved to: ~/dev/dotfiles

ℹ️  This is not a git repository. To enable version control:

   cd ~/dev/dotfiles
   git init
   git add .
   git commit -m "Initial commit"
```

**Symlink Creation:**

```
───────────────────────────────────────────

Symlinks allow files to be stored in your dotfiles repository
while being accessible from their original locations (~/.zshrc).

⚠️  Warning: Existing files will be backed up to:
   ~/.dotport/backups/destructed-files/<timestamp>/

? Create symlinks for backed up files?
  ❯ No, I'll create them manually later
    Yes, create symlinks for all files
    Let me choose which files to symlink

[If "Let me choose" selected]

? Select files to symlink:
  ✓ .bashrc
  ✓ .zshrc
  ✓ .gitconfig
  [ ... ]

🔗 Creating symlinks...

  ✓ ~/.bashrc → ~/dev/dotfiles/macos-darwin-my-macos-environment/.bashrc
  ✓ ~/.zshrc → ~/dev/dotfiles/macos-darwin-my-macos-environment/.zshrc

  ⚠️  Existing files backed up to:
     ~/.dotport/backups/destructed-files/2025-01-15T10-30-45/

✅ Symlinks created successfully!
```

**Final Summary:**

```
┌──────────────────────────────────────────┐
│          Backup Complete! 🎉             │
└──────────────────────────────────────────┘

Your dotfiles have been backed up successfully.

Summary:
  • Repository: ~/dev/dotfiles
  • Machine ID: macos-darwin-my-macos-environment
  • Files backed up: 15
  • Packages exported: 153 (across 3 package managers)
  • Extensions exported: 41 (across 2 editors)
  • Symlinks created: 15
  • Committed to GitHub: Yes

Configuration saved to: ~/.dotport/config/user-system.json

Next steps:
  • To restore on another machine: Run 'npx dotport restore'
  • To update this backup: Run 'npx dotport backup' again
  • To manage settings: Edit ~/.dotport/config/user-system.json

Documentation: https://github.com/robertjbass/dotport
```

**Benefits:**

- ✅ Clear preview before any destructive operations
- ✅ Adaptive git behavior based on setup
- ✅ Safe symlink creation with automatic backups
- ✅ Comprehensive final summary
- ✅ Clear next steps for user

---

## Data Structure Changes

### Type Definitions Update

**New file:** `/types/user-system-config.ts`

```typescript
import type {
  OperatingSystem,
  RepoType,
  RepoVisibility,
  SystemMetadata,
  SecretFile,
  SecretStorage,
} from './backup-config'

/**
 * Local user system configuration
 * Stored at: ~/.dotport/config/user-system.json
 *
 * This is similar to BackupConfig but simplified for local system info
 */
export type UserSystemConfig = {
  version: string

  metadata: {
    createdAt: string // ISO 8601 timestamp
    updatedAt: string // ISO 8601 timestamp
  }

  repo: {
    repoType: RepoType
    repoName: string
    repoUrl: string
    repoOwner: string
    branch: string
    visibility: RepoVisibility
  }

  system: SystemMetadata & {
    homeDirectory: string
    localRepoPath: string
    runtimeData: {
      node: {
        packageManager: string // "npm" | "pnpm" | "yarn" | "bun"
        versionManager: string // "fnm" | "nvm" | "n" | "asdf" | "none"
        version: string // "20.11.0"
      }
      // Future: python, ruby, etc.
    }
  }

  secrets?: {
    enabled: boolean
    secretFile: SecretFile
    storage: SecretStorage
  }
}

/**
 * GitHub authentication config
 * Stored at: ~/.dotport/config/github-auth.json
 */
export type GitHubAuthConfig = {
  token: string
  username: string
  expiresAt?: string // Optional: if token has expiration
  scopes: string[] // Token scopes
  createdAt: string // When token was added
}

/**
 * Destructed files log entry
 * Stored in: ~/.dotport/backups/destructed-files/log.json
 */
export type DestructedFileEntry = {
  originalPath: string // "~/.zshrc"
  backupPath: string // "~/.dotport/backups/destructed-files/2025-01-15T10-30-45/.zshrc"
  timestamp: string // ISO 8601
  reason: 'symlink' | 'overwrite' | 'manual'
  machineId: string // "macos-darwin-mbp"
  restoreable: boolean // Can this be restored?
}

export type DestructedFilesLog = {
  entries: DestructedFileEntry[]
}
```

### Migration Logic

**New file:** `/utils/config-migration.ts`

```typescript
import fs from 'fs'
import path from 'path'
import { expandTilde } from './path-helpers'
import type { UserSystemConfig } from '../types/user-system-config'

const OLD_CONFIG_DIR = '~/.dev-machine-backup-restore'
const NEW_CONFIG_DIR = '~/.dotport'

/**
 * Migrate from old config structure to new structure
 */
export async function migrateOldConfig(): Promise<void> {
  const oldPath = expandTilde(OLD_CONFIG_DIR)
  const newPath = expandTilde(NEW_CONFIG_DIR)

  // Check if old config exists
  if (!fs.existsSync(oldPath)) {
    return // Nothing to migrate
  }

  // Check if new config already exists
  if (fs.existsSync(newPath)) {
    console.log('New config structure already exists, skipping migration')
    return
  }

  console.log('Migrating old config structure...')

  // Read old configs
  const oldBackupConfig = readOldBackupConfig()
  const oldGithubAuth = readOldGithubAuth()

  // Create new directory structure
  createNewDirectoryStructure()

  // Convert and write new configs
  const newConfig = convertBackupConfigToUserSystemConfig(oldBackupConfig)
  writeUserSystemConfig(newConfig)

  if (oldGithubAuth) {
    writeGithubAuthConfig(oldGithubAuth)
  }

  console.log('✓ Migration complete!')
  console.log(`  Old config: ${oldPath}`)
  console.log(`  New config: ${newPath}`)
  console.log('\nYou can safely delete the old config directory:')
  console.log(`  rm -rf ${oldPath}`)
}

function convertBackupConfigToUserSystemConfig(
  oldConfig: any,
): UserSystemConfig {
  // Map old structure to new structure
  return {
    version: '1.0.0',
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    repo: {
      repoType: oldConfig.configFiles?.service || 'none',
      repoName: oldConfig.configFiles?.repoName || 'dotfiles',
      repoUrl: oldConfig.configFiles?.gitRepoUrl || '',
      repoOwner: '', // Will be populated from GitHub auth
      branch: 'main',
      visibility: oldConfig.configFiles?.repoVisibility || 'private',
    },
    system: {
      os: oldConfig.os?.toLowerCase() || 'unknown',
      distro: oldConfig.configFiles?.machineDistro || 'unknown',
      nickname: oldConfig.configFiles?.machineNickname || 'default',
      repoPath: `${oldConfig.os?.toLowerCase()}-${oldConfig.configFiles?.machineDistro}-${oldConfig.configFiles?.machineNickname}`,
      shell: oldConfig.shell || 'bash',
      shellConfigFile: oldConfig.shell === 'zsh' ? '.zshrc' : '.bashrc',
      homeDirectory: process.env.HOME || '~',
      localRepoPath: oldConfig.configFiles?.cloneLocation || '~/dotfiles',
      runtimeData: {
        node: {
          packageManager: 'npm', // Default, will be detected on next run
          versionManager: 'none',
          version: 'unknown',
        },
      },
    },
    secrets: oldConfig.secrets?.enabled
      ? {
          enabled: true,
          secretFile: {
            name: oldConfig.secrets.details?.secretFileName || '.env.sh',
            location: oldConfig.secrets.details?.secretFileLocation || '~',
            format: oldConfig.secrets.details?.localType?.includes('Shell')
              ? 'shell-export'
              : 'dotenv',
          },
          storage: {
            type: 'local-only',
          },
        }
      : undefined,
  }
}
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

**Goal:** Set up new infrastructure without breaking existing functionality

1. **Create new constants file**
   - [ ] Create `/src/constants/app-config.ts`
   - [ ] Export all folder and file path constants
   - [ ] Update `ScriptSession` to use constants

2. **Create new type definitions**
   - [ ] Create `/types/user-system-config.ts`
   - [ ] Define `UserSystemConfig`, `GitHubAuthConfig`, `DestructedFilesLog`
   - [ ] Ensure compatibility with existing `BackupConfig`

3. **Create directory management utility**
   - [ ] Create `/utils/directory-manager.ts`
   - [ ] Function to create `~/.dotport` structure
   - [ ] Function to ensure all subdirectories exist

4. **Create migration utility**
   - [ ] Create `/utils/config-migration.ts`
   - [ ] Implement migration from old to new structure
   - [ ] Test migration with sample old configs

**Deliverable:** Infrastructure is in place; old backup script still works

---

### Phase 2: Config Utilities (Week 2)

**Goal:** Create utilities for reading/writing new config format

1. **Create user-system-config utility**
   - [ ] Create `/utils/user-system-config.ts`
   - [ ] `readUserSystemConfig()` - read from new location
   - [ ] `writeUserSystemConfig()` - write to new location
   - [ ] `updateUserSystemConfig()` - partial updates
   - [ ] Fallback to migration if old config detected

2. **Update GitHub auth utility**
   - [ ] Update `/utils/github-auth.ts`
   - [ ] Use new config location `~/.dotport/config/github-auth.json`
   - [ ] Add token validation function
   - [ ] Add token expiration checking

3. **Create destructed files utility**
   - [ ] Create `/utils/destructed-files.ts`
   - [ ] Function to log destructed files
   - [ ] Function to query destructed files log
   - [ ] Function to restore destructed files (future feature)

**Deliverable:** All config utilities work with new structure

---

### Phase 3: Refactor Steps 1-3 (Week 3)

**Goal:** Implement simplified Steps 1-3

1. **Refactor Step 1: System Detection**
   - [ ] Create `/utils/system-detection.ts`
   - [ ] Consolidate OS, shell, distro, runtime detection
   - [ ] Create single confirmation prompt
   - [ ] Add nickname prompt at end

2. **Refactor Step 2: GitHub Authentication**
   - [ ] Simplify GitHub auth flow
   - [ ] Add Device Flow implementation
   - [ ] Add clear "skip" option
   - [ ] Validate existing tokens

3. **Refactor Step 3: Repository Setup**
   - [ ] Implement scenario detection logic
   - [ ] Create separate flows for each scenario
   - [ ] Simplify clone/create/connect logic
   - [ ] Remove "version control" ambiguous question

**Deliverable:** Steps 1-3 are simplified and working

---

### Phase 4: Refactor Steps 4-6 (Week 4)

**Goal:** Implement simplified Steps 4-6

1. **Refactor Step 4: Secret Configuration**
   - [ ] Reduce to 3 options (have/create/skip)
   - [ ] Add format detection for existing files
   - [ ] Add encryption explanation (not implemented)
   - [ ] Update secret file handling

2. **Refactor Step 5: File & System Detection**
   - [ ] Combine old Steps 6 & 7
   - [ ] Clean up file list UI
   - [ ] Add combined summary screen
   - [ ] Improve manual file addition flow

3. **Refactor Step 6: Backup Execution**
   - [ ] Combine old Steps 8, 9, 10
   - [ ] Add comprehensive preview
   - [ ] Implement adaptive git operations
   - [ ] Add safe symlink creation with backups
   - [ ] Create final summary screen

**Deliverable:** All 6 steps are implemented and working

---

### Phase 5: Testing & Documentation (Week 5)

**Goal:** Ensure reliability and document changes

1. **Testing**
   - [ ] Test fresh install scenario
   - [ ] Test migration scenario
   - [ ] Test GitHub connected scenario
   - [ ] Test local-only scenario
   - [ ] Test with macOS
   - [ ] Test with Linux (Ubuntu, Arch)

2. **Documentation**
   - [ ] Update README.md
   - [ ] Create MIGRATION.md guide
   - [ ] Update inline code comments
   - [ ] Create troubleshooting guide

3. **Cleanup**
   - [ ] Remove old unused code
   - [ ] Remove debug logs
   - [ ] Optimize imports
   - [ ] Run linter and fix issues

**Deliverable:** Fully tested, documented, production-ready code

---

### Phase 6: Release (Week 6)

**Goal:** Deploy and communicate changes

1. **Pre-release**
   - [ ] Create v2.0.0 migration checklist
   - [ ] Test one more time on clean systems
   - [ ] Create release notes
   - [ ] Tag release candidate

2. **Release**
   - [ ] Merge to main branch
   - [ ] Tag v2.0.0
   - [ ] Publish release on GitHub
   - [ ] Update npm package

3. **Post-release**
   - [ ] Monitor for issues
   - [ ] Respond to user feedback
   - [ ] Create follow-up issues for enhancements

**Deliverable:** v2.0.0 released and stable

---

## Migration Strategy

### Automatic Migration

When a user runs the new version of the backup script, check if old config exists:

```typescript
// In scripts/backup.ts at start of main()

async function main() {
  // Check if migration is needed
  const oldConfigExists = fs.existsSync(
    expandTilde('~/.dev-machine-backup-restore'),
  )
  const newConfigExists = fs.existsSync(expandTilde('~/.dotport'))

  if (oldConfigExists && !newConfigExists) {
    console.log(
      chalk.cyan('\n🔄 Migrating to new configuration structure...\n'),
    )
    await migrateOldConfig()
    console.log(chalk.green('✓ Migration complete!\n'))
  }

  // Continue with normal backup flow...
}
```

### Migration Checklist

**What gets migrated:**

- ✅ `backup-config.json` → `user-system.json` (transformed)
- ✅ `github-auth.json` → `config/github-auth.json` (moved)

**What gets created:**

- ✅ New directory structure (`backups/`, `logs/`, `temp/`)
- ✅ Empty `destructed-files/log.json`

**What user needs to do:**

- ✅ Nothing! Migration is automatic
- ✅ Optionally delete old `~/.dev-machine-backup-restore/` folder

### Backwards Compatibility

**For v1.x users upgrading to v2.0:**

1. **First run:** Automatic migration occurs
2. **Subsequent runs:** Use new config structure
3. **Old config:** Preserved but no longer used

**Breaking changes:**

- Config location changed (migrated automatically)
- API for custom scripts using internal modules may change

**Deprecation notice:**

```
⚠️  DotPort v2.0 Upgrade Notice

We've simplified the backup process and reorganized config files:

  Old: ~/.dev-machine-backup-restore/
  New: ~/.dotport/

Your configuration has been automatically migrated.
You can safely delete the old directory:

  rm -rf ~/.dev-machine-backup-restore

See MIGRATION.md for details: https://github.com/...
```

---

## Testing & Validation

### Test Scenarios

#### Scenario 1: Fresh Install

- [ ] macOS fresh install
- [ ] Linux (Ubuntu) fresh install
- [ ] Linux (Arch) fresh install
- [ ] No GitHub authentication
- [ ] With GitHub authentication

#### Scenario 2: Migration from v1.x

- [ ] macOS with existing old config
- [ ] Linux with existing old config
- [ ] With GitHub configured
- [ ] Without GitHub configured

#### Scenario 3: Edge Cases

- [ ] Existing dotfiles repo (not created by DotPort)
- [ ] Local repo not pushed to GitHub
- [ ] GitHub repo exists, local clone missing
- [ ] Invalid GitHub token
- [ ] No internet connection (local only)
- [ ] Permission errors on config directory

### Validation Checklist

**File Structure:**

- [ ] `~/.dotport/` directory created
- [ ] `config/`, `backups/`, `logs/`, `temp/` subdirectories exist
- [ ] `user-system.json` follows new schema
- [ ] `github-auth.json` in correct location

**Backup Process:**

- [ ] All 6 steps complete without errors
- [ ] Files backed up to correct location
- [ ] Schema.json created/updated in repo
- [ ] Git operations work correctly
- [ ] Symlinks created successfully (if requested)

**Data Integrity:**

- [ ] Config files match original files (byte-for-byte)
- [ ] Package lists accurate
- [ ] Extension lists accurate
- [ ] Runtime versions detected correctly

**User Experience:**

- [ ] Progress indicators accurate (no "Step 10 of 9")
- [ ] All prompts clear and unambiguous
- [ ] Error messages helpful
- [ ] Success messages informative

---

## Success Metrics

### Quantitative Goals

| Metric                       | Current   | Target  | Measurement       |
| ---------------------------- | --------- | ------- | ----------------- |
| Lines of code in `backup.ts` | 2,930     | < 1,500 | LOC count         |
| Number of steps              | 10        | 6       | Step count        |
| User questions asked         | ~25-30    | < 15    | Question count    |
| Time to complete backup      | ~8-10 min | < 5 min | Actual testing    |
| Config file consistency      | Low       | High    | Schema validation |

### Qualitative Goals

- [ ] Users understand each step without confusion
- [ ] Error messages clearly explain what went wrong
- [ ] Users can easily resume after errors
- [ ] GitHub authentication is straightforward
- [ ] Repository setup logic is clear
- [ ] Secret management is simple and secure
- [ ] Final summary provides all needed info

---

## Appendix

### A. Current Pain Points (User Feedback)

Based on issues and confusion observed:

1. **"Do you store config files in version control?"**
   - Users don't understand what this means
   - Ambiguous between "our system" and "any git repo"

2. **"Step 10 of 9" bug**
   - Progress bar shows 111%
   - Symlinks should be part of step 9, not separate

3. **Secret storage options overwhelming**
   - 8 different options, most not implemented
   - Users just want a simple .env file

4. **GitHub vs Other Git vs None**
   - Too many options upfront
   - Most users just want GitHub or local

5. **Config structure inconsistency**
   - Local `backup-config.json` doesn't match repo `schema.json`
   - Hard to understand what's stored where

### B. Files to Modify

**Core script files:**

- `/scripts/backup.ts` (major refactor)
- `/scripts/restore.ts` (minor updates for new config)
- `/scripts/index.ts` (minor updates)

**Utility files:**

- `/utils/config.ts` (update for new structure)
- `/utils/github-auth.ts` (update for new location)
- `/utils/prompt-helpers.ts` (add new prompt types)
- `/utils/system-detection.ts` (consolidate detection)
- `/utils/user-system-config.ts` (new file)
- `/utils/config-migration.ts` (new file)
- `/utils/destructed-files.ts` (new file)

**Type files:**

- `/types/backup-config.ts` (minor updates)
- `/types/backup-schema.ts` (no changes)
- `/types/user-system-config.ts` (new file)

**Constant files:**

- `/src/constants/app-config.ts` (new file)

**Documentation:**

- `README.md` (update)
- `MIGRATION.md` (new file)
- `SIMPLIFY-PLAN.md` (this file)

### C. Breaking Changes

**For end users:**

- Config location changes (auto-migrated)
- New directory structure (auto-created)

**For developers:**

- Import paths change
- Config structure changes
- Some utility function signatures change

**Mitigation:**

- Automatic migration on first run
- Deprecation notices
- Clear migration documentation

---

## Conclusion

This simplification plan transforms the DotPort interactive backup from a complex 10-step, 2,930-line process into a streamlined 6-step experience. By consolidating system detection, simplifying GitHub authentication, clarifying repository setup, and reducing secret management complexity, we significantly improve the user experience while maintaining all core functionality.

The new `~/.dotport/` structure provides clear separation of concerns, and the unified config format (aligned with the repository schema) reduces cognitive load and potential errors.

**Next Steps:**

1. Review this plan with stakeholders
2. Approve or modify proposed changes
3. Begin Phase 1 implementation
4. Iterate based on testing and feedback

**Estimated Timeline:** 6 weeks from approval to release

**Estimated Effort:** ~80-100 hours of development + testing

---

**Document Version:** 1.0
**Created:** 2025-01-15
**Author:** Claude (AI Assistant)
**Status:** Proposed - Awaiting Review
