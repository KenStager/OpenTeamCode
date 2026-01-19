/**
 * PR Review Tool
 *
 * Reviews a pull request on Azure DevOps and posts AI-generated findings.
 */

import { tool, type ToolDefinition, type PluginInput } from "@opencode-ai/plugin"
import type { OTCPluginState } from "../index"
import { loadReviewRubric } from "../lib/config"
import { AdoClient, getAdoCredentialsFromEnv, getPullRequestDetails, summarizeChangesForLLM, postAIReview } from "../lib/ado"
import { createLLMClient } from "../lib/llm"

export function createPRReviewTool(state: OTCPluginState, input: PluginInput): ToolDefinition {
  return tool({
    description:
      "Review a pull request on Azure DevOps and post AI-generated findings. " +
      "Use this when the user asks to review a PR, code review a PR, or check a PR for issues.",
    args: {
      prId: tool.schema.number().int().positive().describe("Pull request ID to review"),
      dryRun: tool.schema
        .boolean()
        .optional()
        .describe("If true, returns the review without posting to ADO"),
    },
    async execute({ prId, dryRun }, ctx) {
      try {
        // Get credentials
        const credentials = await getAdoCredentialsFromEnv(state.config)
        const adoClient = new AdoClient(credentials)

        // Get PR details
        const details = await getPullRequestDetails(adoClient, prId)

        // Load review rubric if available
        let rubric: string | null = null
        if (state.aiFolder) {
          rubric = await loadReviewRubric(state.aiFolder)
        }

        // Create LLM client and generate review
        const llmClient = createLLMClient(state.config)
        const prContext = summarizeChangesForLLM(details)
        const review = await llmClient.generateReview(prContext, rubric || undefined)

        if (dryRun) {
          return `## PR #${prId} Review (Dry Run)

**Title**: ${details.pr.title}
**Author**: ${details.pr.createdBy.displayName}
**Files changed**: ${details.changes.length}
**Using rubric**: ${rubric ? "yes" : "no (default)"}

---

${review}

---
*Dry run mode - review was not posted to ADO*`
        }

        // Post to ADO
        await postAIReview(adoClient, prId, details.repositoryId, review, llmClient.getModel())

        return `## PR #${prId} Review Posted

**Title**: ${details.pr.title}
**Author**: ${details.pr.createdBy.displayName}
**Files changed**: ${details.changes.length}
**Model**: ${llmClient.getModel()}

The AI review has been posted to the pull request.

**View PR**: ${details.pr.url}`
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return `Failed to review PR #${prId}: ${message}`
      }
    },
  })
}
