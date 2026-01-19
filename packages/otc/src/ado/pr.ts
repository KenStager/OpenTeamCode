/**
 * High-level PR operations for Azure DevOps
 * Provides convenience methods built on top of the AdoClient
 */

import { AdoClient, AdoApiError } from "./client"
import type {
  GitPullRequest,
  CommentThread,
  GitPullRequestChange,
  GitPullRequestIteration,
  CreateThreadRequest,
} from "./types"

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

/**
 * AI-generated content marker to identify our comments
 */
const AI_COMMENT_MARKER = "<!-- OpenTeamCode AI -->"
const AI_REVIEW_TITLE = "AI Review (OpenTeamCode)"
const AI_SUMMARY_MARKER = "<!-- OTC-Summary -->"
const AI_TESTPLAN_MARKER = "<!-- OTC-Testplan -->"
const AI_WORKLOG_MARKER = "<!-- OTC-Worklog -->"

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Get comprehensive PR details including threads, iterations, and changes
 */
export async function getPullRequestDetails(
  client: AdoClient,
  pullRequestId: number
): Promise<PullRequestDetails> {
  // Get the PR first
  const pr = await client.getPullRequest(pullRequestId)
  const repositoryId = pr.repository.id

  // Get threads, iterations, and changes in parallel
  const [threads, iterations] = await Promise.all([
    client.getThreads(pullRequestId, repositoryId),
    client.getIterations(pullRequestId, repositoryId),
  ])

  // Get changes from the latest iteration
  let changes: GitPullRequestChange[] = []
  if (iterations.length > 0) {
    const latestIteration = iterations[iterations.length - 1]
    changes = await client.getIterationChanges(pullRequestId, repositoryId, latestIteration.id)
  }

  return { pr, threads, iterations, changes, repositoryId }
}

/**
 * Get commit messages for a PR
 */
export async function getCommitMessages(
  client: AdoClient,
  pullRequestId: number,
  repositoryId: string
): Promise<string[]> {
  const iterations = await client.getIterations(pullRequestId, repositoryId)

  return iterations.map((it) => it.description || "").filter((msg) => msg.length > 0)
}

/**
 * Format file changes as a readable list
 */
export function formatChangeList(changes: GitPullRequestChange[]): string {
  if (changes.length === 0) {
    return "No file changes"
  }

  const lines: string[] = []
  for (const change of changes) {
    const path = change.item.path
    const type = change.changeType
    const symbol = type === "add" ? "+" : type === "delete" ? "-" : "~"
    lines.push(`${symbol} ${path}`)
  }
  return lines.join("\n")
}

/**
 * Update PR description with AI-generated summary
 */
