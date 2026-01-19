/**
 * PR Testplan Tool
 *
 * Generates a risk-based test plan for a pull request.
 */

import { tool, type ToolDefinition, type PluginInput } from "@opencode-ai/plugin"
import type { OTCPluginState } from "../index"
import { AdoClient, getAdoCredentialsFromEnv, getPullRequestDetails, summarizeChangesForLLM, postTestPlan } from "../lib/ado"
import { createLLMClient } from "../lib/llm"

export function createPRTestplanTool(state: OTCPluginState, input: PluginInput): ToolDefinition {
  return tool({
    description:
      "Generate a risk-based test plan for a pull request. " +
      "Use this when the user asks for a test plan, testing recommendations, or QA guidance for a PR.",
    args: {
      prId: tool.schema.number().int().positive().describe("Pull request ID to create test plan for"),
      dryRun: tool.schema
        .boolean()
        .optional()
        .describe("If true, returns the test plan without posting to ADO"),
    },
    async execute({ prId, dryRun }, ctx) {
      try {
        // Get credentials
        const credentials = await getAdoCredentialsFromEnv(state.config)
        const adoClient = new AdoClient(credentials)

        // Get PR details
        const details = await getPullRequestDetails(adoClient, prId)

        // Create LLM client and generate test plan
        const llmClient = createLLMClient(state.config)
        const prContext = summarizeChangesForLLM(details)
        const testPlan = await llmClient.generateTestPlan(prContext)

        if (dryRun) {
          return `## PR #${prId} Test Plan (Dry Run)

**Title**: ${details.pr.title}
**Author**: ${details.pr.createdBy.displayName}
**Files changed**: ${details.changes.length}

---

${testPlan}

---
*Dry run mode - test plan was not posted to ADO*`
        }

        // Post to ADO
        await postTestPlan(adoClient, prId, details.repositoryId, testPlan)

        return `## PR #${prId} Test Plan Posted

**Title**: ${details.pr.title}
**Author**: ${details.pr.createdBy.displayName}
**Files changed**: ${details.changes.length}
**Model**: ${llmClient.getModel()}

The test plan has been posted to the pull request.

**View PR**: ${details.pr.url}`
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return `Failed to create test plan for PR #${prId}: ${message}`
      }
    },
  })
}
