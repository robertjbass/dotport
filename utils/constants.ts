/**
 * Constants for the dev-machine-backup-restore tool
 */

/**
 * Popular Linux distributions grouped by category
 */
export const LINUX_DISTRIBUTIONS = {
  debian: [
    { name: 'Debian', value: 'debian' },
    { name: 'Ubuntu', value: 'ubuntu' },
    { name: 'Linux Mint', value: 'mint' },
    { name: 'Pop!_OS', value: 'popos' },
    { name: 'Elementary OS', value: 'elementary' },
    { name: 'Kali Linux', value: 'kali' },
  ],
  redhat: [
    { name: 'Fedora', value: 'fedora' },
    { name: 'RHEL (Red Hat Enterprise Linux)', value: 'rhel' },
    { name: 'CentOS', value: 'centos' },
    { name: 'Rocky Linux', value: 'rocky' },
    { name: 'AlmaLinux', value: 'alma' },
  ],
  arch: [
    { name: 'Arch Linux', value: 'arch' },
    { name: 'Manjaro', value: 'manjaro' },
    { name: 'EndeavourOS', value: 'endeavour' },
    { name: 'Garuda Linux', value: 'garuda' },
  ],
  suse: [
    { name: 'openSUSE', value: 'opensuse' },
    { name: 'SLES (SUSE Linux Enterprise)', value: 'sles' },
  ],
  other: [
    { name: 'Gentoo', value: 'gentoo' },
    { name: 'Slackware', value: 'slackware' },
    { name: 'NixOS', value: 'nixos' },
    { name: 'Void Linux', value: 'void' },
    { name: 'Alpine Linux', value: 'alpine' },
  ],
}

/**
 * Flat list of all distributions for selection
 */
export const ALL_LINUX_DISTRIBUTIONS = [
  ...LINUX_DISTRIBUTIONS.debian,
  ...LINUX_DISTRIBUTIONS.redhat,
  ...LINUX_DISTRIBUTIONS.arch,
  ...LINUX_DISTRIBUTIONS.suse,
  ...LINUX_DISTRIBUTIONS.other,
]

/**
 * Common distributions for quick selection
 */
export const COMMON_DISTRIBUTIONS = [
  { name: 'Ubuntu', value: 'ubuntu' },
  { name: 'Debian', value: 'debian' },
  { name: 'Fedora', value: 'fedora' },
  { name: 'Arch Linux', value: 'arch' },
  { name: 'Linux Mint', value: 'mint' },
  { name: 'Pop!_OS', value: 'popos' },
  { name: 'Manjaro', value: 'manjaro' },
  { name: 'CentOS', value: 'centos' },
]

/**
 * macOS version names (for potential future use)
 */
export const MACOS_VERSIONS = [
  { name: 'macOS Sequoia (15.x)', value: 'sequoia' },
  { name: 'macOS Sonoma (14.x)', value: 'sonoma' },
  { name: 'macOS Ventura (13.x)', value: 'ventura' },
  { name: 'macOS Monterey (12.x)', value: 'monterey' },
  { name: 'macOS Big Sur (11.x)', value: 'bigsur' },
  { name: 'macOS Catalina (10.15)', value: 'catalina' },
]

/**
 * Default repository name
 */
export const DEFAULT_REPO_NAME = 'dotfiles'

/**
 * Default clone location
 */
export const DEFAULT_CLONE_LOCATION = '~'