export async function updatePRDescription(
  client: AdoClient,
  pullRequestId: number,
  repositoryId: string,
  summary: string
): Promise<GitPullRequest> {
  // Get current PR to preserve existing description
  const pr = await client.getPullRequest(pullRequestId)

  // Check if there's already an AI summary section
  let newDescription: string
  if (pr.description?.includes(AI_SUMMARY_MARKER)) {
    // Replace existing AI summary (escape marker for safe regex usage)
    const escapedMarker = escapeRegex(AI_SUMMARY_MARKER)
    newDescription = pr.description.replace(
      new RegExp(`${escapedMarker}[\\s\\S]*?${escapedMarker}`, "g"),
      `${AI_SUMMARY_MARKER}\n${summary}\n${AI_SUMMARY_MARKER}`
    )
  } else if (pr.description) {
    // Append AI summary to existing description
    newDescription = `${pr.description}\n\n---\n\n${AI_SUMMARY_MARKER}\n${summary}\n${AI_SUMMARY_MARKER}`
  } else {
    // New description
    newDescription = `${AI_SUMMARY_MARKER}\n${summary}\n${AI_SUMMARY_MARKER}`
  }

  return client.updatePullRequest(pullRequestId, repositoryId, {
    description: newDescription,
  })
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

  // Check if there's an existing AI review thread to update
  const threads = await client.getThreads(pullRequestId, repositoryId)
  const existingThread = threads.find(
    (t) =>
      t.comments.length > 0 &&
      t.comments[0].content.includes(AI_COMMENT_MARKER) &&
      t.comments[0].content.includes(AI_REVIEW_TITLE)
  )

  if (existingThread) {
    // Add a new comment to the existing thread
    await client.addComment(pullRequestId, repositoryId, existingThread.id, fullContent)
    return existingThread
  } else {
    // Create a new thread
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

  // Check if there's an existing test plan to update
  const threads = await client.getThreads(pullRequestId, repositoryId)
  const existingThread = threads.find(
    (t) => t.comments.length > 0 && t.comments[0].content.includes(AI_TESTPLAN_MARKER)
  )

  if (existingThread) {
    // Add updated test plan to existing thread
    await client.addComment(pullRequestId, repositoryId, existingThread.id, fullContent)
    return existingThread
  } else {
    // Create new thread
    const thread: CreateThreadRequest = {
      comments: [{ content: fullContent }],
      status: "active",
    }
    return client.createThread(pullRequestId, repositoryId, thread)
  }
}

/**
 * Post or update a session worklog comment
 */
export async function postSessionWorklog(
  client: AdoClient,
  pullRequestId: number,
  repositoryId: string,
  sessionId: string,
  sessionSummary: string
): Promise<CommentThread> {
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC"

  const fullContent = `${AI_COMMENT_MARKER}
${AI_WORKLOG_MARKER}
## 📝 AI Worklog (OpenTeamCode)

**Session**: \`${sessionId}\`
**Linked**: ${timestamp}

${sessionSummary}
${AI_WORKLOG_MARKER}`

  // Check if there's an existing worklog
  const threads = await client.getThreads(pullRequestId, repositoryId)
  const existingThread = threads.find(
    (t) => t.comments.length > 0 && t.comments[0].content.includes(AI_WORKLOG_MARKER)
  )

  if (existingThread) {
    // Add to existing worklog thread
    await client.addComment(pullRequestId, repositoryId, existingThread.id, fullContent)
    return existingThread
  } else {
    // Create new worklog thread
    const thread: CreateThreadRequest = {
      comments: [{ content: fullContent }],
      status: "active",
    }
    return client.createThread(pullRequestId, repositoryId, thread)
  }
}

/**
 * Get human feedback since the last AI review
 */
export async function getHumanFeedbackSinceLastReview(
  client: AdoClient,
  pullRequestId: number,
  repositoryId: string
): Promise<{
  lastAIReviewDate: Date | null
  humanComments: Array<{
    threadId: number
    author: string
    content: string
    date: Date
    filePath?: string
  }>
}> {
  const threads = await client.getThreads(pullRequestId, repositoryId)

  // Find the last AI review date
  let lastAIReviewDate: Date | null = null
  for (const thread of threads) {
    for (const comment of thread.comments) {
      if (comment.content.includes(AI_COMMENT_MARKER) && comment.content.includes(AI_REVIEW_TITLE)) {
        const date = new Date(comment.publishedDate)
        if (!lastAIReviewDate || date > lastAIReviewDate) {
          lastAIReviewDate = date
        }
      }
    }
  }

  // Collect human comments after the last AI review
  const humanComments: Array<{
    threadId: number
    author: string
    content: string
    date: Date
    filePath?: string
  }> = []

  for (const thread of threads) {
    for (const comment of thread.comments) {
      // Skip AI comments
      if (comment.content.includes(AI_COMMENT_MARKER)) continue

      // Skip system comments
      if (comment.commentType === "system") continue

      const commentDate = new Date(comment.publishedDate)

      // If we have a last AI review, only include comments after it
      if (lastAIReviewDate && commentDate <= lastAIReviewDate) continue

      humanComments.push({
        threadId: thread.id,
        author: comment.author.displayName,
        content: comment.content,
        date: commentDate,
        filePath: thread.threadContext?.filePath,
      })
    }
  }

  // Sort by date
  humanComments.sort((a, b) => a.date.getTime() - b.date.getTime())

  return { lastAIReviewDate, humanComments }
}

/**
 * Summarize changes for LLM processing
 */
export function summarizeChangesForLLM(details: PullRequestDetails): string {
  const { pr, changes, iterations } = details

  const sections: string[] = []

  // PR metadata
  sections.push(`## Pull Request #${pr.pullRequestId}: ${pr.title}`)
  sections.push(`- **Author**: ${pr.createdBy.displayName}`)
  sections.push(`- **Status**: ${pr.status}`)
  sections.push(`- **Source**: ${pr.sourceRefName.replace("refs/heads/", "")}`)
  sections.push(`- **Target**: ${pr.targetRefName.replace("refs/heads/", "")}`)

  // Existing description
  if (pr.description) {
    sections.push(`\n## Current Description\n${pr.description}`)
  }

  // File changes
  sections.push(`\n## Files Changed (${changes.length})`)
  for (const change of changes) {
    const type = change.changeType
    const symbol = type === "add" ? "A" : type === "delete" ? "D" : "M"
    sections.push(`- [${symbol}] ${change.item.path}`)
  }

  // Commit messages from iterations
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
 * Post a comment as plain text (for dry-run output)
 */
export async function postComment(
  client: AdoClient,
  pullRequestId: number,
  repositoryId: string,
  content: string
): Promise<CommentThread> {
  const thread: CreateThreadRequest = {
    comments: [{ content }],
    status: "active",
  }
  return client.createThread(pullRequestId, repositoryId, thread)
}
