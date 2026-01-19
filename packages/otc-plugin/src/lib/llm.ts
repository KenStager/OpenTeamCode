/**
 * LLM integration for OpenTeamCode Plugin
 * Uses Anthropic's Claude for AI-powered PR analysis
 */

import Anthropic from "@anthropic-ai/sdk"
import type { Config } from "./config"

const DEFAULT_MODEL = "claude-sonnet-4-20250514"
const DEFAULT_API_KEY_ENV = "ANTHROPIC_API_KEY"
const DEFAULT_TIMEOUT_MS = 120000
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY_MS = 1000
const MAX_CONTEXT_LENGTH = 100000 // ~100KB - prevents memory exhaustion

/**
 * Sanitize user-provided content to prevent prompt injection attacks
 */
function sanitizeUserContent(content: string): string {
  let sanitized = content
    .replace(/<system>/gi, "&lt;system&gt;")
    .replace(/<\/system>/gi, "&lt;/system&gt;")
    .replace(/<user>/gi, "&lt;user&gt;")
    .replace(/<\/user>/gi, "&lt;/user&gt;")
    .replace(/<assistant>/gi, "&lt;assistant&gt;")
    .replace(/<\/assistant>/gi, "&lt;/assistant&gt;")
    .replace(/<human>/gi, "&lt;human&gt;")
    .replace(/<\/human>/gi, "&lt;/human&gt;")

  sanitized = sanitized
    .replace(/\bignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi, "[REDACTED]")
    .replace(/\byou\s+are\s+now\s+/gi, "[REDACTED]")
    .replace(/\bforget\s+(all\s+)?(previous|your)\s+/gi, "[REDACTED]")
    .replace(/\bact\s+as\s+(if\s+)?(you\s+are\s+)?/gi, "[REDACTED]")
    .replace(/\bnew\s+instructions?:\s*/gi, "[REDACTED]")

  return sanitized
}

/**
 * Truncate content to maximum allowed length with a note about truncation.
 * Returns { content: truncated content, wasTruncated: boolean }
 */
