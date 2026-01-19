/**
 * otc guardrail - Guardrail management commands
 *   otc guardrail scan [path] - Run secret detection on files
 *   otc guardrail list - Show active patterns
 *   otc guardrail explain <id> - Show pattern details
 */

import type { CommandModule } from "yargs"
import * as output from "../util/output"
import { findAiFolder, loadPolicies, type PolicyPattern } from "../util/config"
import { scan, getPatternById } from "../guardrails/scanner"
import { DEFAULT_PATTERNS } from "../guardrails/patterns"

interface ScanArgs {
  path?: string
  json?: boolean
}

interface ListArgs {
  json?: boolean
}

interface ExplainArgs {
  id: string
  json?: boolean
}

/**
 * Get active patterns from .ai/policies.yaml or defaults
 */
async function getPatterns(): Promise<{ patterns: PolicyPattern[]; source: "config" | "default" }> {
  const aiPath = await findAiFolder()
  if (aiPath) {
    const policies = await loadPolicies(aiPath)
    if (policies && policies.patterns.length > 0) {
      return { patterns: policies.patterns, source: "config" }
    }
  }
  return { patterns: DEFAULT_PATTERNS, source: "default" }
}

const ScanCommand: CommandModule<{}, ScanArgs> = {
  command: "scan [path]",
  describe: "Run secret detection on files, exit 1 if findings",
  builder: (yargs) => {
    return yargs
      .positional("path", {
        describe: "File or directory to scan (default: current directory)",
        type: "string",
        default: ".",
      })
      .option("json", {
        type: "boolean",
        description: "Output as JSON",
        default: false,
      })
  },
  handler: async (args) => {
    const targetPath = args.path || "."
    const { patterns, source } = await getPatterns()

    // Get exclude settings from policies
    let excludePaths: string[] | undefined
    let excludeExtensions: string[] | undefined
    const aiPath = await findAiFolder()
    if (aiPath) {
      const policies = await loadPolicies(aiPath)
      if (policies) {
        excludePaths = policies.excludePaths
        excludeExtensions = policies.excludeExtensions
      }
    }

    const summary = await scan(targetPath, {
      patterns,
      excludePaths,
      excludeExtensions,
    })

    if (args.json) {
      output.json({
        target: targetPath,
        patternsSource: source,
        ...summary,
      })
      process.exit(summary.highConfidence > 0 ? 1 : 0)
    }

    output.header("Secrets Detection Scan")
    output.keyValue("Target", targetPath)
    output.keyValue("Patterns", `${patterns.length} (${source})`)
    output.keyValue("Files scanned", String(summary.filesScanned))
    output.keyValue("Files skipped", String(summary.filesSkipped))
    console.log()

    if (summary.detections.length === 0) {
      output.success("No secrets detected")
      console.log()
      process.exit(0)
    }

    output.warning(`Found ${summary.detections.length} potential secrets`)
    output.keyValue("  High confidence", String(summary.highConfidence))
    output.keyValue("  Medium confidence", String(summary.mediumConfidence))
    output.keyValue("  Low confidence", String(summary.lowConfidence))
    console.log()

    // Group by confidence
    const highConfidence = summary.detections.filter((d) => d.confidence === "high")
    const mediumConfidence = summary.detections.filter((d) => d.confidence === "medium")
    const lowConfidence = summary.detections.filter((d) => d.confidence === "low")

    if (highConfidence.length > 0) {
      output.info("HIGH CONFIDENCE:")
      for (const detection of highConfidence) {
        console.log(`  ${detection.file}:${detection.line}`)
        output.keyValue("    Pattern", detection.pattern, 0)
        output.keyValue("    Match", detection.match, 0)
        console.log()
      }
    }

    if (mediumConfidence.length > 0) {
      output.info("MEDIUM CONFIDENCE:")
      for (const detection of mediumConfidence) {
        console.log(`  ${detection.file}:${detection.line}`)
        output.keyValue("    Pattern", detection.pattern, 0)
        output.keyValue("    Match", detection.match, 0)
        console.log()
      }
    }

    if (lowConfidence.length > 0) {
      output.info("LOW CONFIDENCE:")
      for (const detection of lowConfidence) {
        console.log(`  ${detection.file}:${detection.line}`)
        output.keyValue("    Pattern", detection.pattern, 0)
        output.keyValue("    Match", detection.match, 0)
        console.log()
      }
    }

    output.dim("Run 'otc guardrail explain <pattern-id>' for pattern details")
    console.log()

    // Exit 1 if any high confidence findings
    process.exit(summary.highConfidence > 0 ? 1 : 0)
  },
}

