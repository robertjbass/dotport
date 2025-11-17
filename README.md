# TODO - work in progress

    "@octokit/rest": "^22.0.1",
    "chalk": "^5.6.2",
    "cli-progress": "^3.12.0",
    "diff": "^8.0.2",
    "inquirer": "^12.11.0",
    "simple-git": "^3.30.0"

we need an interactive script to save your dotfiles and settings. The workflow will be something like this:

Options:

```ts
const options = {
  os: 'macOS' | 'linux' | 'windows' | 'other',
  configFilePaths: {
    '.bashrc': string,
    '.zshrc': string,
    '.env.sh': string,
  },
  repoPaths: {
    remote: {
      configFiles: string,
      secrets: string,
    },
    local: {
      configFiles: string,
      secrets: string,
    },
  },
  configFiles: {
    versionControl: 'github' | 'other' | 'none',
    gitService: 'github' | 'other' | 'none',
    gitRepoUrl: string,
  },
  secrets: {
    git: {
      versionControl: 'github' | 'other' | 'none',
      gitService: 'github' | 'other' | 'none',
      gitRepoUrl: string,
      gitBranch: string,
      gitUsername: string,
      gitEmail: string,
    },
    local: {
      type: 'file' | 'env' | 'pgp' | 'age' | 'plaintext',
      path: string,
    },
    cloud: {
      service:
        'hashicorp' |
        'vercel' |
        'cloudflare' |
        'netlify' |
        'aws-secrets-manager' |
        'aws-systems-manager' |
        'gcp-secret-manager' |
        'azure-key-vault' |
        'other' |
        'none',
    },
  },
}
```

Notice:
When you see 'config files' referenced, that refers to dotfiles and settings such as .bashrc, .zshrc, .gitconfig, editor settings, keybindings, etc. but does not include sensitive information such as ssh keys, environment variables, etc.

To begin, we will need to get some general information about your current setup. This will include:

====================
Operating System
====================

- What is your operating system? (try to detect this automatically and pre-select it - only one can be selected)

[] macOS
[] Linux
[] Windows
[] Other

> (BRANCH) If WINDOWS or OTHER

We do not currently support backup/restore for these operating systems (end process)

====================
Config File Storage
====================

- Do you currently store config files in version control?

[] Yes
[] No

> (BRANCH) If YES

- Which service do you currently use to store your config files?

[] GitHub
[] Other Git Service

- Which service do you currently use to store your config files?

====================
Secret Storage Options
====================

- Do you currently backup your secrets such as environment variables, API keys, etc.?

[] Yes
[] No

> (BRANCH) If YES

- Which service do you currently use to store your secrets?

[None]
[] I do not wish to manage secrets at this time (skip secret backup/restore)

[Local Files]
[] .env file
[] Shell script exports (.env.sh, .secrets.sh)
[] PGP-encrypted file
[] Age-encrypted file
[] Plaintext file

[Version Control Storage - Remote]
[] Git Repo – PGP-encrypted
[] Git Repo – Age-encrypted
[] Git Repo – Plaintext (private - not recommended)
[] GitHub Encrypted Secrets
[] GitLab CI/CD Variables
[] Bitbucket Secure Variables

[Version Control Storage - Local]
[] Git Repo – PGP-encrypted
[] Git Repo – Age-encrypted
[] Git Repo – Plaintext (private - not recommended)

[Platform / Edge Providers]
[] Vercel Environment Variables
[] Cloudflare Workers Secrets
[] Netlify Environment Variables

[Cloud Secret Managers]
[] AWS Secrets Manager
[] AWS Systems Manager Parameter Store
[] Google Cloud Secret Manager
[] Azure Key Vault

[Cloud-Agnostic Third-Party Vaults]
[] HashiCorp Vault
[] Doppler
[] Akeyless
[] Infisical

[OS-Level Secure Storage]
[] macOS Keychain
[] Linux Secret Service / pass

[Password Manager]
[] Product such as (1Password, LastPass, Dashlane, etc.)

> (BRANCH) If NO

- Which approach/service would do you wish to use to manage your secrets?

[] None (skip this step)
[] I do not wish to manage secrets at this time (local only - skip secret backup/restore)
[] Local file only (no cloud storage)
[] Private GitHub PGP encrypted file
[] HashiCorp Vault
[] Vercel Environment Variables
[] Cloudflare Worker Secrets
[] Password Manager (We do not integrate but will provide instructions for how to use it)
