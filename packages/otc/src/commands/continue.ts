/**
 * otc continue <id> - Resume a handed-off session with OpenCode
 */

import type { CommandModule } from "yargs"
import { readFile } from "fs/promises"
import { join } from "path"
import * as output from "../util/output"
import {
  findAiFolder,
  getSession,
  getSessionFolder,
  type SessionMetadata,
} from "../util/config"
import { createClient } from "../util/opencode-client"

interface ContinueArgs {
  id: string
  strategy?: "merge" | "fork" | "summary"
  json?: boolean
}

/**
 * Build context prompt from session artifact
 */
async function buildContextPrompt(
  session: SessionMetadata,
  sessionFolder: string
): Promise<string> {
  const lines: string[] = []

  lines.push("# Continuing Previous Session")
  lines.push("")
  lines.push(`You are continuing a session that was handed off by another developer.`)
  lines.push("")

  if (session.title) {
    lines.push(`## Session: ${session.title}`)
    lines.push("")
  }

  if (session.intent) {
    lines.push(`## Original Intent`)
    lines.push("")
    lines.push(session.intent)
    lines.push("")
  }

  if (session.plan && session.plan.length > 0) {
    lines.push(`## Previous Plan`)
    lines.push("")
    for (const step of session.plan) {
      lines.push(`- ${step}`)
    }
    lines.push("")
  }

  if (session.blockers && session.blockers.length > 0) {
    lines.push(`## Known Blockers`)
    lines.push("")
    for (const blocker of session.blockers) {
      lines.push(`- ${blocker}`)
    }
    lines.push("")
  }

  // Try to add conversation context
  try {
    const contextPath = join(sessionFolder, "context.jsonl")
    const contextData = await readFile(contextPath, "utf-8")
    const messages = contextData
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line))

    // Get recent messages (last 5 exchanges)
    const recentMessages = messages.slice(-10)

    if (recentMessages.length > 0) {
      lines.push(`## Recent Conversation Context`)
      lines.push("")
      lines.push("Here are the most recent exchanges from the previous session:")
      lines.push("")

      for (const msg of recentMessages) {
        const role = msg.role === "user" ? "User" : "Assistant"
        const textParts = msg.parts?.filter((p: { t: string }) => p.t === "text")
        if (textParts && textParts.length > 0 && textParts[0].v) {
          const text = textParts[0].v as string
          const preview = text.length > 200 ? text.slice(0, 197) + "..." : text
          lines.push(`**${role}:** ${preview}`)
          lines.push("")
        }
      }
    }
  } catch {
    // No context file
  }

  lines.push("---")
  lines.push("")
  lines.push("Please review the context above and continue working on this task.")
  lines.push("You can ask clarifying questions if needed.")
  lines.push("")

  return lines.join("\n")
}

export const ContinueCommand: CommandModule<{}, ContinueArgs> = {
  command: "continue <id>",
  describe: "Resume a handed-off session with OpenCode",
  builder: (yargs) => {
    return yargs
      .positional("id", {
        describe: "Session ID (can be partial)",
        type: "string",
        demandOption: true,
      })
      .option("strategy", {
        alias: "s",
        type: "string",
        choices: ["merge", "fork", "summary"] as const,
        description: "Continuation strategy: merge (inject context), fork (new session with context), summary (compact first)",
        default: "fork",
      })
      .option("json", {
        type: "boolean",
        description: "Output as JSON (don't launch OpenCode)",
        default: false,
      })
  },
  handler: async (args) => {
    const aiPath = await findAiFolder()
    if (!aiPath) {
      output.error(".ai/ folder not found. Run 'otc init' first.")
      process.exit(1)
    }

    // Find the session
    const session = await getSession(aiPath, args.id)
    if (!session) {
      output.error(`Session not found: ${args.id}`)
      output.dim("Run 'otc sessions list' to see available sessions.")
      process.exit(1)
    }

    const sessionFolder = await getSessionFolder(aiPath, args.id)
    if (!sessionFolder) {
      output.error(`Session folder not found for: ${args.id}`)
      process.exit(1)
    }

    // Build context prompt
    const contextPrompt = await buildContextPrompt(session, sessionFolder)

    if (args.json) {
      output.json({
        session,
        contextPrompt,
        strategy: args.strategy,
      })
      return
    }

    output.header("Continuing Session")
    output.keyValue("Session", session.title || "Untitled")
    output.keyValue("ID", session.id.slice(-8))
    output.keyValue("Strategy", args.strategy || "fork")
    console.log()

    if (session.intent) {
      output.info("Intent:")
      console.log(`  ${output.truncate(session.intent, 70)}`)
      console.log()
    }

    if (session.blockers && session.blockers.length > 0) {
      output.warning("Blockers to address:")
      for (const blocker of session.blockers) {
        output.listItem(blocker, 2)
      }
      console.log()
    }

    // Check if OpenCode is available
    const client = createClient()
    const connected = await client.isConnected()

    if (connected) {
      // OpenCode server is running - try to use API
      output.info("OpenCode server detected. Creating new session with context...")

      try {
        // Create a new session with the context as the initial prompt
        if (args.strategy === "fork" || args.strategy === "summary") {
          // For fork/summary, we create a new session
          const newSession = await client.createSession({
            title: `Continue: ${session.title || "Untitled"}`,
          })

          output.success(`Created new session: ${newSession.id.slice(-8)}`)
          output.dim("The session context will be available when you start OpenCode.")

          // Write context to a temp file for the user to reference
          const contextFile = join(sessionFolder, ".continue-context.md")
          const { writeFile } = await import("fs/promises")
          await writeFile(contextFile, contextPrompt, "utf-8")

          output.info(`Context saved to: ${contextFile}`)
          console.log()
          output.dim("Start OpenCode with: opencode")
          output.dim(`Then paste the context from: ${contextFile}`)
        }
      } catch (error) {
        output.error(`Failed to create session: ${error}`)
        output.dim("Falling back to local context file...")
      }
    } else {
      // OpenCode not running - save context and give instructions
      output.warning("OpenCode server not running.")
      console.log()

      // Write context to a file
      const contextFile = join(sessionFolder, ".continue-context.md")
      const { writeFile } = await import("fs/promises")
      await writeFile(contextFile, contextPrompt, "utf-8")

      output.success(`Context saved to: ${contextFile}`)
      console.log()
      output.info("To continue this session:")
      output.listItem("Start OpenCode: opencode")
      output.listItem(`Copy the context from: ${contextFile}`)
      output.listItem("Paste it as your first message to provide context")
      console.log()

      // Print the context preview
      output.dim("Context preview:")
      output.dim("─".repeat(60))
      const preview = contextPrompt.split("\n").slice(0, 15).join("\n")
      console.log(preview)
      if (contextPrompt.split("\n").length > 15) {
        output.dim("... (truncated)")
      }
      output.dim("─".repeat(60))
    }

    console.log()
  },
}
