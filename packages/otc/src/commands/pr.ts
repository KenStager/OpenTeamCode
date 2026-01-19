/**
 * otc pr - Azure DevOps PR workflow commands
 *   otc pr summarize <id> - Generate/update PR description
 *   otc pr review <id> - Post structured review comments
 *   otc pr testplan <id> - Generate risk-based test plan
 *   otc pr followup <id> - Re-review after human feedback
 *   otc pr link <id> - Attach current session to PR
 */

import type { CommandModule } from "yargs"
import { readFile } from "fs/promises"
import { join, resolve, relative, isAbsolute } from "path"
import * as output from "../util/output"
import { findAiFolder, loadReviewRubric, getSession, getSessionFolder, listSessions, SESSIONS_FOLDER } from "../util/config"
import { loadAdoCredentials, AdoAuthError } from "../ado/auth"
import { createAdoClient, AdoApiError } from "../ado/client"
import {
  getPullRequestDetails,
  summarizeChangesForLLM,
  updatePRDescription,
  postAIReview,
  postTestPlan,
  postSessionWorklog,
  getHumanFeedbackSinceLastReview,
  postComment,
} from "../ado/pr"
import { createLLMClient, LLMError } from "../llm"

// Maximum PR ID (2^31 - 1 for 32-bit safety)
const MAX_PR_ID = 2147483647

/**
 * Validate PR ID is a positive integer within safe bounds
 */
function validatePRId(id: number): void {
  if (!Number.isInteger(id) || id <= 0) {
    output.error("PR ID must be a positive integer")
    process.exit(1)
  }
  if (id > MAX_PR_ID) {
    output.error(`PR ID exceeds maximum allowed value (${MAX_PR_ID})`)
    process.exit(1)
  }
}

/**
 * Validate and sanitize a file path to prevent path traversal attacks.
 * Only allows:
 * - Relative paths that don't escape the current directory
 * - Paths within the .ai folder
 */
function validateFilePath(filePath: string, aiPath: string | null): string | null {
  const cwd = process.cwd()
  const resolvedPath = resolve(cwd, filePath)

  // Check if path tries to escape via relative traversal
  const relativeFromCwd = relative(cwd, resolvedPath)
  if (relativeFromCwd.startsWith("..")) {
    return null
  }

  // If we have an .ai folder, also allow paths within it
  if (aiPath) {
    const relativeFromAi = relative(aiPath, resolvedPath)
    if (!relativeFromAi.startsWith("..")) {
      return resolvedPath
    }
  }

  // Path is within cwd
  return resolvedPath
}

// Common PR ID argument type
interface PRIdArgs {
  id: number
  "dry-run"?: boolean
  json?: boolean
}

// Summarize args
interface SummarizeArgs extends PRIdArgs {
  comment?: boolean
}

// Review args
interface ReviewArgs extends PRIdArgs {
  rubric?: string
}

// Link args
interface LinkArgs extends PRIdArgs {
  session?: string
}

/**
 * Helper to get ADO client with error handling
 */
async function getAdoClient() {
  try {
    const credentials = await loadAdoCredentials()
    return createAdoClient(credentials)
  } catch (error) {
    if (error instanceof AdoAuthError) {
      output.error(error.message)
      process.exit(1)
    }
    throw error
  }
}

/**
 * Helper to get LLM client with error handling
 */
async function getLLMClient() {
  try {
    return await createLLMClient()
  } catch (error) {
    if (error instanceof LLMError) {
      output.error(error.message)
      process.exit(1)
    }
    throw error
  }
}

/**
 * PR Summarize Command
 */
