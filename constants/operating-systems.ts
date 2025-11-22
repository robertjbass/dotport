/**
 * Operating System Constants
 *
 * This file contains all OS and distribution-related constants.
 * Contributors can easily add new distributions or update display names.
 *
 * Format for distribution entries:
 * { name: 'Display Name', value: 'internal-id' }
 */

export type DistroEntry = {
  name: string
  value: string
}

export const LINUX_DISTRIBUTIONS = {
  // Debian-based (apt)
  debian: [
    { name: 'Debian', value: 'debian' },
    { name: 'Ubuntu', value: 'ubuntu' },
    { name: 'Linux Mint', value: 'mint' },
    { name: 'Pop!_OS', value: 'popos' },
    { name: 'Elementary OS', value: 'elementary' },
    { name: 'Kali Linux', value: 'kali' },
    { name: 'Zorin OS', value: 'zorin' },
    { name: 'MX Linux', value: 'mx' },
  ],

  // Red Hat-based (dnf/yum)
  redhat: [
    { name: 'Fedora', value: 'fedora' },
    { name: 'RHEL (Red Hat Enterprise Linux)', value: 'rhel' },
    { name: 'CentOS', value: 'centos' },
    { name: 'Rocky Linux', value: 'rocky' },
    { name: 'AlmaLinux', value: 'alma' },
    { name: 'Oracle Linux', value: 'oracle' },
  ],

  // Arch-based (pacman)
  arch: [
    { name: 'Arch Linux', value: 'arch' },
    { name: 'Manjaro', value: 'manjaro' },
    { name: 'EndeavourOS', value: 'endeavour' },
    { name: 'Garuda Linux', value: 'garuda' },
    { name: 'ArcoLinux', value: 'arco' },
  ],

  // SUSE-based (zypper)
  suse: [
    { name: 'openSUSE Tumbleweed', value: 'opensuse-tumbleweed' },
    { name: 'openSUSE Leap', value: 'opensuse' },
    { name: 'SLES (SUSE Linux Enterprise)', value: 'sles' },
  ],

  // Independent/Other
  other: [
    { name: 'Gentoo', value: 'gentoo' },
    { name: 'Slackware', value: 'slackware' },
    { name: 'NixOS', value: 'nixos' },
    { name: 'Void Linux', value: 'void' },
    { name: 'Alpine Linux', value: 'alpine' },
    { name: 'Solus', value: 'solus' },
    { name: 'Clear Linux', value: 'clear' },
  ],
}

// Flat list for selection menus
export const ALL_LINUX_DISTRIBUTIONS: DistroEntry[] = [
  ...LINUX_DISTRIBUTIONS.debian,
  ...LINUX_DISTRIBUTIONS.redhat,
  ...LINUX_DISTRIBUTIONS.arch,
  ...LINUX_DISTRIBUTIONS.suse,
  ...LINUX_DISTRIBUTIONS.other,
]

/**
 * Display name mapping for distros and OS variants
 * Maps internal ID -> user-friendly display name
 */
export const DISTRO_DISPLAY_NAMES: Record<string, string> = {
  // macOS
  darwin: 'Darwin',
  sequoia: 'macOS Sequoia',
  sonoma: 'macOS Sonoma',
  ventura: 'macOS Ventura',
  monterey: 'macOS Monterey',
  bigsur: 'macOS Big Sur',
  catalina: 'macOS Catalina',

  // Debian-based
  ubuntu: 'Ubuntu',
  debian: 'Debian',
  mint: 'Linux Mint',
  popos: 'Pop!_OS',
  elementary: 'Elementary OS',
  kali: 'Kali Linux',
  zorin: 'Zorin OS',
  mx: 'MX Linux',

  // Red Hat-based
  fedora: 'Fedora',
  rhel: 'Red Hat Enterprise Linux',
  centos: 'CentOS',
  rocky: 'Rocky Linux',
  alma: 'AlmaLinux',
  oracle: 'Oracle Linux',

  // Arch-based
  arch: 'Arch Linux',
  manjaro: 'Manjaro',
  endeavour: 'EndeavourOS',
  garuda: 'Garuda Linux',
  arco: 'ArcoLinux',

  // SUSE-based
  opensuse: 'openSUSE',
  'opensuse-tumbleweed': 'openSUSE Tumbleweed',
  sles: 'SUSE Linux Enterprise',

  // Independent/Other
  gentoo: 'Gentoo',
  slackware: 'Slackware',
  nixos: 'NixOS',
  void: 'Void Linux',
  alpine: 'Alpine Linux',
  solus: 'Solus',
  clear: 'Clear Linux',

  // Fallback
  unknown: 'Unknown',
}
