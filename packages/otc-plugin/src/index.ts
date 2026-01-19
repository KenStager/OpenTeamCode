/**
 * OpenTeamCode Plugin for OpenCode
 *
 * Provides team collaboration features:
 * - Standards injection from .ai/standards.md
 * - Guardrails that block secret writes
 * - PR workflow tools (review, summarize, testplan)
 * - Session export for team handoff
 * - Guardrail scanning tool
 */

import type { Plugin, Hooks, PluginInput } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import { join } from "path"

import { loadConfig, loadStandards, loadPolicies, AI_FOLDER, findAiFolder } from "./lib/config"
import { detectSecrets, scan } from "./lib/scanner"
import { standardsHook } from "./hooks/standards"
import { guardrailsHook } from "./hooks/guardrails"
import { createPRReviewTool } from "./tools/pr-review"
import { createPRSummarizeTool } from "./tools/pr-summarize"
import { createPRTestplanTool } from "./tools/pr-testplan"
import { createGuardrailScanTool } from "./tools/guardrail-scan"
import { createSessionExportTool } from "./tools/session-export"

export interface OTCPluginState {
  aiFolder: string | null
  config: Awaited<ReturnType<typeof loadConfig>>
  policies: Awaited<ReturnType<typeof loadPolicies>>
  standards: string | null
}

/**
 * OpenTeamCode Plugin Entry Point
 */
export const OTCPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  // Look for .ai/ folder in the project directory
  const aiFolder = await findAiFolder(input.directory)

  // Load configuration if .ai/ folder exists
  let config: Awaited<ReturnType<typeof loadConfig>> = null
  let policies: Awaited<ReturnType<typeof loadPolicies>> = null
  let standards: string | null = null

  if (aiFolder) {
    try {
      config = await loadConfig(aiFolder)
    } catch (e) {
      console.warn(`[OTC] Failed to load config: ${e}`)
    }

    try {
      policies = await loadPolicies(aiFolder)
    } catch (e) {
      console.warn(`[OTC] Failed to load policies: ${e}`)
    }

    try {
      standards = await loadStandards(aiFolder)
    } catch (e) {
      console.warn(`[OTC] Failed to load standards: ${e}`)
    }
  }

  const state: OTCPluginState = { aiFolder, config, policies, standards }

  // If no .ai/ folder, return minimal hooks
  if (!aiFolder) {
    return {
      tool: {
        "otc:init-help": tool({
          description:
            "Explains how to initialize OpenTeamCode in the current project. Use this when the user asks about team features or otc setup.",
          args: {},
          async execute() {
            return `OpenTeamCode is not initialized in this project.

To enable team collaboration features:
1. Create an .ai/ folder in your project root
2. Add a config.yaml file with your settings
3. Add a standards.md file with your team's coding standards
4. Add a policies.yaml file for guardrail configuration

Example structure:
  .ai/
  ├── config.yaml     # OTC configuration (ADO org, project, etc.)
  ├── standards.md    # Team coding standards (injected into prompts)
  ├── policies.yaml   # Guardrail rules for secret detection
  └── sessions/       # Session artifacts for team handoff

Run 'otc init' from the CLI to scaffold this structure automatically.`
          },
        }),
      },
    }
  }

  // Full hooks when .ai/ folder is present
  return {
    // Standards injection - adds .ai/standards.md content to system prompts
    "experimental.chat.system.transform": standardsHook(state),

    // Guardrails - blocks file writes containing secrets
    "permission.ask": guardrailsHook(state),

    // Event subscription for session tracking
    event: async ({ event }) => {
      // Future: auto-save session artifacts on session events
      // Currently a no-op placeholder for future implementation
    },

    // Custom tools for PR workflows and team operations
    tool: {
      "otc:pr-review": createPRReviewTool(state, input),
      "otc:pr-summarize": createPRSummarizeTool(state, input),
      "otc:pr-testplan": createPRTestplanTool(state, input),
      "otc:guardrail-scan": createGuardrailScanTool(state, input),
      "otc:session-export": createSessionExportTool(state, input),
    },
  }
}

// Default export for plugin loading
export default OTCPlugin

// Re-export types and utilities for external use
export { loadConfig, loadStandards, loadPolicies, AI_FOLDER } from "./lib/config"
export { detectSecrets, scan } from "./lib/scanner"
export type { DetectionResult, ScanSummary, ScanOptions } from "./lib/scanner"