const SummarizeCommand: CommandModule<{}, SummarizeArgs> = {
  command: "summarize <id>",
  describe: "Generate/update PR description with AI-generated summary",
  builder: (yargs) => {
    return yargs
      .positional("id", {
        describe: "Pull request ID",
        type: "number",
        demandOption: true,
      })
      .option("dry-run", {
        type: "boolean",
        description: "Print summary without posting to ADO",
        default: false,
      })
      .option("comment", {
        type: "boolean",
        description: "Post as comment instead of updating description",
        default: false,
      })
      .option("json", {
        type: "boolean",
        description: "Output as JSON",
        default: false,
      })
  },
  handler: async (args) => {
    validatePRId(args.id)

    const adoClient = await getAdoClient()
    const llmClient = await getLLMClient()

    if (!args.json && !args["dry-run"]) {
      output.header(`PR #${args.id}: Generating Summary`)
    }

    // Get PR details
    let details
    try {
      details = await getPullRequestDetails(adoClient, args.id)
    } catch (error) {
      if (error instanceof AdoApiError) {
        output.error(`Failed to fetch PR #${args.id}: ${error.message}`)
        process.exit(1)
      }
      throw error
    }

    if (!args.json && !args["dry-run"]) {
      output.keyValue("Title", details.pr.title)
      output.keyValue("Files changed", String(details.changes.length))
      console.log()
      output.info("Generating summary with AI...")
    }

    // Generate summary
    const prContext = summarizeChangesForLLM(details)
    const summary = await llmClient.generateSummary(prContext)

    if (args.json) {
      output.json({
        pullRequestId: args.id,
        title: details.pr.title,
        summary,
        dryRun: args["dry-run"],
        model: llmClient.getModel(),
      })
      return
    }

    if (args["dry-run"]) {
      output.header(`PR #${args.id}: Summary (Dry Run)`)
      console.log()
      console.log(summary)
      console.log()
      output.dim("Dry run - no changes made to ADO")
      return
    }

    // Post to ADO
    try {
      if (args.comment) {
        // Post as comment
        await postComment(adoClient, args.id, details.repositoryId, `## AI Summary\n\n${summary}`)
        output.success("Summary posted as PR comment")
      } else {
        // Update PR description
        await updatePRDescription(adoClient, args.id, details.repositoryId, summary)
        output.success("PR description updated with AI summary")
      }
    } catch (error) {
      if (error instanceof AdoApiError) {
        output.error(`Failed to update PR: ${error.message}`)
        if (error.statusCode === 403) {
          output.dim("Hint: You may not have permission to edit this PR. Try --comment instead.")
        }
        process.exit(1)
      }
      throw error
    }

    console.log()
    output.dim(`View PR: ${details.pr.url}`)
  },
}

/**
 * PR Review Command
 */
const ReviewCommand: CommandModule<{}, ReviewArgs> = {
  command: "review <id>",
  describe: "Post structured AI review comments on a PR",
  builder: (yargs) => {
    return yargs
      .positional("id", {
        describe: "Pull request ID",
        type: "number",
        demandOption: true,
      })
      .option("dry-run", {
        type: "boolean",
        description: "Print review without posting to ADO",
        default: false,
      })
      .option("rubric", {
        type: "string",
        description: "Path to custom review rubric file (default: .ai/review.md)",
      })
      .option("json", {
        type: "boolean",
        description: "Output as JSON",
        default: false,
      })
  },
  handler: async (args) => {
    validatePRId(args.id)

    const adoClient = await getAdoClient()
    const llmClient = await getLLMClient()

    if (!args.json && !args["dry-run"]) {
      output.header(`PR #${args.id}: AI Review`)
    }

    // Get PR details
    let details
    try {
      details = await getPullRequestDetails(adoClient, args.id)
    } catch (error) {
      if (error instanceof AdoApiError) {
        output.error(`Failed to fetch PR #${args.id}: ${error.message}`)
        process.exit(1)
      }
      throw error
    }

    // Load rubric with path validation
    let rubric: string | null = null
    const aiPath = await findAiFolder()

    if (args.rubric) {
      // Validate path to prevent path traversal attacks
      const validatedPath = validateFilePath(args.rubric, aiPath)
      if (!validatedPath) {
        output.error(`Invalid rubric path: path traversal not allowed`)
        process.exit(1)
      }
      try {
        rubric = await readFile(validatedPath, "utf-8")
      } catch {
        output.error(`Failed to read rubric file: ${args.rubric}`)
        process.exit(1)
      }
    } else {
      if (aiPath) {
        rubric = await loadReviewRubric(aiPath)
      }
    }

    if (!args.json && !args["dry-run"]) {
      output.keyValue("Title", details.pr.title)
      output.keyValue("Files changed", String(details.changes.length))
      output.keyValue("Rubric", rubric ? "loaded" : "default")
      console.log()
      output.info("Generating review with AI...")
    }

    // Generate review
    const prContext = summarizeChangesForLLM(details)
    const review = await llmClient.generateReview(prContext, rubric || undefined)

    if (args.json) {
      output.json({
        pullRequestId: args.id,
        title: details.pr.title,
        review,
        dryRun: args["dry-run"],
        model: llmClient.getModel(),
        rubricUsed: !!rubric,
      })
      return
    }

    if (args["dry-run"]) {
      output.header(`PR #${args.id}: Review (Dry Run)`)
      console.log()
      console.log(review)
      console.log()
      output.dim("Dry run - no changes made to ADO")
      return
    }

    // Post to ADO
    try {
      await postAIReview(adoClient, args.id, details.repositoryId, review, llmClient.getModel())
      output.success("AI review posted to PR")
    } catch (error) {
      if (error instanceof AdoApiError) {
        output.error(`Failed to post review: ${error.message}`)
        process.exit(1)
      }
      throw error
    }

    console.log()
    output.dim(`View PR: ${details.pr.url}`)
  },
}

