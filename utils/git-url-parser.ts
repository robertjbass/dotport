/**
 * Git URL Parser - parses GitHub URLs into standardized format
 */

export type ParsedGitUrl = {
  owner: string
  repo: string
  fullUrl: string
  sshUrl: string
  httpsUrl: string
}

/**
 * Supported formats:
 * - git@github.com:owner/repo.git
 * - https://github.com/owner/repo.git
 * - https://github.com/owner/repo
 * - github.com/owner/repo
 * - owner/repo
 */
export function parseGitUrl(url: string): ParsedGitUrl | null {
  const trimmedUrl = url.trim()

  // SSH format
  const sshPattern = /^git@github\.com:([^/]+)\/(.+?)(\.git)?$/
  const sshMatch = trimmedUrl.match(sshPattern)
  if (sshMatch) {
    return formatParsedUrl(sshMatch[1], sshMatch[2].replace(/\.git$/, ''))
  }

  // HTTPS format
  const httpsPattern = /^https:\/\/github\.com\/([^/]+)\/(.+?)(\.git)?$/
  const httpsMatch = trimmedUrl.match(httpsPattern)
  if (httpsMatch) {
    return formatParsedUrl(httpsMatch[1], httpsMatch[2].replace(/\.git$/, ''))
  }

  // github.com/owner/repo
  const domainPattern = /^github\.com\/([^/]+)\/(.+?)(\.git)?$/
  const domainMatch = trimmedUrl.match(domainPattern)
  if (domainMatch) {
    return formatParsedUrl(domainMatch[1], domainMatch[2].replace(/\.git$/, ''))
  }

  // owner/repo
  const shortPattern = /^([^/]+)\/([^/]+?)(\.git)?$/
  const shortMatch = trimmedUrl.match(shortPattern)
  if (shortMatch) {
    return formatParsedUrl(shortMatch[1], shortMatch[2].replace(/\.git$/, ''))
  }

  return null
}

function formatParsedUrl(owner: string, repo: string): ParsedGitUrl {
  return {
    owner,
    repo,
    fullUrl: `https://github.com/${owner}/${repo}`,
    sshUrl: `git@github.com:${owner}/${repo}.git`,
    httpsUrl: `https://github.com/${owner}/${repo}.git`,
  }
}

export function isValidGitUrl(url: string): boolean {
  return parseGitUrl(url) !== null
}