function truncateContent(content: string, maxLength: number = MAX_CONTEXT_LENGTH): { content: string; wasTruncated: boolean } {
  if (content.length <= maxLength) {
    return { content, wasTruncated: false }
  }

  const truncated = content.slice(0, maxLength)
  const truncationNote = `\n\n[CONTENT TRUNCATED: Original length ${content.length} characters, truncated to ${maxLength} characters]`
  return {
    content: truncated + truncationNote,
    wasTruncated: true
  }
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Execute a function with retry logic and exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  initialDelayMs: number = INITIAL_RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      const isRetryable =
        error instanceof Error &&
        (error.message.includes("rate_limit") ||
          error.message.includes("overloaded") ||
          error.message.includes("529") ||
          error.message.includes("503") ||
          error.message.includes("timeout") ||
          error.message.includes("ECONNRESET") ||
          error.message.includes("ETIMEDOUT"))

      if (!isRetryable || attempt === maxRetries) {
        throw error
      }

      const delay = initialDelayMs * Math.pow(2, attempt) + Math.random() * 1000
      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * LLM client for generating PR analysis
 */
export class LLMClient {
  private client: Anthropic
  private model: string

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({
      apiKey,
      timeout: DEFAULT_TIMEOUT_MS,
    })
    this.model = model || DEFAULT_MODEL
  }

  getModel(): string {
    return this.model
  }

  async generateSummary(prContext: string): Promise<string> {
    const systemPrompt = `You are a senior software engineer helping to write clear, informative PR descriptions.
Your task is to analyze the PR changes and generate a well-structured summary.

Output format (use markdown):
## Summary
Brief description of what this PR does (1-2 sentences)

## Changes by Area
- **Area 1**: Description of changes
- **Area 2**: Description of changes
(Group related changes logically)

## Risks
- Any potential risks or areas needing careful review
- If no significant risks, say "No significant risks identified"

## Test Coverage
Notes on what testing is recommended

Guidelines:
- Be concise but informative
- Focus on the "why" and impact, not just the "what"
- Highlight breaking changes if any
- Keep technical jargon appropriate for a developer audience`

    // Truncate before sanitization to prevent memory exhaustion
    const { content: truncatedContext, wasTruncated } = truncateContent(prContext)
    const sanitizedContext = sanitizeUserContent(truncatedContext)

    const userMessage = wasTruncated
      ? `Please generate a PR summary for the following changes (note: content was truncated due to size):\n\n${sanitizedContext}`
      : `Please generate a PR summary for the following changes:\n\n${sanitizedContext}`

    const response = await withRetry(() =>
      this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      })
    )

    const textContent = response.content.find((c) => c.type === "text")
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from LLM")
    }

    return textContent.text
  }

  async generateReview(prContext: string, rubric?: string): Promise<string> {
    let systemPrompt = `You are a thorough code reviewer. Your task is to review the PR changes and provide actionable feedback.

Output format (use markdown, no outer heading needed - start directly with Summary):

### Summary
Brief overall assessment (1-2 sentences)

### Findings

#### 🔴 Critical
Issues that must be fixed before merging.
Format: - **file:line**: Description
(If none, omit this section)

#### 🟡 Warning
Issues that should be addressed but aren't blockers.
Format: - **file:line**: Description
(If none, omit this section)

#### 💡 Suggestion
Optional improvements and best practices.
Format: - **file:line**: Description
(If none, omit this section)

Guidelines:
- Be specific with file paths and line numbers when possible
- Focus on: bugs, security issues, performance, maintainability, error handling
- Don't nitpick style issues unless they impact readability
- Be constructive and explain why something is an issue
- Acknowledge good patterns you see`

    if (rubric) {
      // Truncate rubric to reasonable size (10KB max)
      const { content: truncatedRubric } = truncateContent(rubric, 10000)
      const sanitizedRubric = sanitizeUserContent(truncatedRubric)
      systemPrompt += `\n\n## Team Review Rubric\nAlso evaluate against these team-specific criteria:\n\n${sanitizedRubric}`
    }

    // Truncate before sanitization to prevent memory exhaustion
    const { content: truncatedContext, wasTruncated } = truncateContent(prContext)
    const sanitizedContext = sanitizeUserContent(truncatedContext)

    const userMessage = wasTruncated
      ? `Please review the following PR (note: content was truncated due to size):\n\n${sanitizedContext}`
      : `Please review the following PR:\n\n${sanitizedContext}`

    const response = await withRetry(() =>
      this.client.messages.create({
        model: this.model,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      })
    )

    const textContent = response.content.find((c) => c.type === "text")
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from LLM")
    }

    return textContent.text
  }

  async generateTestPlan(prContext: string): Promise<string> {
    const systemPrompt = `You are a QA engineer helping to create risk-based test plans for code changes.

Output format (use markdown, no outer heading needed - start directly with Risk Assessment):

### Risk Assessment
| Area | Risk Level | Rationale |
|------|------------|-----------|
| Area name | High/Medium/Low | Why this area needs testing |

### Automated Tests
- [ ] Specific test suite or test case to run
- [ ] Another automated test recommendation

### Manual Testing
1. Specific manual test step
2. Another test step
(Include expected outcomes)

### Regression Concerns
- Areas that might be indirectly affected
- Components that share dependencies with changed code

Guidelines:
- Focus on what could break
- Prioritize by risk level
- Be specific about test scenarios
- Consider edge cases and error conditions
- Think about integration points`

    // Truncate before sanitization to prevent memory exhaustion
    const { content: truncatedContext, wasTruncated } = truncateContent(prContext)
    const sanitizedContext = sanitizeUserContent(truncatedContext)

    const userMessage = wasTruncated
      ? `Please create a test plan for the following PR (note: content was truncated due to size):\n\n${sanitizedContext}`
      : `Please create a test plan for the following PR:\n\n${sanitizedContext}`

    const response = await withRetry(() =>
      this.client.messages.create({
        model: this.model,
        max_tokens: 3000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      })
    )

    const textContent = response.content.find((c) => c.type === "text")
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from LLM")
    }

    return textContent.text
  }
}

/**
 * Create an LLM client from configuration
 */
export function createLLMClient(config: Config | null): LLMClient {
  const apiKeyEnv = config?.llm?.api_key_env || DEFAULT_API_KEY_ENV
  const apiKey = process.env[apiKeyEnv]

  if (!apiKey) {
    throw new Error(
      `Anthropic API key not found. Set the ${apiKeyEnv} environment variable.\n` +
        "Get an API key at: https://console.anthropic.com/"
    )
  }

  const model = config?.llm?.model || DEFAULT_MODEL

  return new LLMClient(apiKey, model)
}