/**
 * PR Testplan Command
 */
const TestplanCommand: CommandModule<{}, PRIdArgs> = {
  command: "testplan <id>",
  describe: "Generate risk-based test plan for a PR",
  builder: (yargs) => {
    return yargs
      .positional("id", {
        describe: "Pull request ID",
        type: "number",
        demandOption: true,
      })
      .option("dry-run", {
        type: "boolean",
        description: "Print test plan without posting to ADO",
        default: false,
      })
      .option("json", {
        type: "boolean",
        description: "Output as JSON",
        default: false,
      })
  },
  handler: async (args) => {
    validatePRId(args.id)

    const adoClient = await getAdoClient()
    const llmClient = await getLLMClient()

    if (!args.json && !args["dry-run"]) {
      output.header(`PR #${args.id}: Test Plan`)
    }

    // Get PR details
    let details
    try {
      details = await getPullRequestDetails(adoClient, args.id)
    } catch (error) {
      if (error instanceof AdoApiError) {
        output.error(`Failed to fetch PR #${args.id}: ${error.message}`)
        process.exit(1)
      }
      throw error
    }

    if (!args.json && !args["dry-run"]) {
      output.keyValue("Title", details.pr.title)
      output.keyValue("Files changed", String(details.changes.length))
      console.log()
      output.info("Generating test plan with AI...")
    }

    // Generate test plan
    const prContext = summarizeChangesForLLM(details)
    const testPlan = await llmClient.generateTestPlan(prContext)

    if (args.json) {
      output.json({
        pullRequestId: args.id,
        title: details.pr.title,
        testPlan,
        dryRun: args["dry-run"],
        model: llmClient.getModel(),
      })
      return
    }

    if (args["dry-run"]) {
      output.header(`PR #${args.id}: Test Plan (Dry Run)`)
      console.log()
      console.log(testPlan)
      console.log()
      output.dim("Dry run - no changes made to ADO")
      return
    }

    // Post to ADO
    try {
      await postTestPlan(adoClient, args.id, details.repositoryId, testPlan)
      output.success("Test plan posted to PR")
    } catch (error) {
      if (error instanceof AdoApiError) {
        output.error(`Failed to post test plan: ${error.message}`)
        process.exit(1)
      }
      throw error
    }

    console.log()
    output.dim(`View PR: ${details.pr.url}`)
  },
}

/**
 * PR Followup Command
 */
