/**
 * Azure DevOps REST API client
 * Adapted from packages/otc/src/ado/ for plugin use
 */

import type { Config } from "./config"

const ADO_API_VERSION = "7.1"
const DEFAULT_TIMEOUT = 30000
const MAX_ERROR_MESSAGE_LENGTH = 500

// Type definitions for ADO API

export interface IdentityRef {
  id: string
  displayName: string
  uniqueName: string
  url: string
}

export interface GitRepositoryRef {
  id: string
  name: string
  url: string
  project: { id: string; name: string }
}

export interface GitPullRequest {
  pullRequestId: number
  codeReviewId: number
  status: "active" | "abandoned" | "completed"
  createdBy: IdentityRef
  creationDate: string
  title: string
  description?: string
  sourceRefName: string
  targetRefName: string
  url: string
  repository: GitRepositoryRef
}

export interface CommentThread {
  id: number
  comments: Comment[]
  status: string
  threadContext?: { filePath: string }
}

export interface Comment {
  id: number
  author: IdentityRef
  content: string
  publishedDate: string
  commentType: "text" | "codeChange" | "system"
}

export interface GitPullRequestIteration {
  id: number
  description?: string
  author: IdentityRef
  createdDate: string
}

export interface GitPullRequestChange {
  changeId: number
  item: { path: string }
  changeType: string
}

export interface CreateThreadRequest {
  comments: { content: string }[]
  status?: string
}

export interface AdoCredentials {
  pat: string
  organization: string
  project: string
}

/**
 * Sanitize error messages to avoid exposing sensitive data
 */
function sanitizeErrorMessage(message: string): string {
  let sanitized = message.length > MAX_ERROR_MESSAGE_LENGTH
    ? message.slice(0, MAX_ERROR_MESSAGE_LENGTH) + "..."
    : message

  sanitized = sanitized
    .replace(/Bearer\s+[A-Za-z0-9\-_\.]+/gi, "Bearer [REDACTED]")
    .replace(/Basic\s+[A-Za-z0-9+/=]+/gi, "Basic [REDACTED]")

  return sanitized
}

/**
 * Parse Azure DevOps organization and project from a git remote URL
 */
