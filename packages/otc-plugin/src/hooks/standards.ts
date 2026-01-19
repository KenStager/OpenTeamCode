/**
 * Standards Injection Hook
 *
 * Injects team coding standards from .ai/standards.md into the system prompt.
 * This ensures the AI follows team conventions and best practices.
 */

import type { Hooks } from "@opencode-ai/plugin"
import type { OTCPluginState } from "../index"

/**
 * Sanitize content to prevent prompt injection attacks.
 * Escapes patterns that could be interpreted as prompt delimiters.
 */
function sanitizeContent(content: string): string {
  return content
    .replace(/<system>/gi, "&lt;system&gt;")
    .replace(/<\/system>/gi, "&lt;/system&gt;")
    .replace(/<user>/gi, "&lt;user&gt;")
    .replace(/<\/user>/gi, "&lt;/user&gt;")
    .replace(/<assistant>/gi, "&lt;assistant&gt;")
    .replace(/<\/assistant>/gi, "&lt;/assistant&gt;")
    .replace(/<human>/gi, "&lt;human&gt;")
    .replace(/<\/human>/gi, "&lt;/human&gt;")
}

/**
 * Create the standards injection hook
 */
export function standardsHook(
  state: OTCPluginState
): NonNullable<Hooks["experimental.chat.system.transform"]> {
  return async ({ sessionID }, output) => {
    // Skip if no standards configured
    if (!state.standards) {
      return
    }

    // Sanitize standards content to prevent prompt injection
    const sanitizedStandards = sanitizeContent(state.standards)

    // Inject standards into system prompt
    const standardsSection = `
## Team Standards (OpenTeamCode)

The following are your team's coding standards. Follow these guidelines strictly:

${sanitizedStandards}

---
`

    // Push to the system prompt array
    output.system.push(standardsSection)
  }
}