const FollowupCommand: CommandModule<{}, PRIdArgs> = {
  command: "followup <id>",
  describe: "Re-review PR after human feedback",
  builder: (yargs) => {
    return yargs
      .positional("id", {
        describe: "Pull request ID",
        type: "number",
        demandOption: true,
      })
      .option("dry-run", {
        type: "boolean",
        description: "Print follow-up without posting to ADO",
        default: false,
      })
      .option("json", {
        type: "boolean",
        description: "Output as JSON",
        default: false,
      })
  },
  handler: async (args) => {
    validatePRId(args.id)

    const adoClient = await getAdoClient()
    const llmClient = await getLLMClient()

    if (!args.json && !args["dry-run"]) {
      output.header(`PR #${args.id}: Follow-up Review`)
    }

    // Get PR details
    let details
    try {
      details = await getPullRequestDetails(adoClient, args.id)
    } catch (error) {
      if (error instanceof AdoApiError) {
        output.error(`Failed to fetch PR #${args.id}: ${error.message}`)
        process.exit(1)
      }
      throw error
    }

    // Get human feedback since last review
    const { lastAIReviewDate, humanComments } = await getHumanFeedbackSinceLastReview(
      adoClient,
      args.id,
      details.repositoryId
    )

    if (!lastAIReviewDate) {
      output.warning("No previous AI review found. Run 'otc pr review' first.")
      process.exit(1)
    }

    if (humanComments.length === 0) {
      output.info("No new human feedback since last AI review")
      output.dim(`Last review: ${lastAIReviewDate.toLocaleString()}`)
      return
    }

    if (!args.json && !args["dry-run"]) {
      output.keyValue("Title", details.pr.title)
      output.keyValue("Last AI review", lastAIReviewDate.toLocaleString())
      output.keyValue("Human comments since", String(humanComments.length))
      console.log()
      output.info("Generating follow-up with AI...")
    }

    // Format human feedback for LLM
    const humanFeedback = humanComments
      .map((c) => {
        const location = c.filePath ? ` (${c.filePath})` : ""
        return `**${c.author}**${location}:\n${c.content}`
      })
      .join("\n\n---\n\n")

    // Find previous review content
    let previousReview = ""
    for (const thread of details.threads) {
      for (const comment of thread.comments) {
        if (comment.content.includes("<!-- OpenTeamCode AI -->") && comment.content.includes("AI Review")) {
          previousReview = comment.content
          break
        }
      }
      if (previousReview) break
    }

    // Generate follow-up
    const prContext = summarizeChangesForLLM(details)
    const followup = await llmClient.generateFollowup(prContext, previousReview, humanFeedback)

    if (args.json) {
      output.json({
        pullRequestId: args.id,
        title: details.pr.title,
        lastAIReviewDate: lastAIReviewDate.toISOString(),
        humanCommentCount: humanComments.length,
        followup,
        dryRun: args["dry-run"],
        model: llmClient.getModel(),
      })
      return
    }

    if (args["dry-run"]) {
      output.header(`PR #${args.id}: Follow-up (Dry Run)`)
      console.log()
      output.info("Human feedback received:")
      for (const c of humanComments) {
        console.log(`  ${c.author}: ${output.truncate(c.content, 60)}`)
      }
      console.log()
      console.log(followup)
      console.log()
      output.dim("Dry run - no changes made to ADO")
      return
    }

    // Post to ADO
    try {
      await postAIReview(adoClient, args.id, details.repositoryId, followup, llmClient.getModel())
      output.success("Follow-up review posted to PR")
    } catch (error) {
      if (error instanceof AdoApiError) {
        output.error(`Failed to post follow-up: ${error.message}`)
        process.exit(1)
      }
      throw error
    }

    console.log()
    output.dim(`View PR: ${details.pr.url}`)
  },
}

/**
 * PR Link Command
 */