const ListCommand: CommandModule<{}, ListArgs> = {
  command: "list",
  describe: "Show active guardrail patterns",
  builder: (yargs) => {
    return yargs.option("json", {
      type: "boolean",
      description: "Output as JSON",
      default: false,
    })
  },
  handler: async (args) => {
    const { patterns, source } = await getPatterns()

    if (args.json) {
      output.json({ patterns, source })
      return
    }

    output.header("Active Guardrail Patterns")
    output.keyValue("Source", source === "config" ? ".ai/policies.yaml" : "built-in defaults")
    output.keyValue("Total patterns", String(patterns.length))
    console.log()

    const tableData = patterns.map((p) => ({
      id: p.name.toLowerCase().replace(/\s+/g, "-"),
      name: p.name,
      confidence: p.confidence,
    }))

    output.table(tableData, [
      { key: "id", header: "ID", width: 25 },
      { key: "name", header: "Name", width: 30 },
      { key: "confidence", header: "Confidence", width: 12 },
    ])

    console.log()
    output.dim("Run 'otc guardrail explain <id>' for pattern details")
    console.log()
  },
}

const ExplainCommand: CommandModule<{}, ExplainArgs> = {
  command: "explain <id>",
  describe: "Show pattern details and false-positive indicators",
  builder: (yargs) => {
    return yargs
      .positional("id", {
        describe: "Pattern ID (use 'otc guardrail list' to see IDs)",
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
    const { patterns, source } = await getPatterns()
    const pattern = getPatternById(patterns, args.id)

    if (!pattern) {
      output.error(`Pattern not found: ${args.id}`)
      output.dim("Run 'otc guardrail list' to see available patterns")
      process.exit(1)
    }

    if (args.json) {
      output.json({ pattern, source })
      return
    }

    output.header(`Pattern: ${pattern.name}`)
    output.keyValue("ID", args.id)
    output.keyValue("Confidence", pattern.confidence)
    output.keyValue("Source", source === "config" ? ".ai/policies.yaml" : "built-in defaults")
    console.log()

    if (pattern.description) {
      output.info("Description:")
      console.log(`  ${pattern.description}`)
      console.log()
    }

    output.info("Regular Expression:")
    console.log(`  ${pattern.regex}`)
    console.log()

    if (pattern.falsePositiveIndicators && pattern.falsePositiveIndicators.length > 0) {
      output.info("False Positive Indicators:")
      output.dim("  (Matches containing these are ignored)")
      for (const indicator of pattern.falsePositiveIndicators) {
        output.listItem(indicator, 2)
      }
      console.log()
    }

    // Show example matches
    output.info("Example Matches:")
    const examples = getExamplesForPattern(pattern)
    for (const example of examples) {
      output.listItem(example, 2)
    }
    console.log()
  },
}

/**
 * Generate example matches for a pattern
 */
function getExamplesForPattern(pattern: PolicyPattern): string[] {
  const id = pattern.name.toLowerCase().replace(/\s+/g, "-")
  const examples: Record<string, string[]> = {
    "aws-access-key": ["AKIAIOSFODNN7EXAMPLE"],
    "aws-secret-key": ["wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"],
    "generic-api-key-assignment": ['api_key = "sk_live_abcdef123456789"'],
    "password-assignment": ['password = "mysecretpassword123"'],
    "private-key-header": ["-----BEGIN RSA PRIVATE KEY-----"],
    "github-token": ["ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"],
    "slack-token": ["xoxb-XXXXXXXXXXXX-XXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX"],
    "generic-secret-assignment": ['secret = "myapplicationsecret123"'],
    "bearer-token": ["Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"],
    "basic-auth-header": ["Basic dXNlcm5hbWU6cGFzc3dvcmQ="],
  }
  return examples[id] || [`(No examples available for pattern: ${pattern.regex})`]
}

export const GuardrailCommand: CommandModule = {
  command: "guardrail",
  describe: "Manage guardrail policies and scan for secrets",
  builder: (yargs) => {
    return yargs
      .command(ScanCommand)
      .command(ListCommand)
      .command(ExplainCommand)
      .demandCommand(1, "Please specify a guardrail subcommand")
  },
  handler: () => {
    // This is handled by subcommands
  },
}
