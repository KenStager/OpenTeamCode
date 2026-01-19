/**
 * otc sessions - Session management commands
 *   otc sessions list - List sessions with filters
 *   otc sessions show <id> - Display session details
 *   otc sessions search <query> - Search session artifacts
 */

import type { CommandModule } from "yargs"
import { readFile } from "fs/promises"
import { join } from "path"
import * as output from "../util/output"
import {
  findAiFolder,
  listSessions,
  getSession,
  getSessionFolder,
  SESSIONS_FOLDER,
  type SessionMetadata,
} from "../util/config"

interface ListArgs {
  status?: string
  owner?: string
  limit?: number
  json?: boolean
}

interface ShowArgs {
  id: string
  json?: boolean
}

interface SearchArgs {
  query: string
  json?: boolean
}

const ListCommand: CommandModule<{}, ListArgs> = {
  command: "list",
  describe: "List sessions from .ai/sessions/",
  builder: (yargs) => {
    return yargs
      .option("status", {
        alias: "s",
        type: "string",
        description: "Filter by status (active, handed-off, completed, archived)",
      })
      .option("owner", {
        alias: "o",
        type: "string",
        description: "Filter by owner",
      })
      .option("limit", {
        alias: "n",
        type: "number",
        description: "Maximum number of sessions to show",
        default: 20,
      })
      .option("json", {
        type: "boolean",
        description: "Output as JSON",
        default: false,
      })
  },
  handler: async (args) => {
    const aiPath = await findAiFolder()
    if (!aiPath) {
      output.error(".ai/ folder not found. Run 'otc init' first.")
      process.exit(1)
    }

    let sessions = await listSessions(aiPath)

    // Apply filters
    if (args.status) {
      sessions = sessions.filter((s) => s.status === args.status)
    }
    if (args.owner) {
      sessions = sessions.filter((s) => s.owner?.toLowerCase().includes(args.owner!.toLowerCase()))
    }

    // Apply limit
    sessions = sessions.slice(0, args.limit)

    if (args.json) {
      output.json(sessions)
      return
    }

    output.header("Session Artifacts")
    output.keyValue("Location", join(aiPath, SESSIONS_FOLDER))
    console.log()

    if (sessions.length === 0) {
      output.dim("  No sessions found")
      console.log()
      return
    }

    const tableData = sessions.map((s) => ({
      id: s.id.slice(-8),
      title: output.truncate(s.title || "Untitled", 30),
      status: s.status,
      updated: output.relativeTime(new Date(s.updated)),
    }))

    output.table(tableData, [
      { key: "id", header: "ID", width: 10 },
      { key: "title", header: "Title", width: 32 },
      { key: "status", header: "Status", width: 12 },
      { key: "updated", header: "Updated", width: 12 },
    ])

    console.log()
    output.dim(`Showing ${sessions.length} session(s). Use 'otc sessions show <id>' for details.`)
    console.log()
  },
}

const ShowCommand: CommandModule<{}, ShowArgs> = {
  command: "show <id>",
  describe: "Display session details",
  builder: (yargs) => {
    return yargs
      .positional("id", {
        describe: "Session ID (can be partial)",
        type: "string",
        demandOption: true,
      })
      .option("json", {
        type: "boolean",
        description: "Output as JSON",
        default: false,
      })
  },
  handler: async (args) => {
    const aiPath = await findAiFolder()
    if (!aiPath) {
      output.error(".ai/ folder not found. Run 'otc init' first.")
      process.exit(1)
    }

    const session = await getSession(aiPath, args.id)
    if (!session) {
      output.error(`Session not found: ${args.id}`)
      process.exit(1)
    }

    // Try to load the markdown summary
    let markdownContent: string | null = null
    const sessionFolder = await getSessionFolder(aiPath, args.id)
    if (sessionFolder) {
      try {
        markdownContent = await readFile(join(sessionFolder, "session.md"), "utf-8")
      } catch {
        // No markdown file
      }
    }

    if (args.json) {
      output.json({
        ...session,
        markdown: markdownContent,
      })
      return
    }

    output.header(`Session: ${session.title || "Untitled"}`)
    output.keyValue("ID", session.id)
    output.keyValue("Status", session.status)
    output.keyValue("Created", new Date(session.created).toLocaleString())
    output.keyValue("Updated", new Date(session.updated).toLocaleString())

    if (session.owner) {
      output.keyValue("Owner", session.owner)
    }

    console.log()

    if (session.intent) {
      output.info("Intent:")
      console.log(`  ${session.intent}`)
      console.log()
    }

    if (session.plan && session.plan.length > 0) {
      output.info("Plan:")
      for (const step of session.plan) {
        output.listItem(step, 2)
      }
      console.log()
    }

    if (session.blockers && session.blockers.length > 0) {
      output.warning("Blockers:")
      for (const blocker of session.blockers) {
        output.listItem(blocker, 2)
      }
      console.log()
    }

    if (session.opencode) {
      output.info("OpenCode:")
      output.keyValue("  Session ID", session.opencode.sessionId || "N/A")
      output.keyValue("  Compacted", session.opencode.compacted ? "Yes" : "No")
      console.log()
    }

    output.dim(`To continue this session: otc continue ${session.id.slice(-8)}`)
    console.log()
  },
}

