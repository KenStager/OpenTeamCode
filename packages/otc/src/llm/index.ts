/**
 * LLM integration for OpenTeamCode
 * Uses Anthropic's Claude for AI-powered PR analysis
 */

import Anthropic from "@anthropic-ai/sdk"
import { findAiFolder, loadConfig } from "../util/config"

export interface LLMConfig {
  provider?: string
  model?: string
  api_key_env?: string
}

const DEFAULT_MODEL = "claude-sonnet-4-20250514"
const DEFAULT_API_KEY_ENV = "ANTHROPIC_API_KEY"
const DEFAULT_TIMEOUT_MS = 120000 // 2 minutes
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY_MS = 1000

/**
 * Sanitize user-provided content to prevent prompt injection attacks.
 * This escapes patterns that could be interpreted as system instructions.
 */
function sanitizeUserContent(content: string): string {
  // Escape XML-like tags that could be interpreted as prompt delimiters
  let sanitized = content
    .replace(/<system>/gi, "&lt;system&gt;")
    .replace(/<\/system>/gi, "&lt;/system&gt;")
    .replace(/<user>/gi, "&lt;user&gt;")
    .replace(/<\/user>/gi, "&lt;/user&gt;")
    .replace(/<assistant>/gi, "&lt;assistant&gt;")
    .replace(/<\/assistant>/gi, "&lt;/assistant&gt;")
    .replace(/<human>/gi, "&lt;human&gt;")
    .replace(/<\/human>/gi, "&lt;/human&gt;")

  // Escape common prompt injection patterns
  sanitized = sanitized
    .replace(/\bignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi, "[REDACTED]")
    .replace(/\byou\s+are\s+now\s+/gi, "[REDACTED]")
    .replace(/\bforget\s+(all\s+)?(previous|your)\s+/gi, "[REDACTED]")
    .replace(/\bact\s+as\s+(if\s+)?(you\s+are\s+)?/gi, "[REDACTED]")
    .replace(/\bnew\s+instructions?:\s*/gi, "[REDACTED]")

  return sanitized
}

/**
 * Error thrown when LLM operations fail
 */
export class LLMError extends Error {
  isRetryable: boolean

