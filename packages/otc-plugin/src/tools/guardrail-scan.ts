/**
 * Guardrail Scan Tool
 *
 * Scans files for potential secrets or policy violations.
 */

import { tool, type ToolDefinition, type PluginInput } from "@opencode-ai/plugin"
import type { OTCPluginState } from "../index"
import { scan, DEFAULT_PATTERNS } from "../lib/scanner"

export function createGuardrailScanTool(state: OTCPluginState, input: PluginInput): ToolDefinition {
  return tool({
    description:
      "Scan files for potential secrets or policy violations. " +
      "Use this when the user asks to check for secrets, scan for credentials, " +
      "or audit code for sensitive data.",
    args: {
      path: tool.schema
        .string()
        .optional()
        .describe("Path to scan (defaults to current directory)"),
    },
    async execute({ path: scanPath }, ctx) {
      try {
        const targetPath = scanPath || input.directory

        // Get patterns from policies or use defaults
        const patterns = state.policies?.patterns?.length
          ? state.policies.patterns
          : DEFAULT_PATTERNS

        const summary = await scan(targetPath, {
          patterns,
          excludePaths: state.policies?.excludePaths,
          excludeExtensions: state.policies?.excludeExtensions,
        })

        // Build result message
        const lines: string[] = []
        lines.push(`## Guardrail Scan Results`)
        lines.push("")
        lines.push(`**Path**: ${targetPath}`)
        lines.push(`**Files scanned**: ${summary.filesScanned}`)
        lines.push(`**Files skipped**: ${summary.filesSkipped}`)
        lines.push("")
        lines.push(`### Detections`)
        lines.push(`- 🔴 High confidence: ${summary.highConfidence}`)
        lines.push(`- 🟡 Medium confidence: ${summary.mediumConfidence}`)
        lines.push(`- 🔵 Low confidence: ${summary.lowConfidence}`)

        if (summary.detections.length > 0) {
          lines.push("")
          lines.push(`### Details`)

          // Group by confidence level
          const highFindings = summary.detections.filter((d) => d.confidence === "high")
          const mediumFindings = summary.detections.filter((d) => d.confidence === "medium")
          const lowFindings = summary.detections.filter((d) => d.confidence === "low")

          if (highFindings.length > 0) {
            lines.push("")
            lines.push(`#### 🔴 High Confidence (must fix)`)
            for (const finding of highFindings.slice(0, 10)) {
              lines.push(`- **${finding.file}:${finding.line}**: ${finding.pattern}`)
              lines.push(`  Match: \`${finding.match}\``)
            }
            if (highFindings.length > 10) {
              lines.push(`  ... and ${highFindings.length - 10} more`)
            }
          }

          if (mediumFindings.length > 0) {
            lines.push("")
            lines.push(`#### 🟡 Medium Confidence (review recommended)`)
            for (const finding of mediumFindings.slice(0, 5)) {
              lines.push(`- **${finding.file}:${finding.line}**: ${finding.pattern}`)
            }
            if (mediumFindings.length > 5) {
              lines.push(`  ... and ${mediumFindings.length - 5} more`)
            }
          }

          if (lowFindings.length > 0) {
            lines.push("")
            lines.push(`#### 🔵 Low Confidence (informational)`)
            lines.push(`  ${lowFindings.length} low confidence findings (not shown)`)
          }
        } else {
          lines.push("")
          lines.push(`✅ No secrets or policy violations detected.`)
        }

        return lines.join("\n")
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return `Failed to scan: ${message}`
      }
    },
  })
}
