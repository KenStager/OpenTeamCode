/**
 * PR Summarize Tool
 *
 * Generates an AI-powered summary for a pull request description.
 */

import { tool, type ToolDefinition, type PluginInput } from "@opencode-ai/plugin"
import type { OTCPluginState } from "../index"
import { AdoClient, getAdoCredentialsFromEnv, getPullRequestDetails, summarizeChangesForLLM } from "../lib/ado"
import { createLLMClient } from "../lib/llm"

export function createPRSummarizeTool(state: OTCPluginState, input: PluginInput): ToolDefinition {
  return tool({
    description:
      "Generate an AI-powered summary for a pull request. " +
      "Use this when the user asks to summarize a PR, write a PR description, or describe PR changes.",
    args: {
      prId: tool.schema.number().int().positive().describe("Pull request ID to summarize"),
      dryRun: tool.schema
        .boolean()
        .optional()
        .describe("If true, returns the summary without updating the PR description"),
    },
    async execute({ prId, dryRun }, ctx) {
      try {
        // Get credentials
        const credentials = await getAdoCredentialsFromEnv(state.config)
        const adoClient = new AdoClient(credentials)

        // Get PR details
        const details = await getPullRequestDetails(adoClient, prId)

        // Create LLM client and generate summary
        const llmClient = createLLMClient(state.config)
        const prContext = summarizeChangesForLLM(details)
        const summary = await llmClient.generateSummary(prContext)

        if (dryRun) {
          return `## PR #${prId} Summary (Dry Run)

**Title**: ${details.pr.title}
**Author**: ${details.pr.createdBy.displayName}
**Files changed**: ${details.changes.length}

---

${summary}

---
*Dry run mode - PR description was not updated*`
        }

        // Update PR description
        const AI_SUMMARY_MARKER = "<!-- OTC-Summary -->"
        let newDescription: string

        if (details.pr.description?.includes(AI_SUMMARY_MARKER)) {
          // Replace existing AI summary
          const escapedMarker = AI_SUMMARY_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          newDescription = details.pr.description.replace(
            new RegExp(`${escapedMarker}[\\s\\S]*?${escapedMarker}`, "g"),
            `${AI_SUMMARY_MARKER}\n${summary}\n${AI_SUMMARY_MARKER}`
          )
        } else if (details.pr.description) {
          newDescription = `${details.pr.description}\n\n---\n\n${AI_SUMMARY_MARKER}\n${summary}\n${AI_SUMMARY_MARKER}`
        } else {
          newDescription = `${AI_SUMMARY_MARKER}\n${summary}\n${AI_SUMMARY_MARKER}`
        }

        await adoClient.updatePullRequest(prId, details.repositoryId, {
          description: newDescription,
        })

        return `## PR #${prId} Summary Updated

**Title**: ${details.pr.title}
**Author**: ${details.pr.createdBy.displayName}
**Files changed**: ${details.changes.length}
**Model**: ${llmClient.getModel()}

The PR description has been updated with an AI-generated summary.

**View PR**: ${details.pr.url}`
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return `Failed to summarize PR #${prId}: ${message}`
      }
    },
  })
}
