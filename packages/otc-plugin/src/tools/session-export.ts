/**
 * Session Export Tool
 *
 * Exports the current session for team handoff.
 */

import { tool, type ToolDefinition, type PluginInput } from "@opencode-ai/plugin"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"
import type { OTCPluginState } from "../index"
import { SESSIONS_FOLDER } from "../lib/config"

export function createSessionExportTool(state: OTCPluginState, input: PluginInput): ToolDefinition {
  return tool({
    description:
      "Export the current session for team handoff. " +
      "Use this when the user asks to save the session, create a handoff, " +
      "or share their work with the team.",
    args: {
      title: tool.schema.string().optional().describe("Session title/description"),
      intent: tool.schema.string().optional().describe("What was the goal of this session?"),
      plan: tool.schema.array(tool.schema.string()).optional().describe("List of planned/completed steps"),
      blockers: tool.schema.array(tool.schema.string()).optional().describe("Known blockers or issues"),
    },
    async execute({ title, intent, plan, blockers }, ctx) {
      try {
        if (!state.aiFolder) {
          return `Cannot export session: .ai/ folder not found.

To enable session handoff:
1. Create an .ai/ folder in your project root
2. Or run 'otc init' from the CLI

Then try again.`
        }

        // Generate session ID and folder name
        const sessionId = randomUUID()
        const date = new Date()
        const dateStr = date.toISOString().slice(0, 10) // YYYY-MM-DD
        const slug = (title || "session")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 30)
        const folderName = `${dateStr}-${slug}`

        // Create sessions directory if needed
        const sessionsDir = join(state.aiFolder, SESSIONS_FOLDER)
        const sessionDir = join(sessionsDir, folderName)

        await mkdir(sessionDir, { recursive: true })

        // Create session metadata
        const metadata = {
          id: sessionId,
          title: title || "Untitled session",
          intent: intent || undefined,
          owner: process.env.USER || process.env.USERNAME || "unknown",
          status: "handed-off" as const,
          created: date.toISOString(),
          updated: date.toISOString(),
          plan: plan || [],
          blockers: blockers || [],
          opencode: {
            sessionId: ctx.sessionID,
            compacted: false,
          },
        }

        // Write session.json
        await writeFile(
          join(sessionDir, "session.json"),
          JSON.stringify(metadata, null, 2),
          "utf-8"
        )

        // Create human-readable summary
        const lines: string[] = []
        lines.push(`# ${metadata.title}`)
        lines.push("")
        lines.push(`**Session ID**: \`${sessionId}\``)
        lines.push(`**Created**: ${date.toLocaleString()}`)
        lines.push(`**Owner**: ${metadata.owner}`)
        lines.push("")

        if (intent) {
          lines.push(`## Intent`)
          lines.push(intent)
          lines.push("")
        }

        if (plan && plan.length > 0) {
          lines.push(`## Plan`)
          for (const step of plan) {
            lines.push(`- ${step}`)
          }
          lines.push("")
        }

        if (blockers && blockers.length > 0) {
          lines.push(`## Blockers`)
          for (const blocker of blockers) {
            lines.push(`- ⚠️ ${blocker}`)
          }
          lines.push("")
        }

        lines.push(`---`)
        lines.push(`*Exported by OpenTeamCode*`)

        // Write session.md
        await writeFile(
          join(sessionDir, "session.md"),
          lines.join("\n"),
          "utf-8"
        )

        return `## Session Exported

**Session ID**: \`${sessionId}\`
**Location**: .ai/sessions/${folderName}/

### Files Created
- \`session.json\` - Machine-readable metadata
- \`session.md\` - Human-readable summary

### To Continue This Session
Another team member can run:
\`\`\`
otc continue ${sessionId.slice(0, 12)}
\`\`\`

Or open the session folder and read the summary to understand the context.

### Session Details
- **Title**: ${metadata.title}
- **Intent**: ${intent || "Not specified"}
- **Plan items**: ${plan?.length || 0}
- **Blockers**: ${blockers?.length || 0}`
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return `Failed to export session: ${message}`
      }
    },
  })
}