export function parseAdoRemoteUrl(url: string): { organization: string; project: string } | null {
  const httpsMatch = url.match(/https:\/\/(?:[^@]+@)?dev\.azure\.com\/([^/]+)\/([^/]+)\/_git/)
  if (httpsMatch) {
    return { organization: httpsMatch[1], project: httpsMatch[2] }
  }

  const sshMatch = url.match(/git@ssh\.dev\.azure\.com:v3\/([^/]+)\/([^/]+)\//)
  if (sshMatch) {
    return { organization: sshMatch[1], project: sshMatch[2] }
  }

  const vsoMatch = url.match(/https:\/\/([^.]+)\.visualstudio\.com\/([^/]+)\/_git/)
  if (vsoMatch) {
    return { organization: vsoMatch[1], project: vsoMatch[2] }
  }

  return null
}

/**
 * Azure DevOps API client
 */
export class AdoClient {
  private baseUrl: string
  private authHeader: string
  private timeout: number

  constructor(credentials: AdoCredentials, timeout?: number) {
    this.baseUrl = `https://dev.azure.com/${credentials.organization}/${credentials.project}/_apis`
    this.authHeader = `Basic ${Buffer.from(`:${credentials.pat}`).toString("base64")}`
    this.timeout = timeout || DEFAULT_TIMEOUT
  }

  private async request<T>(
    path: string,
    options: RequestInit & { query?: Record<string, string> } = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`)
    url.searchParams.set("api-version", ADO_API_VERSION)

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        url.searchParams.set(key, value)
      }
    }

    const response = await fetch(url.toString(), {
      ...options,
      signal: AbortSignal.timeout(this.timeout),
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      let errorMessage = `ADO API error: ${response.status} ${response.statusText}`
      try {
        const errorBody = (await response.json()) as { message?: string }
        if (errorBody && typeof errorBody.message === "string") {
          errorMessage = sanitizeErrorMessage(errorBody.message)
        }
      } catch {}
      throw new Error(errorMessage)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }

  async getPullRequest(pullRequestId: number): Promise<GitPullRequest> {
    return this.request<GitPullRequest>(`/git/pullrequests/${pullRequestId}`)
  }

  async getThreads(pullRequestId: number, repositoryId: string): Promise<CommentThread[]> {
    const response = await this.request<{ value: CommentThread[] }>(
      `/git/repositories/${repositoryId}/pullrequests/${pullRequestId}/threads`
    )
    return response.value
  }

  async createThread(
    pullRequestId: number,
    repositoryId: string,
    thread: CreateThreadRequest
  ): Promise<CommentThread> {
    return this.request<CommentThread>(
      `/git/repositories/${repositoryId}/pullrequests/${pullRequestId}/threads`,
      {
        method: "POST",
        body: JSON.stringify(thread),
      }
    )
  }

  async addComment(
    pullRequestId: number,
    repositoryId: string,
    threadId: number,
    content: string
  ): Promise<CommentThread> {
    return this.request<CommentThread>(
      `/git/repositories/${repositoryId}/pullrequests/${pullRequestId}/threads/${threadId}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      }
    )
  }

  async getIterations(pullRequestId: number, repositoryId: string): Promise<GitPullRequestIteration[]> {
    const response = await this.request<{ value: GitPullRequestIteration[] }>(
      `/git/repositories/${repositoryId}/pullrequests/${pullRequestId}/iterations`
    )
    return response.value
  }

  async getIterationChanges(
    pullRequestId: number,
    repositoryId: string,
    iterationId: number
  ): Promise<GitPullRequestChange[]> {
    const response = await this.request<{ value: GitPullRequestChange[] }>(
      `/git/repositories/${repositoryId}/pullrequests/${pullRequestId}/iterations/${iterationId}/changes`
    )
    return response.value
  }

  async updatePullRequest(
    pullRequestId: number,
    repositoryId: string,
    update: { description?: string; title?: string }
  ): Promise<GitPullRequest> {
    return this.request<GitPullRequest>(
      `/git/repositories/${repositoryId}/pullrequests/${pullRequestId}`,
      {
        method: "PATCH",
        body: JSON.stringify(update),
      }
    )
  }
}

/**
 * Aggregated PR details with all relevant information
 */
export interface PullRequestDetails {
  pr: GitPullRequest
  threads: CommentThread[]
  iterations: GitPullRequestIteration[]
  changes: GitPullRequestChange[]
  repositoryId: string
}

const AI_COMMENT_MARKER = "<!-- OpenTeamCode AI -->"
const AI_REVIEW_TITLE = "AI Review (OpenTeamCode)"
const AI_SUMMARY_MARKER = "<!-- OTC-Summary -->"
const AI_TESTPLAN_MARKER = "<!-- OTC-Testplan -->"

/**
 * Get comprehensive PR details
 */
export async function getPullRequestDetails(
  client: AdoClient,
  pullRequestId: number
): Promise<PullRequestDetails> {
  const pr = await client.getPullRequest(pullRequestId)
  const repositoryId = pr.repository.id

  const [threads, iterations] = await Promise.all([
    client.getThreads(pullRequestId, repositoryId),
    client.getIterations(pullRequestId, repositoryId),
  ])

  let changes: GitPullRequestChange[] = []
  if (iterations.length > 0) {
    const latestIteration = iterations[iterations.length - 1]
    changes = await client.getIterationChanges(pullRequestId, repositoryId, latestIteration.id)
  }

  return { pr, threads, iterations, changes, repositoryId }
}

/**
 * Summarize changes for LLM processing
 */
