/**
 * Secrets detection scanner
 * Adapted from packages/otc/src/guardrails/scanner.ts for plugin use
 */

import { readdir, readFile, stat } from "fs/promises"
import { join, relative, extname } from "path"
import type { PolicyPattern, Policies } from "./config"

// Default guardrail patterns for secrets detection
export const DEFAULT_PATTERNS: PolicyPattern[] = [
  {
    name: "AWS Access Key",
    regex: "AKIA[0-9A-Z]{16}",
    confidence: "high",
    description: "AWS Access Key ID starting with AKIA",
  },
  {
    name: "AWS Secret Key",
    regex: "(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])",
    confidence: "medium",
    description: "Potential AWS Secret Access Key (40 char base64)",
    falsePositiveIndicators: ["example", "placeholder", "your_key_here"],
  },
  {
    name: "Generic API Key Assignment",
    regex: "(api[_-]?key|apikey)\\s*[=:]\\s*['\"][A-Za-z0-9]{20,}['\"]",
    confidence: "high",
    description: "API key being assigned to a variable",
  },
  {
    name: "Password Assignment",
    regex: "(password|passwd|pwd)\\s*[=:]\\s*['\"][^'\"]{8,}['\"]",
    confidence: "medium",
    description: "Password being assigned to a variable",
    falsePositiveIndicators: ["example", "placeholder", "test", "dummy"],
  },
  {
    name: "Private Key Header",
    regex: "-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----",
    confidence: "high",
    description: "PEM-encoded private key",
  },
  {
    name: "GitHub Token",
    regex: "gh[pousr]_[A-Za-z0-9]{36,}",
    confidence: "high",
    description: "GitHub personal access token or app token",
  },
  {
    name: "Slack Token",
    regex: "xox[baprs]-[A-Za-z0-9-]{10,}",
    confidence: "high",
    description: "Slack API token",
  },
  {
    name: "Generic Secret Assignment",
    regex: "(secret|token|credential)\\s*[=:]\\s*['\"][A-Za-z0-9_\\-]{16,}['\"]",
    confidence: "medium",
    description: "Secret/token being assigned to a variable",
    falsePositiveIndicators: ["example", "placeholder", "test", "mock"],
  },
  {
    name: "Bearer Token",
    regex: "Bearer\\s+[A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+",
    confidence: "high",
    description: "JWT Bearer token in code",
  },
  {
    name: "Basic Auth Header",
    regex: "Basic\\s+[A-Za-z0-9+/=]{20,}",
    confidence: "medium",
    description: "Basic authentication header with encoded credentials",
  },
]

// General false positive context patterns
export const FALSE_POSITIVE_CONTEXTS = [
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

// File extensions to scan
export const SCANNABLE_EXTENSIONS = [
  "ts", "tsx", "js", "jsx", "py", "json", "yaml", "yml", "env", "txt", "md",
  "sh", "bash", "config", "cfg", "toml", "ini", "properties", "xml", "html",
  "go", "rs", "java", "kt", "rb", "php", "cs", "swift", "sql",
]

// Directories to skip
export const SKIP_DIRECTORIES = [
  "node_modules", ".git", "dist", "build", "__pycache__", ".venv", "venv",
  ".next", ".nuxt", "coverage", ".nyc_output", "target", "vendor",
]

// Maximum file size to scan (5MB)
const MAX_SCAN_FILE_SIZE = 5 * 1024 * 1024

export interface DetectionResult {
  file: string
  line: number
  pattern: string
  match: string
  confidence: "high" | "medium" | "low"
  patternId: string
}

export interface ScanOptions {
  patterns?: PolicyPattern[]
  excludePaths?: string[]
  excludeExtensions?: string[]
  basePath?: string
}

export interface ScanSummary {
  totalFiles: number
  filesScanned: number
  filesSkipped: number
  detections: DetectionResult[]
  highConfidence: number
  mediumConfidence: number
  lowConfidence: number
}

/**
 * Check if a regex pattern is potentially vulnerable to ReDoS
 */
function isPotentiallyDangerousRegex(pattern: string): boolean {
  // Detect nested quantifiers like (a+)+, (a*)+, (a+)*, etc.
  if (/\([^)]*[+*][^)]*\)[+*]/.test(pattern)) {
    return true
  }
  // Detect overlapping alternations with quantifiers
  if (/\([^)]*\|[^)]*\)[+*]/.test(pattern)) {
    return true
  }
  // Detect deeply nested groups with quantifiers
  const nestingDepth = (pattern.match(/\(/g) || []).length
  const hasQuantifiers = /[+*]{2,}/.test(pattern)
  if (nestingDepth > 3 && hasQuantifiers) {
    return true
  }
  return false
}

/**
 * Check if a line contains false positive indicators
 */
function isLikelyFalsePositive(line: string, pattern: PolicyPattern): boolean {
  if (pattern.falsePositiveIndicators) {
    for (const indicator of pattern.falsePositiveIndicators) {
      if (line.toLowerCase().includes(indicator.toLowerCase())) {
        return true
      }
    }
  }
  for (const fpPattern of FALSE_POSITIVE_CONTEXTS) {
    if (fpPattern.test(line)) {
      return true
    }
  }
  return false
}

