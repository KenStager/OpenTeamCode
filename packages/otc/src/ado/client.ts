/**
 * Azure DevOps REST API client
 * Implements core API operations for PR workflows
 */

import { createAuthHeader, type AdoCredentials } from "./auth"
import type {
  GitPullRequest,
  CommentThread,
  GitPullRequestIteration,
  GitPullRequestChange,
  CreateThreadRequest,
  UpdatePullRequestRequest,
  AddLabelRequest,
  ApiResponse,
  AdoError,
} from "./types"

const ADO_API_VERSION = "7.1"
const DEFAULT_TIMEOUT = 30000
const MAX_ERROR_MESSAGE_LENGTH = 500

/**
 * Sanitize error messages to avoid exposing sensitive data
 */
function sanitizeErrorMessage(message: string): string {
  // Truncate long messages
  let sanitized = message.length > MAX_ERROR_MESSAGE_LENGTH
    ? message.slice(0, MAX_ERROR_MESSAGE_LENGTH) + "..."
    : message

  // Remove potential secrets patterns (tokens, keys, etc.)
  sanitized = sanitized
    .replace(/Bearer\s+[A-Za-z0-9\-_\.]+/gi, "Bearer [REDACTED]")
    .replace(/Basic\s+[A-Za-z0-9+/=]+/gi, "Basic [REDACTED]")
    .replace(/token[=:]\s*["']?[A-Za-z0-9\-_\.]+["']?/gi, "token=[REDACTED]")
    .replace(/password[=:]\s*["']?[^\s"']+["']?/gi, "password=[REDACTED]")
    .replace(/secret[=:]\s*["']?[^\s"']+["']?/gi, "secret=[REDACTED]")
    .replace(/key[=:]\s*["']?[A-Za-z0-9\-_\.]{20,}["']?/gi, "key=[REDACTED]")

  return sanitized
}

export interface AdoClientOptions {
  timeout?: number
}

/**
 * Error thrown when ADO API calls fail
 */
export class AdoApiError extends Error {
  statusCode: number
  errorCode?: number

  constructor(message: string, statusCode: number, errorCode?: number) {
    super(message)
    this.name = "AdoApiError"
    this.statusCode = statusCode
    this.errorCode = errorCode
  }
}

/**
 * Azure DevOps API client
 */
export class AdoClient {
  private baseUrl: string
  private authHeader: string
  private timeout: number

  constructor(credentials: AdoCredentials, options: AdoClientOptions = {}) {
    this.baseUrl = `https://dev.azure.com/${credentials.organization}/${credentials.project}/_apis`
    this.authHeader = createAuthHeader(credentials.pat)
    this.timeout = options.timeout || DEFAULT_TIMEOUT
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    path: string,
    options: RequestInit & { query?: Record<string, string> } = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`)

    // Add API version to all requests
    url.searchParams.set("api-version", ADO_API_VERSION)

    // Add any additional query parameters
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

    // Handle errors
    if (!response.ok) {
      let errorMessage = `ADO API error: ${response.status} ${response.statusText}`
      let errorCode: number | undefined

      try {
        const errorBody = (await response.json()) as AdoError
        if (errorBody.message) {
          // Sanitize error message to avoid exposing sensitive data
          errorMessage = sanitizeErrorMessage(errorBody.message)
          errorCode = errorBody.errorCode
        }
      } catch {
        // Could not parse error body
      }

      throw new AdoApiError(errorMessage, response.status, errorCode)
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }

  // ============================================================
  // Pull Request Operations
  // ============================================================

  /**
   * Get a pull request by ID
   */
  async getPullRequest(pullRequestId: number, repositoryId?: string): Promise<GitPullRequest> {
    const repoPath = repositoryId ? `/git/repositories/${repositoryId}` : "/git/pullrequests"
    return this.request<GitPullRequest>(`${repoPath}/pullrequests/${pullRequestId}`)
  }

  /**
   * List pull requests
   */
  async listPullRequests(options?: {
    repositoryId?: string
    status?: "active" | "abandoned" | "completed" | "all"
    creatorId?: string
    reviewerId?: string
    top?: number
    skip?: number
  }): Promise<GitPullRequest[]> {
    const query: Record<string, string> = {}
    if (options?.status) query["searchCriteria.status"] = options.status
    if (options?.creatorId) query["searchCriteria.creatorId"] = options.creatorId
    if (options?.reviewerId) query["searchCriteria.reviewerId"] = options.reviewerId
    if (options?.top) query["$top"] = String(options.top)
    if (options?.skip) query["$skip"] = String(options.skip)

    const repoPath = options?.repositoryId
      ? `/git/repositories/${options.repositoryId}/pullrequests`
      : "/git/pullrequests"

    const response = await this.request<ApiResponse<GitPullRequest[]>>(repoPath, { query })
    return response.value
  }

  /**
   * Update a pull request (title, description, status)
   */
  async updatePullRequest(
    pullRequestId: number,
    repositoryId: string,
    update: UpdatePullRequestRequest
  ): Promise<GitPullRequest> {
    return this.request<GitPullRequest>(
      `/git/repositories/${repositoryId}/pullrequests/${pullRequestId}`,
      {
        method: "PATCH",
        body: JSON.stringify(update),
      }
    )
  }

  // ============================================================
  // Comment Thread Operations
  // ============================================================

  /**
   * Get all comment threads for a pull request
   */
  async getThreads(
    pullRequestId: number,
    repositoryId: string,
    options?: { iteration?: number }
  ): Promise<CommentThread[]> {
    const query: Record<string, string> = {}
    if (options?.iteration) query["$iteration"] = String(options.iteration)

    const response = await this.request<ApiResponse<CommentThread[]>>(
      `/git/repositories/${repositoryId}/pullrequests/${pullRequestId}/threads`,
      { query }
    )
    return response.value
  }

  /**
   * Create a new comment thread
   */
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

  /**
   * Update a comment thread (e.g., change status)
   */
  async updateThread(
    pullRequestId: number,
    repositoryId: string,
    threadId: number,
    update: Partial<CommentThread>
  ): Promise<CommentThread> {
    return this.request<CommentThread>(
      `/git/repositories/${repositoryId}/pullrequests/${pullRequestId}/threads/${threadId}`,
      {
        method: "PATCH",
        body: JSON.stringify(update),
      }
    )
  }

  /**
   * Add a comment to an existing thread
   */
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

  // ============================================================
  // Iteration and Change Operations
  // ============================================================

  /**
   * Get iterations (push events) for a pull request
   */
  async getIterations(pullRequestId: number, repositoryId: string): Promise<GitPullRequestIteration[]> {
    const response = await this.request<ApiResponse<GitPullRequestIteration[]>>(
      `/git/repositories/${repositoryId}/pullrequests/${pullRequestId}/iterations`
    )
    return response.value
  }

  /**
   * Get changes in a specific iteration
   */
  async getIterationChanges(
    pullRequestId: number,
    repositoryId: string,
    iterationId: number
  ): Promise<GitPullRequestChange[]> {
    const response = await this.request<ApiResponse<GitPullRequestChange[]>>(
      `/git/repositories/${repositoryId}/pullrequests/${pullRequestId}/iterations/${iterationId}/changes`
    )
    return response.value
  }

  /**
   * Get the diff for a specific file in the PR
   */
  async getFileDiff(
    repositoryId: string,
    baseVersionDescriptor: { versionType: string; version: string },
    targetVersionDescriptor: { versionType: string; version: string },
    path: string
  ): Promise<string> {
    const query: Record<string, string> = {
      "baseVersionDescriptor.versionType": baseVersionDescriptor.versionType,
      "baseVersionDescriptor.version": baseVersionDescriptor.version,
      "targetVersionDescriptor.versionType": targetVersionDescriptor.versionType,
      "targetVersionDescriptor.version": targetVersionDescriptor.version,
      path,
      "diffCommonCommit": "true",
    }

    return this.request<string>(`/git/repositories/${repositoryId}/diffs/commits`, { query })
  }

  // ============================================================
  // Label Operations
  // ============================================================

  /**
   * Add a label to a pull request
   */
  async addLabel(pullRequestId: number, repositoryId: string, label: string): Promise<void> {
    await this.request<void>(
      `/git/repositories/${repositoryId}/pullrequests/${pullRequestId}/labels`,
      {
        method: "POST",
        body: JSON.stringify({ name: label } as AddLabelRequest),
      }
    )
  }

  /**
   * Remove a label from a pull request
   */
  async removeLabel(pullRequestId: number, repositoryId: string, labelId: string): Promise<void> {
    await this.request<void>(
      `/git/repositories/${repositoryId}/pullrequests/${pullRequestId}/labels/${labelId}`,
      { method: "DELETE" }
    )
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  /**
   * Check if the client can connect to ADO
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to list PRs with limit 1 to test auth
      await this.listPullRequests({ top: 1 })
      return true
    } catch {
      return false
    }
  }
}

/**
 * Create an ADO client from credentials
 */
export function createAdoClient(credentials: AdoCredentials, options?: AdoClientOptions): AdoClient {
  return new AdoClient(credentials, options)
}