export function summarizeChangesForLLM(details: PullRequestDetails): string {
  const { pr, changes, iterations } = details
  const sections: string[] = []

  sections.push(`## Pull Request #${pr.pullRequestId}: ${pr.title}`)
  sections.push(`- **Author**: ${pr.createdBy.displayName}`)
  sections.push(`- **Status**: ${pr.status}`)
  sections.push(`- **Source**: ${pr.sourceRefName.replace("refs/heads/", "")}`)
  sections.push(`- **Target**: ${pr.targetRefName.replace("refs/heads/", "")}`)

  if (pr.description) {
    sections.push(`\n## Current Description\n${pr.description}`)
  }

  sections.push(`\n## Files Changed (${changes.length})`)
  for (const change of changes) {
    const type = change.changeType
    const symbol = type === "add" ? "A" : type === "delete" ? "D" : "M"
    sections.push(`- [${symbol}] ${change.item.path}`)
  }

  const commitMessages = iterations
    .map((it) => it.description)
    .filter((msg) => msg && msg.length > 0)
  if (commitMessages.length > 0) {
    sections.push(`\n## Commit Messages`)
    for (const msg of commitMessages) {
      sections.push(`- ${msg}`)
    }
  }

  return sections.join("\n")
}

/**
 * Post or update an AI review comment
 */
export async function postAIReview(
  client: AdoClient,
  pullRequestId: number,
  repositoryId: string,
  reviewContent: string,
  model: string
): Promise<CommentThread> {
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC"

  const fullContent = `${AI_COMMENT_MARKER}
## 🤖 ${AI_REVIEW_TITLE}

**Reviewed**: ${timestamp} | **Model**: ${model}

${reviewContent}`

  const threads = await client.getThreads(pullRequestId, repositoryId)
  const existingThread = threads.find(
    (t) =>
      t.comments.length > 0 &&
      t.comments[0].content.includes(AI_COMMENT_MARKER) &&
      t.comments[0].content.includes(AI_REVIEW_TITLE)
  )

  if (existingThread) {
    await client.addComment(pullRequestId, repositoryId, existingThread.id, fullContent)
    return existingThread
  } else {
    const thread: CreateThreadRequest = {
      comments: [{ content: fullContent }],
      status: "active",
    }
    return client.createThread(pullRequestId, repositoryId, thread)
  }
}

/**
 * Post a test plan comment
 */
export async function postTestPlan(
  client: AdoClient,
  pullRequestId: number,
  repositoryId: string,
  testPlanContent: string
): Promise<CommentThread> {
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC"

  const fullContent = `${AI_COMMENT_MARKER}
${AI_TESTPLAN_MARKER}
## 🧪 Test Plan (OpenTeamCode)

**Generated**: ${timestamp}

${testPlanContent}
${AI_TESTPLAN_MARKER}`

  const threads = await client.getThreads(pullRequestId, repositoryId)
  const existingThread = threads.find(
    (t) => t.comments.length > 0 && t.comments[0].content.includes(AI_TESTPLAN_MARKER)
  )

  if (existingThread) {
    await client.addComment(pullRequestId, repositoryId, existingThread.id, fullContent)
    return existingThread
  } else {
    const thread: CreateThreadRequest = {
      comments: [{ content: fullContent }],
      status: "active",
    }
    return client.createThread(pullRequestId, repositoryId, thread)
  }
}

/**
 * Get ADO credentials from config and environment (simple version without git detection)
 */
export async function getAdoCredentialsFromEnv(config: Config | null): Promise<AdoCredentials> {
  const patEnvVar = config?.ado?.pat_env || "ADO_PAT"
  const pat = process.env[patEnvVar]

  if (!pat) {
    throw new Error(
      `Azure DevOps PAT not found. Set the ${patEnvVar} environment variable.\n` +
        "Generate a PAT at: https://dev.azure.com/{org}/_usersSettings/tokens"
    )
  }

  const organization = config?.ado?.organization
  const project = config?.ado?.project

  if (!organization) {
    throw new Error(
      "Azure DevOps organization not configured.\n" +
        "Set 'ado.organization' in .ai/config.yaml"
    )
  }

  if (!project) {
    throw new Error(
      "Azure DevOps project not configured.\n" +
        "Set 'ado.project' in .ai/config.yaml"
    )
  }

  return { pat, organization, project }
}