/**
 * Generate a stable ID for a pattern
 */
function getPatternId(pattern: PolicyPattern): string {
  return pattern.name.toLowerCase().replace(/\s+/g, "-")
}

/**
 * Detect secrets in file content
 */
export function detectSecrets(content: string, filename: string, options: ScanOptions = {}): DetectionResult[] {
  const patterns = options.patterns || DEFAULT_PATTERNS
  const results: DetectionResult[] = []
  const lines = content.split("\n")

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    for (const pattern of patterns) {
      // Skip potentially dangerous regex patterns
      if (isPotentiallyDangerousRegex(pattern.regex)) {
        continue
      }

      try {
        const regex = new RegExp(pattern.regex, "gi")

        let match
        while ((match = regex.exec(line)) !== null) {
          // Skip likely false positives for medium/low confidence patterns
          if (pattern.confidence !== "high" && isLikelyFalsePositive(line, pattern)) {
            continue
          }

          // Truncate long matches for display
          const displayMatch = match[0].length > 40 ? match[0].substring(0, 37) + "..." : match[0]

          results.push({
            file: filename,
            line: i + 1,
            pattern: pattern.name,
            match: displayMatch,
            confidence: pattern.confidence,
            patternId: getPatternId(pattern),
          })
        }
      } catch {
        // Invalid regex, skip this pattern
      }
    }
  }

  return results
}

/**
 * Check if a file should be scanned based on extension
 */
function shouldScanFile(filename: string, excludeExtensions?: string[]): boolean {
  const ext = extname(filename).slice(1).toLowerCase()
  if (excludeExtensions?.includes(`.${ext}`)) {
    return false
  }
  if (SCANNABLE_EXTENSIONS.includes(ext)) {
    return true
  }
  // Also scan files without extensions
  if (!ext) {
    return true
  }
  return false
}

/**
 * Check if a directory should be skipped
 */
function shouldSkipDirectory(dirname: string, excludePaths?: string[]): boolean {
  if (SKIP_DIRECTORIES.includes(dirname)) {
    return true
  }
  if (excludePaths?.includes(dirname)) {
    return true
  }
  return false
}

/**
 * Scan a single file for secrets
 */
async function scanFile(filePath: string, basePath: string, options: ScanOptions): Promise<DetectionResult[]> {
  try {
    const fileStat = await stat(filePath)
    if (fileStat.size > MAX_SCAN_FILE_SIZE) {
      return []
    }
    const content = await readFile(filePath, "utf-8")
    const relativePath = relative(basePath, filePath)
    return detectSecrets(content, relativePath, options)
  } catch {
    return []
  }
}

/**
 * Scan a directory recursively for secrets
 */
async function scanDirectory(
  dirPath: string,
  basePath: string,
  options: ScanOptions,
  summary: ScanSummary
): Promise<void> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)

      if (entry.isDirectory()) {
        if (shouldSkipDirectory(entry.name, options.excludePaths)) {
          continue
        }
        await scanDirectory(fullPath, basePath, options, summary)
      } else {
        summary.totalFiles++

        if (shouldScanFile(entry.name, options.excludeExtensions)) {
          const results = await scanFile(fullPath, basePath, options)
          summary.filesScanned++
          summary.detections.push(...results)
        } else {
          summary.filesSkipped++
        }
      }
    }
  } catch {
    // Could be permission issue, skip
  }
}

/**
 * Scan a path (file or directory) for secrets
 */
export async function scan(targetPath: string, options: ScanOptions = {}): Promise<ScanSummary> {
  const summary: ScanSummary = {
    totalFiles: 0,
    filesScanned: 0,
    filesSkipped: 0,
    detections: [],
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
  }

  let targetStat
  try {
    targetStat = await stat(targetPath)
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === "ENOENT") {
      throw new Error(`Cannot scan "${targetPath}": Path does not exist`)
    }
    if (code === "EACCES") {
      throw new Error(`Cannot scan "${targetPath}": Permission denied`)
    }
    throw new Error(`Cannot scan "${targetPath}": ${error}`)
  }

  const basePath = options.basePath || (targetStat.isDirectory() ? targetPath : join(targetPath, ".."))

  if (targetStat.isDirectory()) {
    await scanDirectory(targetPath, basePath, options, summary)
  } else {
    summary.totalFiles = 1
    if (shouldScanFile(targetPath, options.excludeExtensions)) {
      const results = await scanFile(targetPath, basePath, options)
      summary.filesScanned = 1
      summary.detections.push(...results)
    } else {
      summary.filesSkipped = 1
    }
  }

  // Count by confidence
  summary.highConfidence = summary.detections.filter((d) => d.confidence === "high").length
  summary.mediumConfidence = summary.detections.filter((d) => d.confidence === "medium").length
  summary.lowConfidence = summary.detections.filter((d) => d.confidence === "low").length

  return summary
}