const SearchCommand: CommandModule<{}, SearchArgs> = {
  command: "search <query>",
  describe: "Search session artifacts",
  builder: (yargs) => {
    return yargs
      .positional("query", {
        describe: "Search query",
        type: "string",
        demandOption: true,
      })
      .option("json", {
        type: "boolean",
        description: "Output as JSON",
        default: false,
      })
  },
  handler: async (args) => {
    const aiPath = await findAiFolder()
    if (!aiPath) {
      output.error(".ai/ folder not found. Run 'otc init' first.")
      process.exit(1)
    }

    const allSessions = await listSessions(aiPath)
    const query = args.query.toLowerCase()

    // Search in session metadata and markdown content
    const results: Array<{ session: SessionMetadata; matchedIn: string[] }> = []

    for (const session of allSessions) {
      const matchedIn: string[] = []

      // Search in title
      if (session.title?.toLowerCase().includes(query)) {
        matchedIn.push("title")
      }

      // Search in intent
      if (session.intent?.toLowerCase().includes(query)) {
        matchedIn.push("intent")
      }

      // Search in blockers
      if (session.blockers?.some((b) => b.toLowerCase().includes(query))) {
        matchedIn.push("blockers")
      }

      // Search in plan
      if (session.plan?.some((p) => p.toLowerCase().includes(query))) {
        matchedIn.push("plan")
      }

      // Search in markdown if available
      const sessionFolder = await getSessionFolder(aiPath, session.id)
      if (sessionFolder) {
        try {
          const markdown = await readFile(join(sessionFolder, "session.md"), "utf-8")
          if (markdown.toLowerCase().includes(query)) {
            if (!matchedIn.includes("title") && !matchedIn.includes("intent")) {
              matchedIn.push("content")
            }
          }
        } catch {
          // No markdown file
        }
      }

      if (matchedIn.length > 0) {
        results.push({ session, matchedIn })
      }
    }

    if (args.json) {
      output.json(results)
      return
    }

    output.header(`Search Results for "${args.query}"`)

    if (results.length === 0) {
      output.dim("  No matching sessions found")
      console.log()
      return
    }

    output.keyValue("Matches", String(results.length))
    console.log()

    for (const { session, matchedIn } of results) {
      console.log(`  ${session.id.slice(-8)} - ${output.truncate(session.title || "Untitled", 40)}`)
      output.dim(`    Matched in: ${matchedIn.join(", ")}`)
      if (session.intent) {
        output.dim(`    Intent: ${output.truncate(session.intent, 50)}`)
      }
      console.log()
    }

    output.dim("Use 'otc sessions show <id>' for details.")
    console.log()
  },
}

export const SessionsCommand: CommandModule = {
  command: "sessions",
  describe: "Manage session artifacts",
  builder: (yargs) => {
    return yargs
      .command(ListCommand)
      .command(ShowCommand)
      .command(SearchCommand)
      .demandCommand(1, "Please specify a sessions subcommand")
  },
  handler: () => {
    // This is handled by subcommands
  },
}
