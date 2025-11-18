/**
 * Git URL Parser
 *
 * Parses various GitHub URL formats into a standardized format
 */

export type ParsedGitUrl = {
  owner: string
  repo: string
  fullUrl: string
  sshUrl: string
  httpsUrl: string
}

/**
 * Parse various GitHub URL formats into a standardized object
 *
 * Supported formats:
 * - git@github.com:robertjbass/dotfiles.git
 * - https://github.com/robertjbass/dotfiles.git
 * - https://github.com/robertjbass/dotfiles
 * - github.com/robertjbass/dotfiles
 * - robertjbass/dotfiles
 */
export function parseGitUrl(url: string): ParsedGitUrl | null {
  const trimmedUrl = url.trim()

  // Pattern 1: SSH format (git@github.com:owner/repo.git)
  const sshPattern = /^git@github\.com:([^/]+)\/(.+?)(\.git)?$/
  const sshMatch = trimmedUrl.match(sshPattern)
  if (sshMatch) {
    const owner = sshMatch[1]
    const repo = sshMatch[2].replace(/\.git$/, '')
    return formatParsedUrl(owner, repo)
  }

  // Pattern 2: HTTPS format (https://github.com/owner/repo or https://github.com/owner/repo.git)
  const httpsPattern = /^https:\/\/github\.com\/([^/]+)\/(.+?)(\.git)?$/
  const httpsMatch = trimmedUrl.match(httpsPattern)
  if (httpsMatch) {
    const owner = httpsMatch[1]
    const repo = httpsMatch[2].replace(/\.git$/, '')
    return formatParsedUrl(owner, repo)
  }

  // Pattern 3: github.com/owner/repo
  const domainPattern = /^github\.com\/([^/]+)\/(.+?)(\.git)?$/
  const domainMatch = trimmedUrl.match(domainPattern)
  if (domainMatch) {
    const owner = domainMatch[1]
    const repo = domainMatch[2].replace(/\.git$/, '')
    return formatParsedUrl(owner, repo)
  }

  // Pattern 4: owner/repo
  const shortPattern = /^([^/]+)\/([^/]+?)(\.git)?$/
  const shortMatch = trimmedUrl.match(shortPattern)
  if (shortMatch) {
    const owner = shortMatch[1]
    const repo = shortMatch[2].replace(/\.git$/, '')
    return formatParsedUrl(owner, repo)
  }

  return null
}

/**
 * Format the parsed components into a standardized object
 */
function formatParsedUrl(owner: string, repo: string): ParsedGitUrl {
  return {
    owner,
    repo,
    fullUrl: `https://github.com/${owner}/${repo}`,
    sshUrl: `git@github.com:${owner}/${repo}.git`,
    httpsUrl: `https://github.com/${owner}/${repo}.git`,
  }
}

/**
 * Validate a Git URL
 */
export function isValidGitUrl(url: string): boolean {
  return parseGitUrl(url) !== null
}
