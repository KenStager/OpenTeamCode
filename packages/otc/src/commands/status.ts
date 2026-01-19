/**
 * otc status - Show local state: .ai/ validity, OpenCode state, policy freshness
 */

import type { CommandModule } from "yargs"
import * as output from "../util/output"
import {
  findAiFolder,
  loadConfig,
  loadPolicies,
  getAiFolderStats,
  listSessions,
} from "../util/config"

interface StatusArgs {
  json?: boolean
}

export const StatusCommand: CommandModule<{}, StatusArgs> = {
  command: "status",
  describe: "Show local state: .ai/ validity, OpenCode state, policy freshness",
  builder: (yargs) => {
    return yargs.option("json", {
      type: "boolean",
      description: "Output as JSON",
      default: false,
    })
  },
  handler: async (args) => {
    const aiPath = await findAiFolder()

    const status = {
      aiFolder: {
        found: !!aiPath,
        path: aiPath,
      },
      config: null as { valid: boolean; team?: string; error?: string } | null,
      policies: null as { valid: boolean; patternCount?: number; error?: string } | null,
      files: null as Awaited<ReturnType<typeof getAiFolderStats>> | null,
      sessions: {
        total: 0,
        active: 0,
        handedOff: 0,
      },
      opencode: {
        connected: false,
        activeSession: null as string | null,
      },
    }

    if (aiPath) {
      // Load config
      try {
        const config = await loadConfig(aiPath)
        if (config) {
          status.config = { valid: true, team: config.team }
        } else {
          status.config = { valid: false, error: "config.yaml not found" }
        }
      } catch (error) {
        status.config = { valid: false, error: String(error) }
      }

      // Load policies
      try {
        const policies = await loadPolicies(aiPath)
        if (policies) {
          status.policies = { valid: true, patternCount: policies.patterns.length }
        } else {
          status.policies = { valid: false, error: "policies.yaml not found" }
        }
      } catch (error) {
        status.policies = { valid: false, error: String(error) }
      }

      // Get file stats
      status.files = await getAiFolderStats(aiPath)

      // Get session counts
      try {
        const sessions = await listSessions(aiPath)
        status.sessions.total = sessions.length
        status.sessions.active = sessions.filter((s) => s.status === "active").length
        status.sessions.handedOff = sessions.filter((s) => s.status === "handed-off").length
      } catch {
        // Ignore session listing errors
      }
    }

    // Check OpenCode connection
    try {
      const response = await fetch("http://localhost:4096/health", { signal: AbortSignal.timeout(1000) })
      if (response.ok) {
        status.opencode.connected = true
        // Try to get active session
        const sessionsResponse = await fetch("http://localhost:4096/session", { signal: AbortSignal.timeout(1000) })
        if (sessionsResponse.ok) {
          const sessions = (await sessionsResponse.json()) as Array<{ id: string; time: { updated: number } }>
          if (sessions.length > 0) {
            // Get most recently updated session
            sessions.sort((a, b) => b.time.updated - a.time.updated)
            status.opencode.activeSession = sessions[0].id
          }
        }
      }
    } catch {
      // OpenCode not running
    }

    if (args.json) {
      output.json(status)
      return
    }

    // Human-readable output
    output.header("OpenTeamCode Status")

    // .ai/ folder
    if (status.aiFolder.found) {
      output.success(`.ai/ folder found at ${status.aiFolder.path}`)
    } else {
      output.error(".ai/ folder not found")
      output.dim("  Run 'otc init' to create one")
      console.log()
      return
    }

    console.log()

    // Config status
    output.info("Configuration:")
    if (status.config?.valid) {
      output.check("config.yaml", true)
      if (status.config.team) {
        output.keyValue("  Team", status.config.team)
      }
    } else {
      output.check("config.yaml", false, status.config?.error)
    }

    if (status.policies?.valid) {
      output.check("policies.yaml", true, `${status.policies.patternCount} patterns`)
    } else {
      output.check("policies.yaml", false, status.policies?.error)
    }

    if (status.files?.standards.exists) {
      output.check("standards.md", true)
    } else {
      output.check("standards.md", false, "not found")
    }

    console.log()

    // File freshness
    if (status.files) {
      output.info("File Freshness:")
      if (status.files.config.modified) {
        output.keyValue("  config.yaml", output.relativeTime(status.files.config.modified))
      }
      if (status.files.policies.modified) {
        output.keyValue("  policies.yaml", output.relativeTime(status.files.policies.modified))
      }
      if (status.files.standards.modified) {
        output.keyValue("  standards.md", output.relativeTime(status.files.standards.modified))
      }
    }

    console.log()

    // Sessions
    output.info("Sessions:")
    output.keyValue("  Total", String(status.sessions.total))
    output.keyValue("  Active", String(status.sessions.active))
    output.keyValue("  Handed off", String(status.sessions.handedOff))

    console.log()

    // OpenCode status
    output.info("OpenCode:")
    if (status.opencode.connected) {
      output.check("Server connected", true, "localhost:4096")
      if (status.opencode.activeSession) {
        output.keyValue("  Active session", status.opencode.activeSession.slice(-8))
      }
    } else {
      output.check("Server connected", false, "not running")
      output.dim("  Start with: opencode serve")
    }

    console.log()
  },
}