  constructor(message: string, isRetryable: boolean = false) {
    super(message)
    this.name = "LLMError"
    this.isRetryable = isRetryable
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

      // Check if error is retryable (rate limit, overload, network issues)
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

      // Exponential backoff with jitter
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
  private timeoutMs: number

  constructor(apiKey: string, model?: string, timeoutMs?: number) {
    this.client = new Anthropic({
      apiKey,
      timeout: timeoutMs || DEFAULT_TIMEOUT_MS,
    })
    this.model = model || DEFAULT_MODEL
    this.timeoutMs = timeoutMs || DEFAULT_TIMEOUT_MS
  }

  /**
   * Get the model being used
   */
  getModel(): string {
    return this.model
  }

  /**
   * Generate a PR summary
   */
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

    // Sanitize user-provided content to prevent prompt injection
    const sanitizedContext = sanitizeUserContent(prContext)

    const response = await withRetry(() =>
      this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Please generate a PR summary for the following changes:\n\n${sanitizedContext}`,
          },
        ],
      })
    )

    const textContent = response.content.find((c) => c.type === "text")
    if (!textContent || textContent.type !== "text") {
      throw new LLMError("No text response from LLM")
    }

    return textContent.text
  }

  /**
   * Generate a code review
   */
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
      // Rubric is trusted content from .ai/review.md, but sanitize anyway for defense in depth
      const sanitizedRubric = sanitizeUserContent(rubric)
      systemPrompt += `\n\n## Team Review Rubric\nAlso evaluate against these team-specific criteria:\n\n${sanitizedRubric}`
    }

    // Sanitize user-provided content to prevent prompt injection
    const sanitizedContext = sanitizeUserContent(prContext)

    const response = await withRetry(() =>
      this.client.messages.create({
        model: this.model,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Please review the following PR:\n\n${sanitizedContext}`,
          },
        ],
      })
    )

    const textContent = response.content.find((c) => c.type === "text")
    if (!textContent || textContent.type !== "text") {
      throw new LLMError("No text response from LLM")
    }

    return textContent.text
  }

  /**
   * Generate a test plan
   */
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

    // Sanitize user-provided content to prevent prompt injection
    const sanitizedContext = sanitizeUserContent(prContext)

    const response = await withRetry(() =>
      this.client.messages.create({
        model: this.model,
        max_tokens: 3000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Please create a test plan for the following PR:\n\n${sanitizedContext}`,
          },
        ],
      })
    )

    const textContent = response.content.find((c) => c.type === "text")
    if (!textContent || textContent.type !== "text") {
      throw new LLMError("No text response from LLM")
    }

    return textContent.text
  }

  /**
   * Generate a follow-up review based on human feedback
   */
  async generateFollowup(
    prContext: string,
    previousReview: string,
    humanFeedback: string
  ): Promise<string> {
    const systemPrompt = `You are a code reviewer following up on human feedback.

You previously reviewed this PR and humans have provided feedback. Your task is to:
1. Acknowledge the feedback
2. Reconsider your original findings in light of the feedback
3. Provide updated recommendations

Output format (use markdown):

### Response to Feedback
Brief acknowledgment of the feedback received.

### Updated Assessment
Any changes to your original findings based on the feedback.

### Remaining Concerns
Issues that still need attention (if any).

### Recommendations
What should happen next.

Guidelines:
- Be respectful of human feedback
- Admit if your original assessment was off
- Don't repeat already-addressed items
- Focus on what's still actionable`

    // Sanitize all user-provided content to prevent prompt injection
    const sanitizedPrContext = sanitizeUserContent(prContext)
    const sanitizedPreviousReview = sanitizeUserContent(previousReview)
    const sanitizedHumanFeedback = sanitizeUserContent(humanFeedback)

    const response = await withRetry(() =>
      this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `## PR Context
${sanitizedPrContext}

## Previous AI Review
${sanitizedPreviousReview}

## Human Feedback
${sanitizedHumanFeedback}

Please provide a follow-up assessment.`,
          },
        ],
      })
    )

    const textContent = response.content.find((c) => c.type === "text")
    if (!textContent || textContent.type !== "text") {
      throw new LLMError("No text response from LLM")
    }

    return textContent.text
  }
}

/**
 * Type guard for LLMConfig
 */
function isLLMConfig(value: unknown): value is LLMConfig {
  if (typeof value !== "object" || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    (obj.provider === undefined || typeof obj.provider === "string") &&
    (obj.model === undefined || typeof obj.model === "string") &&
    (obj.api_key_env === undefined || typeof obj.api_key_env === "string")
  )
}

/**
 * Load LLM configuration from .ai/config.yaml
 */
async function loadLLMConfig(): Promise<LLMConfig | undefined> {
  const aiPath = await findAiFolder()
  if (!aiPath) return undefined

  const config = await loadConfig(aiPath)
  if (!config?.llm) return undefined

  if (isLLMConfig(config.llm)) {
    return config.llm
  }

  // Config exists but is malformed
  return undefined
}

/**
 * Create an LLM client from configuration
 */
export async function createLLMClient(): Promise<LLMClient> {
  const config = await loadLLMConfig()

  // Get API key from environment
  const apiKeyEnv = config?.api_key_env || DEFAULT_API_KEY_ENV
  const apiKey = process.env[apiKeyEnv]

  if (!apiKey) {
    throw new LLMError(
      `Anthropic API key not found. Set the ${apiKeyEnv} environment variable.\n` +
        "Get an API key at: https://console.anthropic.com/"
    )
  }

  const model = config?.model || DEFAULT_MODEL

  return new LLMClient(apiKey, model)
}

/**
 * Get the configured model name for display
 */
export async function getConfiguredModel(): Promise<string> {
  const config = await loadLLMConfig()
  return config?.model || DEFAULT_MODEL
}
