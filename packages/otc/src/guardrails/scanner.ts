/**
 * Secrets detection scanner
 * Productionized from validation/q003-guardrails/prototype.ts
 */

import { readdir, readFile, stat } from "fs/promises"
import { join, relative, extname } from "path"
import type { PolicyPattern, Policies } from "../util/config"
import { DEFAULT_PATTERNS, FALSE_POSITIVE_CONTEXTS, SCANNABLE_EXTENSIONS, SKIP_DIRECTORIES } from "./patterns"

// Maximum file size to scan (5MB) - skip larger files to prevent memory exhaustion
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
 * Check if a line contains false positive indicators
 */
function isLikelyFalsePositive(line: string, pattern: PolicyPattern): boolean {
  // Check pattern-specific false positive indicators
  if (pattern.falsePositiveIndicators) {
    for (const indicator of pattern.falsePositiveIndicators) {
      if (line.toLowerCase().includes(indicator.toLowerCase())) {
        return true
      }
    }
  }

  // Check general false positive patterns
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

  // Check if explicitly excluded
  if (excludeExtensions?.includes(`.${ext}`)) {
    return false
  }

  // Check if it's a known scannable extension
  if (SCANNABLE_EXTENSIONS.includes(ext)) {
    return true
  }

  // Also scan files without extensions (could be scripts, configs)
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
    // Check file size before reading to prevent memory exhaustion
    const fileStat = await stat(filePath)
    if (fileStat.size > MAX_SCAN_FILE_SIZE) {
      return [] // Skip large files
    }

    const content = await readFile(filePath, "utf-8")
    const relativePath = relative(basePath, filePath)
    return detectSecrets(content, relativePath, options)
  } catch {
    // Could be binary file or permission issue, skip
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

/**
 * Load patterns from policies config
 */
export function patternsFromPolicies(policies: Policies): PolicyPattern[] {
  return policies.patterns
}

/**
 * Get a pattern by ID
 */
export function getPatternById(patterns: PolicyPattern[], id: string): PolicyPattern | undefined {
  return patterns.find((p) => getPatternId(p) === id)
}
