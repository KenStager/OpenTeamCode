/**
 * otc handoff - Export current session to .ai/sessions/ for team handoff
 */

import type { CommandModule } from "yargs"
import { mkdir, writeFile, readFile } from "fs/promises"
import { join } from "path"
import * as output from "../util/output"
import { findAiFolder, SESSIONS_FOLDER, type SessionMetadata } from "../util/config"
import { createClient, type SessionInfo, type Message } from "../util/opencode-client"

interface HandoffArgs {
  session?: string
  intent?: string
  blockers?: string[]
  json?: boolean
}

/**
 * Generate a slug from session title
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
}

/**
 * Generate a date prefix for session folder
 */
function datePrefix(): string {
  const now = new Date()
  return now.toISOString().split("T")[0]
}

/**
 * Extract intent from the first user message if not provided
 */
function extractIntent(messages: Message[]): string {
  const firstUserMessage = messages.find((m) => m.info.role === "user")
  if (firstUserMessage) {
    const textParts = firstUserMessage.parts.filter((p) => p.type === "text" && p.text)
    if (textParts.length > 0 && textParts[0].text) {
      const text = textParts[0].text
      // Take first 200 chars as intent
      return text.length > 200 ? text.slice(0, 197) + "..." : text
    }
  }
  return "No intent captured"
}

/**
 * Generate human-readable markdown summary
 */
function generateMarkdownSummary(
  session: SessionInfo,
  messages: Message[],
  intent: string,
  blockers: string[]
): string {
  const lines: string[] = []

  lines.push(`# Session: ${session.title}`)
  lines.push("")
  lines.push(`**ID:** ${session.id}`)
  lines.push(`**Created:** ${new Date(session.time.created).toISOString()}`)
  lines.push(`**Updated:** ${new Date(session.time.updated).toISOString()}`)
  lines.push("")

  lines.push("## Intent")
  lines.push("")
  lines.push(intent)
  lines.push("")

  if (blockers.length > 0) {
    lines.push("## Blockers")
    lines.push("")
    for (const blocker of blockers) {
      lines.push(`- ${blocker}`)
    }
    lines.push("")
  }

  lines.push("## Conversation Summary")
  lines.push("")

  // Summarize conversation
  let userCount = 0
  let assistantCount = 0
  for (const msg of messages) {
    if (msg.info.role === "user") userCount++
    else if (msg.info.role === "assistant") assistantCount++
  }
  lines.push(`- ${userCount} user messages`)
  lines.push(`- ${assistantCount} assistant responses`)
  lines.push("")

  // Show last few exchanges
  const recentMessages = messages.slice(-6)
  if (recentMessages.length > 0) {
    lines.push("### Recent Activity")
    lines.push("")
    for (const msg of recentMessages) {
      const role = msg.info.role === "user" ? "User" : "Assistant"
      const textParts = msg.parts.filter((p) => p.type === "text" && p.text)
      if (textParts.length > 0 && textParts[0].text) {
        const text = textParts[0].text
        const preview = text.length > 100 ? text.slice(0, 97) + "..." : text
        lines.push(`**${role}:** ${preview}`)
        lines.push("")
      }
    }
  }

  return lines.join("\n")
}

/**
 * Generate compressed JSONL of conversation
 */
function generateContextJsonl(messages: Message[]): string {
  return messages
    .map((msg) => {
      const compressed = {
        id: msg.info.id,
        role: msg.info.role,
        time: msg.info.time.created,
        parts: msg.parts.map((p) => {
          if (p.type === "text") {
            return { t: "text", v: p.text }
          }
          if (p.type === "tool-call" && p.toolCall) {
            return { t: "tool", n: p.toolCall.name, id: p.toolCall.id }
          }
          if (p.type === "tool-result" && p.toolResult) {
            return { t: "result", id: p.toolResult.id }
          }
          return { t: p.type }
        }),
      }
      return JSON.stringify(compressed)
    })
    .join("\n")
}

