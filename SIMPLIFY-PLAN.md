# Outline for Simplification Refactor

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

# FINAL

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
