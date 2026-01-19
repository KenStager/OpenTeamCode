/**
 * Azure DevOps authentication management
 * Supports PAT tokens from environment variables or config
 */

import { findAiFolder, loadConfig } from "../util/config"

export interface AdoCredentials {
  pat: string
  organization: string
  project: string
}

export interface AdoAuthConfig {
  organization?: string
  project?: string
  pat_env?: string
}

/**
 * Type guard for AdoAuthConfig
 */
function isAdoAuthConfig(value: unknown): value is AdoAuthConfig {
  if (typeof value !== "object" || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    (obj.organization === undefined || typeof obj.organization === "string") &&
    (obj.project === undefined || typeof obj.project === "string") &&
    (obj.pat_env === undefined || typeof obj.pat_env === "string")
  )
}

/**
 * Error thrown when authentication fails
 */
export class AdoAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AdoAuthError"
  }
}

/**
 * Parse Azure DevOps organization and project from a git remote URL
 * Supports both HTTPS and SSH formats:
 * - https://dev.azure.com/{org}/{project}/_git/{repo}
 * - https://{org}@dev.azure.com/{org}/{project}/_git/{repo}
 * - git@ssh.dev.azure.com:v3/{org}/{project}/{repo}
 */
export function parseAdoRemoteUrl(url: string): { organization: string; project: string } | null {
  // HTTPS format: https://dev.azure.com/{org}/{project}/_git/{repo}
  const httpsMatch = url.match(/https:\/\/(?:[^@]+@)?dev\.azure\.com\/([^/]+)\/([^/]+)\/_git/)
  if (httpsMatch) {
    return { organization: httpsMatch[1], project: httpsMatch[2] }
  }

  // SSH format: git@ssh.dev.azure.com:v3/{org}/{project}/{repo}
  const sshMatch = url.match(/git@ssh\.dev\.azure\.com:v3\/([^/]+)\/([^/]+)\//)
  if (sshMatch) {
    return { organization: sshMatch[1], project: sshMatch[2] }
  }

  // Visual Studio Online legacy format: https://{org}.visualstudio.com/{project}/_git/{repo}
  const vsoMatch = url.match(/https:\/\/([^.]+)\.visualstudio\.com\/([^/]+)\/_git/)
  if (vsoMatch) {
    return { organization: vsoMatch[1], project: vsoMatch[2] }
  }

  return null
}

// Timeout for git subprocess operations (5 seconds)
const GIT_TIMEOUT_MS = 5000

/**
 * Try to detect ADO organization and project from git remotes
 */
async function detectFromGitRemote(): Promise<{ organization: string; project: string } | null> {
  try {
    // Run git command with timeout
    const proc = Bun.spawn(["git", "remote", "-v"], {
      stdout: "pipe",
      stderr: "pipe",
    })

    // Create a timeout promise
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        proc.kill()
        resolve(null)
      }, GIT_TIMEOUT_MS)
    })

    // Race between process completion and timeout
    const result = await Promise.race([
      (async () => {
        const output = await new Response(proc.stdout).text()
        const exitCode = await proc.exited
        return { output, exitCode }
      })(),
      timeoutPromise,
    ])

    // Check if we timed out
    if (!result) {
      return null
    }

    // Check if git command succeeded before processing output
    if (result.exitCode !== 0) {
      return null
    }

    const output = result.output

    // Parse remote URLs, looking for ADO patterns
    for (const line of output.split("\n")) {
      const match = line.match(/\s+(https?:\/\/[^\s]+|git@[^\s]+)\s+/)
      if (match) {
        const parsed = parseAdoRemoteUrl(match[1])
        if (parsed) {
          return parsed
        }
      }
    }
  } catch {
    // Git not available or not in a repo
  }
  return null
}

/**
 * Get ADO credentials from config and environment
 */
export async function getAdoCredentials(adoConfig?: AdoAuthConfig): Promise<AdoCredentials> {
  // 1. Get PAT from environment (default: ADO_PAT)
  const patEnvVar = adoConfig?.pat_env || "ADO_PAT"
  const pat = process.env[patEnvVar]

  if (!pat) {
    throw new AdoAuthError(
      `Azure DevOps PAT not found. Set the ${patEnvVar} environment variable.\n` +
        "Generate a PAT at: https://dev.azure.com/{org}/_usersSettings/tokens"
    )
  }

  // 2. Get organization and project from config, or detect from git remote
  let organization = adoConfig?.organization
  let project = adoConfig?.project

  if (!organization || !project) {
    const detected = await detectFromGitRemote()
    if (detected) {
      organization = organization || detected.organization
      project = project || detected.project
    }
  }

  if (!organization) {
    throw new AdoAuthError(
      "Azure DevOps organization not configured.\n" +
        "Set 'ado.organization' in .ai/config.yaml or ensure you're in a git repo with an ADO remote."
    )
  }

  if (!project) {
    throw new AdoAuthError(
      "Azure DevOps project not configured.\n" +
        "Set 'ado.project' in .ai/config.yaml or ensure you're in a git repo with an ADO remote."
    )
  }

  return { pat, organization, project }
}

/**
 * Load ADO credentials from .ai/config.yaml and environment
 */
export async function loadAdoCredentials(): Promise<AdoCredentials> {
  // Try to load config from .ai/config.yaml
  const aiPath = await findAiFolder()
  let adoConfig: AdoAuthConfig | undefined

  if (aiPath) {
    const config = await loadConfig(aiPath)
    if (config?.ado && isAdoAuthConfig(config.ado)) {
      adoConfig = config.ado
    }
  }

  return getAdoCredentials(adoConfig)
}

/**
 * Create the Authorization header for ADO API calls
 * ADO uses Basic auth with empty username and PAT as password
 */
export function createAuthHeader(pat: string): string {
  const encoded = Buffer.from(`:${pat}`).toString("base64")
  return `Basic ${encoded}`
}
