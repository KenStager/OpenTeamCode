/**
 * Guardrails Hook
 *
 * Blocks file write operations that contain secrets or sensitive data.
 * Uses the permission.ask hook to intercept write/edit tool permissions.
 */

import type { Hooks } from "@opencode-ai/plugin"
import type { OTCPluginState } from "../index"
import { detectSecrets, DEFAULT_PATTERNS } from "../lib/scanner"

/**
 * Create the guardrails hook
 */
export function guardrailsHook(
  state: OTCPluginState
): NonNullable<Hooks["permission.ask"]> {
  return async (info, output) => {
    // Skip if guardrails are disabled
    if (state.config?.guardrails?.enabled === false) {
      return
    }

    // Only intercept file write/edit permissions
    // Permission types for file operations include patterns like "file.write" or tool names
    const isWriteOperation =
      info.type === "file.write" ||
      info.type === "file.edit" ||
      (info.metadata && (info.metadata.tool === "Write" || info.metadata.tool === "Edit"))

    if (!isWriteOperation) {
      return
    }

    // Get the content being written
    // The content may be in different places depending on the tool:
    // - Write tool: metadata.content
    // - Edit tool: metadata.new_string
    const content =
      (info.metadata?.content as string) ||
      (info.metadata?.new_string as string) ||
      ""

    if (!content || typeof content !== "string") {
      return
    }

    // Get patterns from policies or use defaults
    const patterns = state.policies?.patterns?.length
      ? state.policies.patterns
      : DEFAULT_PATTERNS

    // Scan the content for secrets
    const filename = (info.metadata?.path as string) || "inline-check"
    const findings = detectSecrets(content, filename, { patterns })

    // Only block on high confidence detections
    const highConfidenceFindings = findings.filter((f) => f.confidence === "high")

    if (highConfidenceFindings.length > 0) {
      // DENY the write operation
      output.status = "deny"

      // Build detailed feedback message
      const filePath = (info.metadata?.path as string) || "file"
      const findingsList = highConfidenceFindings
        .map((f) => `  • ${f.pattern} at line ${f.line}: ${f.match.substring(0, 40)}...`)
        .join("\n")

      const feedbackMessage =
        `\n╔══════════════════════════════════════════════════════════════╗\n` +
        `║  🛑 OTC GUARDRAIL: Write operation blocked                   ║\n` +
        `╠══════════════════════════════════════════════════════════════╣\n` +
        `║  File: ${filePath.substring(0, 50).padEnd(50)}  ║\n` +
        `║  Detected secrets (high confidence):                        ║\n` +
        `╚══════════════════════════════════════════════════════════════╝\n` +
        `${findingsList}\n\n` +
        `To proceed, remove the sensitive data or add to .ai/policies.yaml excludes.\n`

      // Log to stderr for visibility (appears in terminal)
      console.error(feedbackMessage)

      // Add reason field (forward-compatible if OpenCode adds support)
      ;(output as { status: string; reason?: string }).reason =
        `Blocked: detected ${highConfidenceFindings.length} secret(s) in ${filePath}`
    }

    // For medium confidence findings, we could add a warning but allow the operation
    // This is a balance between security and usability
    const mediumConfidenceFindings = findings.filter((f) => f.confidence === "medium")
    if (mediumConfidenceFindings.length > 0 && highConfidenceFindings.length === 0) {
      const filePath = (info.metadata?.path as string) || "file"
      const findingsList = mediumConfidenceFindings
        .map((f) => `  • ${f.pattern} at line ${f.line}: ${f.match.substring(0, 40)}...`)
        .join("\n")

      const warningMessage =
        `\n⚠️  OTC GUARDRAIL WARNING (medium confidence)\n` +
        `   File: ${filePath}\n` +
        `   Potential secrets detected:\n` +
        `${findingsList}\n` +
        `   Operation allowed - please verify these are not actual secrets.\n`

      console.warn(warningMessage)
      // Don't block, just warn
    }
  }
}