const LinkCommand: CommandModule<{}, LinkArgs> = {
  command: "link <id>",
  describe: "Attach current session artifact to a PR",
  builder: (yargs) => {
    return yargs
      .positional("id", {
        describe: "Pull request ID",
        type: "number",
        demandOption: true,
      })
      .option("session", {
        type: "string",
        description: "Session ID to link (default: most recent)",
      })
      .option("dry-run", {
        type: "boolean",
        description: "Print link info without posting to ADO",
        default: false,
      })
      .option("json", {
        type: "boolean",
        description: "Output as JSON",
        default: false,
      })
  },
  handler: async (args) => {
    validatePRId(args.id)

    const aiPath = await findAiFolder()
    if (!aiPath) {
      output.error(".ai/ folder not found. Run 'otc init' first.")
      process.exit(1)
    }

    // Find session to link
    let sessionId = args.session
    let session

    if (sessionId) {
      session = await getSession(aiPath, sessionId)
      if (!session) {
        output.error(`Session not found: ${sessionId}`)
        process.exit(1)
      }
    } else {
      // Get most recent session
      const sessions = await listSessions(aiPath)
      if (sessions.length === 0) {
        output.error("No sessions found. Run 'otc handoff' first to create a session artifact.")
        process.exit(1)
      }
      session = sessions[0]
      sessionId = session.id
    }

    const adoClient = await getAdoClient()

    if (!args.json && !args["dry-run"]) {
      output.header(`PR #${args.id}: Link Session`)
    }

    // Get PR details
    let details
    try {
      details = await getPullRequestDetails(adoClient, args.id)
    } catch (error) {
      if (error instanceof AdoApiError) {
        output.error(`Failed to fetch PR #${args.id}: ${error.message}`)
        process.exit(1)
      }
      throw error
    }

    // Load session markdown summary if available
    let sessionSummary = ""
    try {
      // Use getSessionFolder which implements proper matching logic
      const sessionFolderPath = await getSessionFolder(aiPath, sessionId!)
      if (sessionFolderPath) {
        const mdPath = join(sessionFolderPath, "session.md")
        const fs = await import("fs/promises")
        try {
          sessionSummary = await fs.readFile(mdPath, "utf-8")
        } catch {
          // No markdown file
        }
      }
    } catch {
      // Session folder issues
    }

    if (!sessionSummary) {
      sessionSummary = `**Intent**: ${session.intent || "Not specified"}\n\n`
      if (session.plan && session.plan.length > 0) {
        sessionSummary += `**Plan**:\n${session.plan.map((p) => `- ${p}`).join("\n")}\n\n`
      }
      if (session.blockers && session.blockers.length > 0) {
        sessionSummary += `**Blockers**:\n${session.blockers.map((b) => `- ${b}`).join("\n")}`
      }
    }

    if (!args.json && !args["dry-run"]) {
      output.keyValue("PR Title", details.pr.title)
      output.keyValue("Session ID", sessionId!)
      output.keyValue("Session Title", session.title || "Untitled")
      console.log()
    }

    if (args.json) {
      output.json({
        pullRequestId: args.id,
        prTitle: details.pr.title,
        sessionId: sessionId!,
        sessionTitle: session.title,
        dryRun: args["dry-run"],
      })
      return
    }

    if (args["dry-run"]) {
      output.header(`PR #${args.id}: Link Session (Dry Run)`)
      console.log()
      output.info("Session Summary:")
      console.log(sessionSummary)
      console.log()
      output.dim("Dry run - no changes made to ADO")
      return
    }

    // Post to ADO
    try {
      await postSessionWorklog(adoClient, args.id, details.repositoryId, sessionId!, sessionSummary)
      output.success("Session linked to PR")
    } catch (error) {
      if (error instanceof AdoApiError) {
        output.error(`Failed to link session: ${error.message}`)
        process.exit(1)
      }
      throw error
    }

    console.log()
    output.dim(`View PR: ${details.pr.url}`)
  },
}

/**
 * Main PR Command
 */
export const PRCommand: CommandModule = {
  command: "pr",
  describe: "Azure DevOps PR workflow commands",
  builder: (yargs) => {
    return yargs
      .command(SummarizeCommand)
      .command(ReviewCommand)
      .command(TestplanCommand)
      .command(FollowupCommand)
      .command(LinkCommand)
      .demandCommand(1, "Please specify a pr subcommand")
  },
  handler: () => {
    // This is handled by subcommands
  },
}