export const HandoffCommand: CommandModule<{}, HandoffArgs> = {
  command: "handoff",
  describe: "Export current session to .ai/sessions/ for team handoff",
  builder: (yargs) => {
    return yargs
      .option("session", {
        alias: "s",
        type: "string",
        description: "Session ID (default: most recent)",
      })
      .option("intent", {
        alias: "i",
        type: "string",
        description: "Override intent description",
      })
      .option("blockers", {
        alias: "b",
        type: "array",
        string: true,
        description: "List of blockers for the next person",
      })
      .option("json", {
        type: "boolean",
        description: "Output as JSON",
        default: false,
      })
  },
  handler: async (args) => {
    // Check for .ai/ folder
    const aiPath = await findAiFolder()
    if (!aiPath) {
      output.error(".ai/ folder not found. Run 'otc init' first.")
      process.exit(1)
    }

    // Connect to OpenCode
    const client = createClient()
    const connected = await client.isConnected()
    if (!connected) {
      output.error("OpenCode server not running. Start with: opencode serve")
      process.exit(1)
    }

    // Get session
    let session: SessionInfo
    try {
      if (args.session) {
        session = await client.getSession(args.session)
      } else {
        // Get most recent session
        const sessions = await client.listSessions({ limit: 1 })
        if (sessions.length === 0) {
          output.error("No sessions found")
          process.exit(1)
        }
        session = sessions[0]
      }
    } catch (error) {
      output.error(`Failed to get session: ${error}`)
      process.exit(1)
    }

    // Get messages
    let messages: Message[]
    try {
      messages = await client.getMessages(session.id)
    } catch (error) {
      output.error(`Failed to get messages: ${error}`)
      process.exit(1)
    }

    // Create session folder
    const slug = slugify(session.title)
    const folderName = `${datePrefix()}-${slug}`
    const sessionFolder = join(aiPath, SESSIONS_FOLDER, folderName)

    try {
      await mkdir(sessionFolder, { recursive: true })
    } catch (error) {
      output.error(`Failed to create session folder: ${error}`)
      process.exit(1)
    }

    // Determine intent
    const intent = args.intent || extractIntent(messages)
    const blockers = args.blockers || []

    // Create session metadata
    const metadata: SessionMetadata = {
      id: session.id,
      title: session.title,
      intent,
      status: "handed-off",
      created: new Date(session.time.created).toISOString(),
      updated: new Date().toISOString(),
      blockers: blockers.length > 0 ? blockers : undefined,
      opencode: {
        sessionId: session.id,
        compacted: false,
      },
    }

    // Write files
    try {
      // session.json
      await writeFile(
        join(sessionFolder, "session.json"),
        JSON.stringify(metadata, null, 2),
        "utf-8"
      )

      // session.md
      const markdown = generateMarkdownSummary(session, messages, intent, blockers)
      await writeFile(join(sessionFolder, "session.md"), markdown, "utf-8")

      // context.jsonl
      const jsonl = generateContextJsonl(messages)
      await writeFile(join(sessionFolder, "context.jsonl"), jsonl, "utf-8")
    } catch (error) {
      output.error(`Failed to write session files: ${error}`)
      process.exit(1)
    }

    const result = {
      sessionId: session.id,
      folder: folderName,
      path: sessionFolder,
      intent,
      blockers,
      messageCount: messages.length,
    }

    if (args.json) {
      output.json(result)
      return
    }

    output.header("Session Handoff Complete")
    output.success(`Session exported to .ai/sessions/${folderName}/`)
    console.log()
    output.keyValue("Session ID", session.id.slice(-8))
    output.keyValue("Title", session.title)
    output.keyValue("Messages", String(messages.length))
    output.keyValue("Intent", output.truncate(intent, 60))
    if (blockers.length > 0) {
      output.keyValue("Blockers", String(blockers.length))
    }
    console.log()
    output.info("Files created:")
    output.listItem("session.json - Machine-readable metadata")
    output.listItem("session.md - Human-readable summary")
    output.listItem("context.jsonl - Compressed conversation")
    console.log()
    output.dim(`To continue this session: otc continue ${session.id.slice(-8)}`)
    console.log()
  },
}
