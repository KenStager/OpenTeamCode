/**
 * Secrets Detection Prototype
 * For Phase 0 validation - not production code
 *
 * Run with: bun run validation/q003-guardrails/prototype.ts <file-or-directory>
 */

import { readdir, readFile, stat } from "fs/promises"
import { join, relative } from "path"

interface DetectionResult {
  file: string
  line: number
  pattern: string
  match: string
  confidence: "high" | "medium" | "low"
}

interface Pattern {
  name: string
  regex: RegExp
  confidence: "high" | "medium" | "low"
  contextRequired?: boolean
}

const PATTERNS: Pattern[] = [
  {
    name: "AWS Access Key",
    regex: /AKIA[0-9A-Z]{16}/g,
    confidence: "high",
  },
  {
    name: "AWS Secret Key",
    regex: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/g,
    confidence: "medium",
    contextRequired: true, // Needs surrounding context validation
  },
  {
    name: "Generic API Key Assignment",
    regex: /(api[_-]?key|apikey)\s*[=:]\s*['"][A-Za-z0-9]{20,}['"]/gi,
    confidence: "high",
  },
  {
    name: "Password Assignment",
    regex: /(password|passwd|pwd)\s*[=:]\s*['"][^'"]{8,}['"]/gi,
    confidence: "medium",
  },
  {
    name: "Private Key Header",
    regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    confidence: "high",
  },
  {
    name: "GitHub Token",
    regex: /gh[pousr]_[A-Za-z0-9]{36,}/g,
    confidence: "high",
  },
  {
    name: "Slack Token",
    regex: /xox[baprs]-[A-Za-z0-9-]{10,}/g,
    confidence: "high",
  },
  {
    name: "Generic Secret Assignment",
    regex: /(secret|token|credential)\s*[=:]\s*['"][A-Za-z0-9_\-]{16,}['"]/gi,
    confidence: "medium",
  },
  {
    name: "Bearer Token",
    regex: /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g,
    confidence: "high",
  },
  {
    name: "Basic Auth Header",
    regex: /Basic\s+[A-Za-z0-9+/=]{20,}/g,
    confidence: "medium",
  },
]

// Context patterns that indicate a false positive
const FALSE_POSITIVE_CONTEXTS = [
  /example/i,
  /placeholder/i,
  /your[_-]?key[_-]?here/i,
  /xxx+/i,
  /test[_-]?key/i,
  /dummy/i,
  /fake/i,
  /mock/i,
  /sample/i,
]

function isLikelyFalsePositive(line: string, match: string): boolean {
  // Check if the line contains false positive indicators
  for (const fpPattern of FALSE_POSITIVE_CONTEXTS) {
    if (fpPattern.test(line)) {
      return true
    }
  }

  // Check if it's in a comment
  const trimmed = line.trim()
  if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) {
    // Comments are lower confidence but still flagged
    return false
  }

  return false
}

export function detectSecrets(content: string, filename: string): DetectionResult[] {
  const results: DetectionResult[] = []
  const lines = content.split("\n")

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    for (const pattern of PATTERNS) {
      // Reset regex state
      pattern.regex.lastIndex = 0

      let match
      while ((match = pattern.regex.exec(line)) !== null) {
        // Skip likely false positives for medium confidence patterns
        if (pattern.confidence === "medium" && isLikelyFalsePositive(line, match[0])) {
          continue
        }

        // Truncate long matches for display
        const displayMatch = match[0].length > 30 ? match[0].substring(0, 27) + "..." : match[0]

        results.push({
          file: filename,
          line: i + 1,
          pattern: pattern.name,
          match: displayMatch,
          confidence: pattern.confidence,
        })
      }
    }
  }

  return results
}

async function scanFile(filePath: string, basePath: string): Promise<DetectionResult[]> {
  try {
    const content = await readFile(filePath, "utf-8")
    const relativePath = relative(basePath, filePath)
    return detectSecrets(content, relativePath)
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error)
    return []
  }
}

async function scanDirectory(dirPath: string, basePath: string): Promise<DetectionResult[]> {
  const results: DetectionResult[] = []

  try {
    const entries = await readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)

      // Skip common non-code directories
      if (entry.isDirectory()) {
        if (["node_modules", ".git", "dist", "build", "__pycache__"].includes(entry.name)) {
          continue
        }
        const subResults = await scanDirectory(fullPath, basePath)
        results.push(...subResults)
      } else {
        // Only scan text-like files
        const ext = entry.name.split(".").pop()?.toLowerCase()
        if (
          ["ts", "js", "py", "json", "yaml", "yml", "env", "txt", "md", "sh", "bash", "config", "cfg"].includes(
            ext || "",
          )
        ) {
          const fileResults = await scanFile(fullPath, basePath)
          results.push(...fileResults)
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error)
  }

  return results
}

async function main() {
  const target = process.argv[2]

  if (!target) {
    console.log("Usage: bun run prototype.ts <file-or-directory>")
    console.log("")
    console.log("Examples:")
    console.log("  bun run prototype.ts corpus/true-positives/")
    console.log("  bun run prototype.ts corpus/true-negatives/")
    console.log("  bun run prototype.ts some-file.py")
    process.exit(1)
  }

  const targetStat = await stat(target)
  let results: DetectionResult[]

  if (targetStat.isDirectory()) {
    console.log(`Scanning directory: ${target}`)
    results = await scanDirectory(target, target)
  } else {
    console.log(`Scanning file: ${target}`)
    results = await scanFile(target, ".")
  }

  // Group results by confidence
  const highConfidence = results.filter((r) => r.confidence === "high")
  const mediumConfidence = results.filter((r) => r.confidence === "medium")

  console.log("\n" + "=".repeat(80))
  console.log("SECRETS DETECTION RESULTS")
  console.log("=".repeat(80))

  console.log(`\nTotal Detections: ${results.length}`)
  console.log(`  High Confidence: ${highConfidence.length}`)
  console.log(`  Medium Confidence: ${mediumConfidence.length}`)

  if (highConfidence.length > 0) {
    console.log("\n--- HIGH CONFIDENCE ---")
    for (const r of highConfidence) {
      console.log(`  ${r.file}:${r.line} - ${r.pattern}`)
      console.log(`    Match: ${r.match}`)
    }
  }

  if (mediumConfidence.length > 0) {
    console.log("\n--- MEDIUM CONFIDENCE ---")
    for (const r of mediumConfidence) {
      console.log(`  ${r.file}:${r.line} - ${r.pattern}`)
      console.log(`    Match: ${r.match}`)
    }
  }

  if (results.length === 0) {
    console.log("\nNo secrets detected.")
  }

  // Return exit code based on high confidence findings
  process.exit(highConfidence.length > 0 ? 1 : 0)
}

main().catch(console.error)
